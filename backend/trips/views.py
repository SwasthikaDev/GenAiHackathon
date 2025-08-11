from rest_framework import viewsets, permissions, decorators, response, filters
from .models import Trip, TripStop, Activity, City, ExternalPlace, PersonalizedRec
from .serializers import TripSerializer, TripStopSerializer, ActivitySerializer, CitySerializer
from django.shortcuts import get_object_or_404
from django.db.models import Sum
import requests
import os
import logging


class TripViewSet(viewsets.ModelViewSet):
    serializer_class = TripSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Trip.objects.filter(user=self.request.user).order_by('-id')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @decorators.action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        trip = self.get_object()
        trip.is_public = True
        trip.save()
        return response.Response({"public_slug": trip.public_slug})

    @decorators.action(detail=True, methods=['get'])
    def budget(self, request, pk=None):
        trip = self.get_object()
        total = Activity.objects.filter(trip_stop__trip=trip).aggregate(sum=Sum('cost_amount'))['sum'] or 0
        return response.Response({"trip_id": trip.id, "currency": "USD", "total_cost_minor": total})


class TripStopViewSet(viewsets.ModelViewSet):
    serializer_class = TripStopSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TripStop.objects.filter(trip__user=self.request.user)

    def perform_create(self, serializer):
        trip = get_object_or_404(Trip, id=self.kwargs.get('trip_pk'), user=self.request.user)
        serializer.save(trip=trip)


