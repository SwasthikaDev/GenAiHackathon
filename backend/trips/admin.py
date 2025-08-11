from django.contrib import admin
from .models import City, Trip, TripStop, Activity, ActivityCatalog, ExternalPlace


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ("name", "country", "region", "cost_index", "popularity")
    search_fields = ("name", "country", "region")


class TripStopInline(admin.TabularInline):
    model = TripStop
    extra = 0


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "origin_city", "start_date", "end_date", "is_public")
    inlines = [TripStopInline]


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("title", "trip_stop", "category", "cost_amount", "currency")


@admin.register(ActivityCatalog)
class ActivityCatalogAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "avg_cost", "duration_minutes", "city")


@admin.register(ExternalPlace)
class ExternalPlaceAdmin(admin.ModelAdmin):
    list_display = ("name", "country", "source", "external_id", "created_at")
    search_fields = ("name", "country", "external_id")

# Register your models here.
