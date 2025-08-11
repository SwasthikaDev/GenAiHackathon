from django.core.management.base import BaseCommand
from trips.models import City, ActivityCatalog


class Command(BaseCommand):
    help = "Seed demo cities and activities"

    def handle(self, *args, **options):
        cities = [
            ("New York", "USA", "North America"),
            ("London", "UK", "Europe"),
            ("Tokyo", "Japan", "Asia"),
            ("Sydney", "Australia", "Oceania"),
            ("Paris", "France", "Europe"),
        ]
        for name, country, region in cities:
            City.objects.get_or_create(name=name, country=country, defaults={"region": region})

        catalog = [
            ("City Walking Tour", "sightseeing", 3000),
            ("Food Crawl", "food", 4000),
            ("Museum Pass", "culture", 2500),
            ("Boat Ride", "adventure", 3500),
        ]
        for title, category, avg_cost in catalog:
            ActivityCatalog.objects.get_or_create(title=title, defaults={"category": category, "avg_cost": avg_cost})

        self.stdout.write(self.style.SUCCESS("Seed data created/updated."))

