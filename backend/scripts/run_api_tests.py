#!/usr/bin/env python3
"""
API test harness for GlobalTrotters backend.

- Runs critical flows end-to-end against a base API URL
- Writes machine-readable results to test_results.json
- Writes human-readable summary to test_report.txt
- Exits non-zero on failures

Usage:
  python scripts/run_api_tests.py --base https://.../api [--with-recs]
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime
from typing import Any, Dict, Optional

import requests


class Session:
    def __init__(self, base: str):
        self.base = base.rstrip("/")
        self.access: Optional[str] = None
        self.refresh: Optional[str] = None
        self.trace: list[Dict[str, Any]] = []

    def url(self, path: str) -> str:
        if path.startswith("http"):
            return path
        if not path.startswith("/"):
            path = "/" + path
        return self.base + path

    def headers(self, auth: bool = False) -> Dict[str, str]:
        h = {"Content-Type": "application/json"}
        if auth and self.access:
            h["Authorization"] = f"Bearer {self.access}"
        return h

    def req(self, method: str, path: str, *, auth: bool = False, timeout: int = 30, **kw) -> requests.Response:
        url = self.url(path)
        hdrs = self.headers(auth)
        # merge headers
        h2 = kw.get("headers") or {}
        if h2:
            hdrs.update(h2)
        kw["headers"] = hdrs
        kw.setdefault("timeout", timeout)
        record: Dict[str, Any] = {
            "method": method.upper(),
            "url": url,
            "auth": bool(auth and self.access),
        }
        if "json" in kw:
            record["request_json"] = kw["json"]
        try:
            res = requests.request(method.upper(), url, **kw)
            record["status"] = res.status_code
            # capture response body
            try:
                record["response_json"] = res.json()
            except Exception:
                record["response_text"] = res.text
            return res
        finally:
            self.trace.append(record)


def expect(cond: bool, label: str, details: Any, out: Dict[str, Any]):
    out.setdefault("checks", {})[label] = {
        "pass": bool(cond),
        "details": details,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default=os.getenv("BASE_URL", "http://localhost:8000/api"))
    parser.add_argument("--with-recs", action="store_true", help="Exercise the /recs/personalized/ endpoint too")
    args = parser.parse_args()

    s = Session(args.base)
    ts = int(time.time())
    username = f"apitest_{ts}"
    password = "ApiTest!234"

    results: Dict[str, Any] = {"base": s.base, "username": username}

    # 1) Check username availability
    r = s.req("GET", f"/accounts/check-username?username={username}")
    body = safe_json(r)
    results["check_username"] = {"status": r.status_code, "body": body}
    expect(r.status_code == 200 and isinstance(body, dict) and body.get("available") is True,
           "check_username_ok", results["check_username"], results)

    # 2) Signup
    signup_payload = {
        "username": username,
        "password": password,
        "email": f"{username}@example.com",
        "first_name": "API",
        "last_name": "Tester",
        "display_name": "API Tester",
        "avatar_url": "https://i.pravatar.cc/100?img=5",
        "phone_number": "+1-555-0100",
        "city": "Bengaluru",
        "country": "India",
        "bio": "Automated API test user",
    }
    r = s.req("POST", "/accounts/signup", json=signup_payload)
    body = safe_json(r)
    results["signup"] = {"status": r.status_code, "body": body}
    expect(r.status_code in (201, 400), "signup_status_ok", results["signup"], results)

    # 3) Login
    r = s.req("POST", "/accounts/login", json={"username": username, "password": password})
    body = safe_json(r)
    results["login"] = {"status": r.status_code, "body": redact_tokens(body)}
    access = body.get("access") if isinstance(body, dict) else None
    if access:
        s.access = access
        s.refresh = body.get("refresh")
    expect(r.status_code == 200 and isinstance(body, dict) and access,
           "login_ok", results["login"], results)

    # 4) Recs (optional)
    if args.with_recs:
        try:
            r = s.req("POST", "/recs/personalized/?force=1", auth=True, timeout=90)
            body = safe_json(r)
            results["recs"] = {"status": r.status_code, "body": body if isinstance(body, dict) else str(body)}
            expect(r.status_code == 200 and isinstance(body, dict) and "bannerTitle" in body,
                   "recs_ok", results["recs"], results)
        except requests.exceptions.RequestException as ex:
            results["recs_error"] = str(ex)
            expect(False, "recs_ok", {"error": str(ex)}, results)

    # 5) City search
    r = s.req("GET", "/search/cities?q=Paris")
    body = safe_json(r)
    results["search_cities"] = {"status": r.status_code, "count": len(body) if isinstance(body, list) else None}
    ok_search = r.status_code == 200 and isinstance(body, list) and len(body) >= 1
    expect(ok_search, "search_cities_ok", results["search_cities"], results)
    first_city = body[0] if ok_search else {"name": "Paris", "country": "France"}

    # 6) Ensure city
    r = s.req("POST", "/cities/ensure/", auth=True, json={
        "name": first_city.get("name"),
        "country": first_city.get("country") or "",
        "region": first_city.get("region") or "",
        "cost_index": 3,
        "popularity": 4,
    })
    body = safe_json(r)
    results["ensure_city"] = {"status": r.status_code, "body": body}
    city_id = body.get("id") if isinstance(body, dict) else None
    expect(r.status_code == 200 and city_id,
           "ensure_city_ok", results["ensure_city"], results)

    # 7) Create trip
    r = s.req("POST", "/trips/", auth=True, json={
        "name": f"API Test Trip {ts}",
        "start_date": "2025-09-10",
        "end_date": "2025-09-14",
        "origin_city_id": city_id,
    })
    body = safe_json(r)
    results["create_trip"] = {"status": r.status_code, "body": body}
    trip_id = body.get("id") if isinstance(body, dict) else None
    expect(r.status_code == 201 and trip_id,
           "create_trip_ok", results["create_trip"], results)

    # 8) Generate itinerary (auto)
    r = s.req("POST", f"/trips/{trip_id}/generate/", auth=True, json={"days_per_city": 2, "currency": "INR"}, timeout=120)
    body = safe_json(r)
    results["generate"] = {"status": r.status_code, "body_keys": list(body.keys()) if isinstance(body, dict) else str(type(body))}
    expect(r.status_code == 200,
           "generate_ok", results["generate"], results)

    # 9) Add stop (manual customization after auto-gen)
    r = s.req("POST", f"/trips/{trip_id}/stops/", auth=True, json={
        "city_id": city_id,
        "start_date": "2025-09-10",
        "end_date": "2025-09-12",
        "order": 1,
    })
    body = safe_json(r)
    results["add_stop"] = {"status": r.status_code, "body": body}
    stop_id = body.get("id") if isinstance(body, dict) else None
    expect(r.status_code == 201 and stop_id,
        "add_stop_ok", results["add_stop"], results)

    # 10) Add activity
    r = s.req("POST", f"/trips/{trip_id}/stops/{stop_id}/activities/", auth=True, json={
        "title": "Walking Tour",
        "category": "sightseeing",
        "cost_amount": 2500,
        "currency": "INR",
    })
    body = safe_json(r)
    results["add_activity"] = {"status": r.status_code, "body": body}
    expect(r.status_code == 201,
           "add_activity_ok", results["add_activity"], results)

    # 11) Reorder stops
    r = s.req("POST", f"/trips/{trip_id}/stops/reorder/", auth=True, json={"order": [stop_id]})
    body = safe_json(r)
    results["reorder"] = {"status": r.status_code, "body_keys": list(body.keys()) if isinstance(body, dict) else str(type(body))}
    expect(r.status_code == 200,
           "reorder_ok", results["reorder"], results)

    # 12) Budget
    r = s.req("GET", f"/trips/{trip_id}/budget", auth=True)
    body = safe_json(r)
    results["budget"] = {"status": r.status_code, "body": body}
    expect(r.status_code == 200 and isinstance(body, dict),
           "budget_ok", results["budget"], results)

    # 12b) Budget summary
    r = s.req("GET", f"/trips/{trip_id}/budget/summary", auth=True)
    body = safe_json(r)
    results["budget_summary"] = {"status": r.status_code, "body_keys": list(body.keys()) if isinstance(body, dict) else str(type(body))}
    expect(
        r.status_code == 200 and isinstance(body, dict) and all(k in body for k in ["currency", "total_minor", "categories", "per_city"]),
        "budget_summary_ok", results["budget_summary"], results
    )

    # 13) Calendar (day-wise)
    r = s.req("GET", f"/trips/{trip_id}/calendar", auth=True)
    body = safe_json(r)
    results["calendar"] = {"status": r.status_code, "keys": list(body.keys()) if isinstance(body, dict) else str(type(body))}
    expect(
        r.status_code == 200 and isinstance(body, dict) and isinstance(body.get("days"), list),
        "calendar_ok", results["calendar"], results
    )

    # 14) Share
    r = s.req("POST", f"/trips/{trip_id}/share/", auth=True)
    body = safe_json(r)
    slug = body.get("public_slug") if isinstance(body, dict) else None
    results["share"] = {"status": r.status_code, "body": body}
    expect(r.status_code == 200 and slug,
           "share_ok", results["share"], results)

    # 15) Public fetch
    r = s.req("GET", f"/public/itineraries/{slug}")
    body = safe_json(r)
    results["public"] = {"status": r.status_code, "body_sample_keys": list(body.keys())[:6] if isinstance(body, dict) else str(type(body))}
    expect(r.status_code == 200,
           "public_ok", results["public"], results)

    # 16) Copy public to my trips
    r = s.req("POST", f"/public/itineraries/{slug}/copy", auth=True)
    body = safe_json(r)
    results["copy"] = {"status": r.status_code, "body": body}
    new_trip_id = body.get("trip_id") if isinstance(body, dict) else None
    expect(r.status_code == 200 and new_trip_id,
           "copy_ok", results["copy"], results)

    # Evaluate
    failed = [k for k, v in results.get("checks", {}).items() if not v.get("pass")]

    # Prepare output dir and timestamped filenames
    out_dir = os.getenv("TEST_OUTPUT_DIR", "test_output")
    os.makedirs(out_dir, exist_ok=True)
    ts_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_path = os.path.join(out_dir, f"test_results_{ts_str}.json")
    report_path = os.path.join(out_dir, f"test_report_{ts_str}.txt")

    # Write files
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2)
    with open(report_path, "w") as f:
        if failed:
            f.write("FAIL\n")
            for k in failed:
                f.write(f"- {k}: {results['checks'][k]['details']}\n")
        else:
            f.write("PASS\n")

    # Write trace file
    trace_path = os.path.join(out_dir, f"test_trace_{ts_str}.json")
    with open(trace_path, "w") as f:
        json.dump(s.trace, f, indent=2)

    print(f"\nWrote {results_path}, {report_path}, and {trace_path}")
    if failed:
        print(f"Failed checks: {failed}")
        return 1
    print("All checks passed")
    return 0


def safe_json(r: requests.Response) -> Any:
    try:
        return r.json()
    except Exception:
        return r.text


def redact_tokens(body: Any) -> Any:
    if isinstance(body, dict):
        red = dict(body)
        if "access" in red:
            red["access"] = "<redacted>"
        if "refresh" in red:
            red["refresh"] = "<redacted>"
        return red
    return body


if __name__ == "__main__":
    sys.exit(main())


