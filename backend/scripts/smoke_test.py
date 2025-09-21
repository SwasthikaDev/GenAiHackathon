#!/usr/bin/env python3
"""
End-to-end backend smoke test for GlobalTrotters API.

Usage:
  python scripts/smoke_test.py --base https://mako-golden-tetra.ngrok-free.app/api

This script will:
  - Sign up a unique user (or login if exists)
  - Call username availability
  - Call personalized recommendations (LLM; falls back to cache/fallback)
  - Search cities (Nominatim via backend) and ensure a city in DB
  - Create a trip (optionally with origin_city_id)
  - Add a stop and an activity
  - Fetch budget and share the trip
  - Fetch public itinerary by slug
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional

import requests


@dataclass
class Session:
    base: str
    access: Optional[str] = None
    refresh: Optional[str] = None

    def url(self, path: str) -> str:
        if path.startswith("http"):
            return path
        if not path.startswith("/"):
            path = "/" + path
        return self.base.rstrip("/") + path

    def headers(self, auth: bool = False) -> Dict[str, str]:
        h = {"Content-Type": "application/json"}
        if auth and self.access:
            h["Authorization"] = f"Bearer {self.access}"
        return h

    def req(self, method: str, path: str, *, auth: bool = False, **kw) -> requests.Response:
        url = self.url(path)
        if "headers" not in kw:
            kw["headers"] = self.headers(auth)
        kw.setdefault("timeout", 30)
        return requests.request(method.upper(), url, **kw)


def pretty(title: str, obj: Any) -> None:
    print(f"\n=== {title} ===")
    try:
        print(json.dumps(obj, indent=2))
    except Exception:
        print(obj)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default=os.getenv("BASE_URL", "http://localhost:8000/api"), help="Base API URL, e.g., https://.../api")
    parser.add_argument("--city_q", default="Paris", help="City search query")
    parser.add_argument("--skip-recs", action="store_true", help="Skip personalized recs step (useful if OpenRouter is slow)")
    args = parser.parse_args()

    s = Session(base=args.base)
    ts = int(time.time())
    username = f"smoke_{ts}"
    password = "SmokeTest!234"

    # 1) Username availability
    r = s.req("GET", f"/accounts/check-username?username={username}")
    pretty("check-username", {"status": r.status_code, "body": safe_json(r)})

    # 2) Signup (or fallback to login if already exists)
    r = s.req("POST", "/accounts/signup", json={"username": username, "password": password, "email": f"{username}@example.com"})
    if r.status_code == 201:
        pretty("signup", safe_json(r))
    else:
        pretty("signup_failed", {"status": r.status_code, "body": safe_json(r)})

    # 3) Login to get tokens
    r = s.req("POST", "/accounts/login", json={"username": username, "password": password})
    if r.ok:
        body = r.json()
        s.access = body.get("access")
        s.refresh = body.get("refresh")
    pretty("login", {"status": r.status_code, "body": safe_json(r)})
    if not s.access:
        print("No access token; aborting")
        return 1

    # 4) Personalized recs (force fresh once)
    if not args.skip_recs:
        try:
            r = s.req("POST", "/recs/personalized/?force=1", auth=True, timeout=60)
            pretty("recs", {"status": r.status_code, "body": safe_json(r)})
        except requests.exceptions.RequestException as ex:
            pretty("recs_error", {"error": str(ex)})

    # 5) Search cities
    q = args.city_q
    r = s.req("GET", f"/search/cities?q={q}")
    cities = safe_json(r) or []
    pretty("search_cities", {"status": r.status_code, "count": len(cities), "sample": cities[:2]})
    if not cities:
        print("No cities returned; aborting")
        return 1
    first_city = cities[0]

    # 6) Ensure city in our DB
    ensure_payload = {"name": first_city.get("name"), "country": first_city.get("country", ""), "region": ""}
    r = s.req("POST", "/cities/ensure/", json=ensure_payload, auth=True)
    ensured = safe_json(r)
    pretty("ensure_city", {"status": r.status_code, "body": ensured})
    city_id = ensured.get("id") if isinstance(ensured, dict) else None

    # 7) Create trip
    trip_payload = {
        "name": f"Smoke Trip {ts}",
        "start_date": "2025-09-10",
        "end_date": "2025-09-14",
    }
    if city_id:
        trip_payload["origin_city_id"] = city_id
    r = s.req("POST", "/trips/", json=trip_payload, auth=True)
    trip = safe_json(r)
    pretty("create_trip", {"status": r.status_code, "body": trip})
    if not r.ok:
        return 1
    trip_id = trip.get("id")

    # 8) Add stop
    r = s.req("POST", f"/trips/{trip_id}/stops/", json={
        "city_id": city_id,
        "start_date": "2025-09-10",
        "end_date": "2025-09-12",
        "order": 1,
    }, auth=True)
    stop = safe_json(r)
    pretty("add_stop", {"status": r.status_code, "body": stop})
    stop_id = stop.get("id") if isinstance(stop, dict) else None

    # 9) Add activity
    if stop_id:
        r = s.req("POST", f"/trips/{trip_id}/stops/{stop_id}/activities/", json={
            "title": "Walking Tour",
            "category": "sightseeing",
            "cost_amount": 2500,
            "currency": "INR",
        }, auth=True)
        pretty("add_activity", {"status": r.status_code, "body": safe_json(r)})

    # 10) Budget summary
    r = s.req("GET", f"/trips/{trip_id}/budget", auth=True)
    pretty("budget", {"status": r.status_code, "body": safe_json(r)})

    # 11) Share trip
    r = s.req("POST", f"/trips/{trip_id}/share/", auth=True)
    shared = safe_json(r)
    pretty("share", {"status": r.status_code, "body": shared})
    slug = shared.get("public_slug") if isinstance(shared, dict) else None

    # 12) Fetch public
    if slug:
        r = s.req("GET", f"/public/itineraries/{slug}")
        pretty("public_itinerary", {"status": r.status_code, "body": safe_json(r)})

    print("\nSmoke test complete.")
    return 0


def safe_json(r: requests.Response) -> Any:
    try:
        return r.json()
    except Exception:
        return r.text


if __name__ == "__main__":
    sys.exit(main())


