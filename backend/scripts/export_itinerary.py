#!/usr/bin/env python3
"""
Export a trip itinerary to a timestamped JSON file by trip id or public slug.

Usage:
  python scripts/export_itinerary.py --base https://.../api --trip-id 123 --token <ACCESS_TOKEN>
  python scripts/export_itinerary.py --base https://.../api --slug <public_slug>
"""
from __future__ import annotations

import argparse
import json
import os
from datetime import datetime
from typing import Any, Dict

import requests


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--base", required=True, help="API base, e.g. https://.../api")
    p.add_argument("--trip-id", type=int)
    p.add_argument("--slug")
    p.add_argument("--token", help="Bearer token for private trips")
    args = p.parse_args()

    if not args.trip_id and not args.slug:
        print("Provide --trip-id or --slug")
        return 1
    headers: Dict[str, str] = {}
    if args.token:
        headers["Authorization"] = f"Bearer {args.token}"

    if args.trip_id:
        url = f"{args.base.rstrip('/')}/trips/{args.trip_id}/"
    else:
        url = f"{args.base.rstrip('/')}/public/itineraries/{args.slug}"

    r = requests.get(url, headers=headers, timeout=30)
    r.raise_for_status()
    data: Any = r.json()

    out_dir = os.getenv("TEST_OUTPUT_DIR", "test_output")
    os.makedirs(out_dir, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    name = f"itinerary_{args.trip_id or args.slug}_{ts}.json"
    path = os.path.join(out_dir, name)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


