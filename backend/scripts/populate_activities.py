#!/usr/bin/env python3
"""
Populate ActivityCatalog with sample activities per city (ORM-based; no seed_demo).

Usage:
  python scripts/populate_activities.py [--flush]

Env:
  DJANGO_SETTINGS_MODULE=gt_backend.settings (set automatically if run from backend/ with PYTHONPATH=.)
"""
from __future__ import annotations

import argparse
import os
import sys
from typing import Dict, List

try:
    import django
except ImportError:
    print("Run from backend with venv: source .venv/bin/activate")
    sys.exit(1)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "gt_backend.settings")
sys.path.insert(0, ".")
django.setup()

from trips.models import City, ActivityCatalog  # noqa: E402


def ensure_city(name: str, country: str, region: str = "") -> City:
    city, _ = City.objects.get_or_create(name=name, country=country, defaults={"region": region})
    return city


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--flush", action="store_true", help="Delete all ActivityCatalog first")
    args = parser.parse_args()

    if args.flush:
        ActivityCatalog.objects.all().delete()

    plan: Dict[str, Dict] = {
        "Paris,France": {
            "city": ("Paris", "France"),
            "acts": [
                ("Louvre Museum Pass", "culture", 3500, 180),
                ("Seine River Cruise", "sightseeing", 3000, 60),
                ("Montmartre Food Walk", "food", 4000, 120),
            ],
        },
        "Goa,India": {
            "city": ("Goa", "India"),
            "acts": [
                ("Beach Hopping", "sightseeing", 1500, 240),
                ("Seafood Dinner", "food", 2500, 90),
                ("Sunset Cruise", "adventure", 3000, 90),
            ],
        },
        "Mangaluru,India": {
            "city": ("Mangaluru", "India"),
            "acts": [
                ("Pilgrimage Circuit", "culture", 2000, 180),
                ("Gadbad Ice Cream Trail", "food", 800, 45),
                ("Tannirbhavi Beach", "sightseeing", 1000, 120),
            ],
        },
        "Udaipur,India": {
            "city": ("Udaipur", "India"),
            "acts": [
                ("City Palace Tour", "culture", 2500, 90),
                ("Lake Pichola Boat Ride", "sightseeing", 2000, 60),
                ("Rajasthani Thali", "food", 1200, 60),
            ],
        },
        "Hampi,India": {
            "city": ("Hampi", "India"),
            "acts": [
                ("Ruins Cycling Tour", "adventure", 2200, 180),
                ("Virupaksha Temple", "culture", 500, 60),
                ("Sunset Point", "sightseeing", 0, 60),
            ],
        },
        "Pondicherry,India": {
            "city": ("Pondicherry", "India"),
            "acts": [
                ("French Quarter Walk", "sightseeing", 1500, 120),
                ("Bakeries & Cafes Crawl", "food", 1200, 90),
                ("Auroville Visit", "culture", 0, 120),
            ],
        },
    }

    created = 0
    for key, spec in plan.items():
        name, country = spec["city"]
        city = ensure_city(name, country)
        for title, category, avg_cost, duration in spec["acts"]:
            obj, was_new = ActivityCatalog.objects.get_or_create(
                title=title,
                city=city,
                defaults={
                    "category": category,
                    "avg_cost": int(avg_cost),
                    "duration_minutes": int(duration),
                },
            )
            if was_new:
                created += 1

    total = ActivityCatalog.objects.count()
    print({"created": created, "total": total})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


