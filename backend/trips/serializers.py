from rest_framework import serializers
from .models import Trip, TripStop, Activity, City


class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ["id", "name", "country", "region", "cost_index", "popularity"]


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = [
            "id",
            "trip_stop",
            "title",
            "category",
            "start_time",
            "end_time",
            "cost_amount",
            "currency",
            "notes",
        ]
        read_only_fields = ["trip_stop"]


class TripStopSerializer(serializers.ModelSerializer):
    activities = ActivitySerializer(many=True, read_only=True)
    city = CitySerializer(read_only=True)
    city_id = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(), source="city", write_only=True
    )

    class Meta:
        model = TripStop
        fields = [
            "id",
            "trip",
            "city",
            "city_id",
            "start_date",
            "end_date",
            "order",
            "activities",
        ]
        read_only_fields = ["trip"]


class TripSerializer(serializers.ModelSerializer):
    stops = TripStopSerializer(many=True, read_only=True)
    origin_city = CitySerializer(read_only=True)
    origin_city_id = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(), source="origin_city", write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Trip
        fields = [
            "id",
            "name",
            "start_date",
            "end_date",
            "origin_city",
            "origin_city_id",
            "description",
            "cover_image",
            "is_public",
            "public_slug",
            "stops",
        ]