class ActivityViewSet(viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Activity.objects.filter(trip_stop__trip__user=self.request.user)

    def perform_create(self, serializer):
        stop = get_object_or_404(TripStop, id=self.kwargs.get('stop_pk'), trip__user=self.request.user)
        serializer.save(trip_stop=stop)


class CityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = City.objects.all()
    serializer_class = CitySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "country", "region"]

    @decorators.action(detail=False, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def ensure(self, request):
        name = request.data.get("name")
        country = request.data.get("country", "")
        region = request.data.get("region", "")
        if not name:
            return response.Response({"error": "name required"}, status=400)
        city, _ = City.objects.get_or_create(name=name, country=country, defaults={"region": region})
        data = CitySerializer(city).data
        return response.Response(data)


@decorators.api_view(["GET"])
@decorators.permission_classes([permissions.AllowAny])
def public_itinerary(request, public_slug: str):
    # Built-in demo sample for homepage preview
    if public_slug in ("sample", "demo"):
        # Accept query params to build a multi-city sample
        origin_name = request.query_params.get("origin") or request.query_params.get("from") or "London"
        dest_param = request.query_params.get("dest") or request.query_params.get("to") or "Paris"
        start = request.query_params.get("start") or "2025-09-05"
        days_per_city = int(request.query_params.get("daysPerCity") or 2)
        currency = request.query_params.get("currency") or "USD"

        dest_names = [d.strip() for d in dest_param.split(",") if d.strip()]
        if not dest_names:
            dest_names = ["Paris"]

        # helper to make city dict; try to enrich from DB if available
        def city_dict(name: str):
            c = City.objects.filter(name__iexact=name).first()
            if c:
                return {
                    "id": c.id,
                    "name": c.name,
                    "country": c.country,
                    "region": c.region,
                    "cost_index": c.cost_index,
                    "popularity": c.popularity,
                }
            return {"id": 0, "name": name, "country": "", "region": ""}

        # simple date math
        from datetime import datetime, timedelta
        cur = datetime.fromisoformat(start)
        stops = []
        act_total = food_total = transport_total = other_total = 0
        order = 1
        for name in dest_names:
            start_date = cur.date().isoformat()
            end_date = (cur + timedelta(days=days_per_city)).date().isoformat()
            cur += timedelta(days=days_per_city)

            # pick a few activities from catalog if available
            acts = []
            qs = Activity.objects.none()
            # We don't have a full catalog tied to City; synthesize sample acts
            sample_acts = [
                ("Walking Tour", "sightseeing", 2000),
                ("Museum Pass", "culture", 2500),
                ("Food Crawl", "food", 3500),
            ]
            for idx, (title, cat, cost) in enumerate(sample_acts, start=1):
                acts.append({
                    "id": order * 10 + idx,
                    "trip_stop": order,
                    "title": title,
                    "category": cat,
                    "start_time": None,
                    "end_time": None,
                    "cost_amount": cost,
                    "currency": currency,
                    "notes": "",
                })
                if cat == "food":
                    food_total += cost
                else:
                    act_total += cost

            stops.append({
                "id": order,
                "trip": 0,
                "city": city_dict(name),
                "start_date": start_date,
                "end_date": end_date,
                "order": order,
                "activities": acts,
            })
            # rough transport per leg
            transport_total += 5000
            order += 1

        total_days = days_per_city * len(dest_names)
        best_time = "Shoulder seasons for fewer crowds and mild weather"

        sample = {
            "id": 0,
            "name": f"{origin_name} → {' → '.join(dest_names)}",
            "start_date": start,
            "end_date": (datetime.fromisoformat(start) + timedelta(days=total_days)).date().isoformat(),
            "origin_city": city_dict(origin_name),
            "description": "Auto‑generated sample itinerary",
            "cover_image": "",
            "is_public": True,
            "public_slug": public_slug,
            "best_time_to_visit": best_time,
            "tips": [
                "Adjust days per city based on interests",
                "Book intercity transport in advance",
                "Keep buffer time for popular attractions",
            ],
            "budget_breakdown_minor": {
                "activities": act_total,
                "food": food_total,
                "transport": transport_total,
                "stay": 0,
                "other": other_total,
            },
            "stops": stops,
        }
        return response.Response(sample)

    trip = get_object_or_404(Trip, is_public=True, public_slug=public_slug)
    data = TripSerializer(trip).data
    return response.Response(data)


@decorators.api_view(["GET"])
@decorators.permission_classes([permissions.AllowAny])
def search_cities(request):
    q = request.query_params.get("query") or request.query_params.get("q")
    if not q:
        return response.Response({"error": "query required"}, status=400)
    try:
        # Use Nominatim (OpenStreetMap) for city search
        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": q, "format": "json", "addressdetails": 1, "limit": 8}
        headers = {"User-Agent": "GlobalTrotters/1.0"}
        r = requests.get(url, params=params, headers=headers, timeout=8)
        r.raise_for_status()
        results = []
        for item in r.json():
            addr = item.get("address", {})
            city_name = addr.get("city") or addr.get("town") or addr.get("village") or item.get("display_name", "").split(",")[0]
            country = addr.get("country", "")
            # Check if exists locally (case-insensitive)
            city_obj = City.objects.filter(name__iexact=city_name, country__iexact=country).first()
            # Persist snapshot for dataset building
            try:
                ExternalPlace.objects.get_or_create(
                    source='nominatim',
                    external_id=str(item.get("osm_id") or item.get("place_id") or ""),
                    defaults={
                        'query': q,
                        'name': city_name,
                        'country': country,
                        'lat': item.get('lat') or None,
                        'lon': item.get('lon') or None,
                        'raw': item,
                    }
                )
            except Exception:
                pass
            results.append({
                "id": city_obj.id if city_obj else None,
                "name": city_name,
                "country": country,
                "lat": item.get("lat"),
                "lon": item.get("lon"),
            })
        return response.Response(results)
    except Exception:
        return response.Response([], status=200)


@decorators.api_view(["POST"])
@decorators.permission_classes([permissions.IsAuthenticated])
def personalized_recs(request):
    """Return LLM-curated homepage content based on user's profile and trips.

    If OPENROUTER_API_KEY is not set or the request fails, return a basic fallback
    using user city/country.
    """
    user = request.user
    profile = {
        "display_name": user.get_full_name() or user.display_name,
        "city": getattr(user, "city", ""),
        "country": getattr(user, "country", ""),
        "bio": getattr(user, "bio", ""),
    }
    trips_qs = Trip.objects.filter(user=user).values("name", "start_date", "end_date", "updated_at" if hasattr(Trip, 'updated_at') else "created_at")
    trips = list(trips_qs[:10])

    # Build a stable signature of profile + trips set (names and dates only)
    import hashlib, json as _json
    sig_payload = {
        "city": profile["city"],
        "country": profile["country"],
        "bio": (profile["bio"] or "")[:120],
        "trips": [{"n": t["name"], "s": str(t["start_date"]), "e": str(t["end_date"]) } for t in trips],
    }
    signature = hashlib.sha1(_json.dumps(sig_payload, sort_keys=True).encode("utf-8")).hexdigest()

    # Allow bypassing cache with ?force=1
    force = request.query_params.get("force") == "1"
    if not force:
        cached = PersonalizedRec.objects.filter(user=user, signature=signature).order_by("-created_at").first()
        if cached:
            data = dict(cached.data)
            data.setdefault("source", "cache")
            return response.Response(data)

    api_key = os.getenv("OPENROUTER_API_KEY")
    prompt = (
        "You are a travel curator. Based on the user's profile and recent trips, propose: "
        "bannerTitle (<=6 words), blurb (<=20 words), topSelections: 6 destination cards with { name, country, reason }, "
        "groupings: short headings, sortOptions: short options. Respond as compact JSON with keys: "
        "bannerTitle, blurb, topSelections, groupings, sortOptions."
    )

    if api_key:
        try:
            r = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                    "HTTP-Referer": os.getenv("OPENROUTER_SITE_URL", "http://localhost:3000"),
                    "X-Title": os.getenv("OPENROUTER_APP_NAME", "GlobalTrotters"),
                },
                json={
                    "model": "deepseek/deepseek-r1-0528:free",
                    "temperature": 0.7,
                    "messages": [
                        {"role": "system", "content": "Return only valid JSON"},
                        {"role": "user", "content": f"{prompt}\nProfile: {profile}\nRecentTrips: {trips}"},
                    ],
                },
                timeout=12,
            )
            r.raise_for_status()
            data = r.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            # Try to parse JSON content robustly
            try:
                def extract_json(s: str):
                    s = s.strip()
                    if s.startswith("```"):
                        # remove triple backticks and optional 'json' label
                        s = s.strip('`')
                        if s.lower().startswith("json\n"):
                            s = s[5:]
                    start = s.find("{")
                    end = s.rfind("}")
                    if start != -1 and end != -1 and end >= start:
                        return s[start:end+1]
                    return s
                json_like = extract_json(content)
                parsed = _json.loads(json_like)
                parsed.setdefault("source", "openrouter")
                # Save to cache
                PersonalizedRec.objects.create(user=user, signature=signature, data=parsed)
                return response.Response(parsed)
            except Exception:
                logging.getLogger(__name__).warning("OpenRouter JSON parse failed")
        except Exception as ex:
            logging.getLogger(__name__).warning("OpenRouter call failed: %s", ex)

    # Fallback
    city = profile.get("city") or "Bengaluru"
    country = profile.get("country") or "India"
    fallback = {
        "bannerTitle": f"Explore {country}",
        "blurb": f"Handpicked getaways near {city}",
        "topSelections": [
            {"name": "Goa", "country": "India", "reason": "Beaches and nightlife", "imageUrl": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"},
            {"name": "Coorg", "country": "India", "reason": "Coffee estates & waterfalls", "imageUrl": "https://images.unsplash.com/photo-1585042453039-3dffb2f9b258"},
            {"name": "Udaipur", "country": "India", "reason": "Lakes and palaces", "imageUrl": "https://images.unsplash.com/photo-1600783481548-7c4f43e78b9b"},
            {"name": "Hampi", "country": "India", "reason": "Ruins and boulders", "imageUrl": "https://images.unsplash.com/photo-1524499982521-1ffd58dd89ea"},
            {"name": "Pondicherry", "country": "India", "reason": "French vibes by the sea", "imageUrl": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c"},
            {"name": "Munnar", "country": "India", "reason": "Tea hills & mist", "imageUrl": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"},
        ],
        "groupings": ["Beaches", "Hills", "Culture", "Food"],
        "sortOptions": ["Trending", "Budget friendly", "Weekend trips"],
        "source": "fallback",
    }
    # Cache fallback too for consistency
    PersonalizedRec.objects.create(user=user, signature=signature, data=fallback)
    return response.Response(fallback)

# Create your views here.
