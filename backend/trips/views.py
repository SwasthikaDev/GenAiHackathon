from rest_framework import viewsets, permissions, decorators, response, filters
from rest_framework.throttling import ScopedRateThrottle
from .models import Trip, TripStop, Activity, City, ExternalPlace, PersonalizedRec, ActivityCatalog
from .serializers import TripSerializer, TripStopSerializer, ActivitySerializer, CitySerializer
from django.shortcuts import get_object_or_404
from django.db.models import Sum
import requests
import os
import logging
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes, OpenApiExample


class TripViewSet(viewsets.ModelViewSet):
    serializer_class = TripSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Trip.objects.filter(user=self.request.user).order_by('-id')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @extend_schema(tags=["Trips"], summary="Make trip public", responses={200: OpenApiTypes.OBJECT})
    @decorators.action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        trip = self.get_object()
        trip.is_public = True
        trip.save()
        return response.Response({"public_slug": trip.public_slug})

    @extend_schema(
        tags=["Trips"],
        summary="Auto-generate itinerary",
        request=OpenApiTypes.OBJECT,
        responses={200: OpenApiTypes.OBJECT},
        examples=[OpenApiExample('Generate example', value={'days_per_city': 2, 'currency': 'INR', 'force': False})],
    )
    @decorators.action(detail=True, methods=['post'], url_path='generate', throttle_classes=[ScopedRateThrottle])
    def generate(self, request, pk=None):
        """Auto-generate itinerary stops and activities via OpenRouter (if key set),
        else use heuristic generation from ActivityCatalog. Allows customization later.

        Body (optional): { days_per_city: number, currency: 'INR', force: boolean }
        """
        request.parser_context = getattr(request, 'parser_context', {}) or {}
        request.parser_context['throttle_scope'] = 'generate'
        trip = self.get_object()
        days_per_city = int(request.data.get('days_per_city') or 2)
        currency = request.data.get('currency') or 'INR'
        force = str(request.data.get('force') or '').lower() in ('1','true','yes')

        # If already has stops and not forcing, return existing
        if trip.stops.exists() and not force:
            return response.Response({"status": "exists", "stops": TripStopSerializer(trip.stops.all(), many=True).data})

        # Clear existing to regenerate
        trip.stops.all().delete()

        origin = trip.origin_city.name if trip.origin_city else None
        dests = []
        # If user already created some cities in description, ignore; otherwise propose 1-2 based on ActivityCatalog
        from .models import ActivityCatalog
        cat_cities = ActivityCatalog.objects.exclude(city=None).values_list('city__name', flat=True).distinct()[:3]
        if cat_cities:
            dests = list(cat_cities)
        else:
            dests = ["Goa", "Udaipur"]

        # Attempt OpenRouter to propose cities and activities
        api_key = os.getenv("OPENROUTER_API_KEY")
        created_stops = []
        if api_key:
            try:
                system = "Return only valid JSON"
                user_prompt = (
                    "Design a short itinerary. Output JSON: { cities: [{ name, country }], perCity: { cityName: { activities: [{ title, category, cost_minor }] } } }"
                )
                timeout_seconds = int(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "60"))
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
                        "temperature": 0.6,
                        "messages": [
                            {"role": "system", "content": system},
                            {"role": "user", "content": f"Origin: {origin}; daysPerCity: {days_per_city}; currency: {currency}. {user_prompt}"},
                        ],
                    },
                    timeout=(10, timeout_seconds),
                )
                r.raise_for_status()
                content = r.json().get("choices", [{}])[0].get("message", {}).get("content", "")
                import json as _json
                def extract_json(s: str):
                    s = s.strip()
                    if s.startswith("```"):
                        s = s.strip('`')
                        if s.lower().startswith("json\n"):
                            s = s[5:]
                    start = s.find("{"); end = s.rfind("}")
                    return s[start:end+1] if start!=-1 and end!=-1 and end>=start else s
                payload = _json.loads(extract_json(content))
                proposed_cities = [c.get('name') for c in payload.get('cities', []) if c.get('name')]
                if proposed_cities:
                    dests = proposed_cities
                per_city = payload.get('perCity', {})
                # Build stops
                from datetime import datetime, timedelta
                cur = trip.start_date
                order = 1
                for name in dests:
                    start_date = cur
                    end_date = cur + timedelta(days=days_per_city)
                    cur = end_date
                    # Ensure city
                    city_obj, _ = City.objects.get_or_create(name=name, defaults={"country": ""})
                    stop = TripStop.objects.create(trip=trip, city=city_obj, start_date=start_date, end_date=end_date, order=order)
                    order += 1
                    # Activities
                    acts = per_city.get(name) or per_city.get(name.title()) or {}
                    for a in acts.get('activities', [])[:5]:
                        Activity.objects.create(trip_stop=stop, title=a.get('title') or 'Activity', category=a.get('category') or '', cost_amount=int(a.get('cost_minor') or 0), currency=currency)
                    created_stops.append(stop.id)
            except Exception:
                pass

        # Heuristic fallback if no stops created
        if not created_stops:
            from datetime import timedelta
            cur = trip.start_date
            order = 1
            for name in dests:
                start_date = cur
                end_date = cur + timedelta(days=days_per_city)
                cur = end_date
                city_obj, _ = City.objects.get_or_create(name=name, defaults={"country": ""})
                stop = TripStop.objects.create(trip=trip, city=city_obj, start_date=start_date, end_date=end_date, order=order)
                order += 1
                # a few catalog-based activities
                samples = ActivityCatalog.objects.all()[:3]
                for ac in samples:
                    Activity.objects.create(trip_stop=stop, title=ac.title, category=ac.category, cost_amount=ac.avg_cost, currency=currency)
                created_stops.append(stop.id)

        return response.Response({"status": "generated", "stops": TripStopSerializer(trip.stops.all(), many=True).data})

    @extend_schema(tags=["Trips"], summary="Reorder stops", request=OpenApiTypes.OBJECT, responses={200: OpenApiTypes.OBJECT})
    @decorators.action(detail=True, methods=['post'], url_path='stops/reorder')
    def reorder_stops(self, request, pk=None):
        """Reorder stops by provided list of stop IDs.

        Body: { order: [stop_id1, stop_id2, ...] }
        """
        trip = self.get_object()
        order_list = request.data.get('order') or []
        if not isinstance(order_list, list) or not order_list:
            return response.Response({"error": "order list required"}, status=400)
        # Map to int and keep only stops for this trip
        valid_ids = list(TripStop.objects.filter(trip=trip, id__in=order_list).values_list('id', flat=True))
        # Apply new order
        position = 1
        for sid in order_list:
            if sid in valid_ids:
                TripStop.objects.filter(id=sid, trip=trip).update(order=position)
                position += 1
        # Any remaining stops get appended preserving existing order
        remaining = TripStop.objects.filter(trip=trip).exclude(id__in=order_list).order_by('order', 'start_date').values_list('id', flat=True)
        for sid in remaining:
            TripStop.objects.filter(id=sid, trip=trip).update(order=position)
            position += 1
        return response.Response({"status": "ok", "stops": TripStopSerializer(trip.stops.order_by('order'), many=True).data})

    @extend_schema(tags=["Trips"], summary="Budget total", responses={200: OpenApiTypes.OBJECT})
    @decorators.action(detail=True, methods=['get'])
    def budget(self, request, pk=None):
        trip = self.get_object()
        total = Activity.objects.filter(trip_stop__trip=trip).aggregate(sum=Sum('cost_amount'))['sum'] or 0
        # Try to infer currency from first activity; default to INR
        first_act = Activity.objects.filter(trip_stop__trip=trip).first()
        currency = first_act.currency if first_act and first_act.currency else 'INR'
        return response.Response({"trip_id": trip.id, "currency": currency, "total_cost_minor": total})

    @extend_schema(tags=["Trips"], summary="Budget summary", responses={200: OpenApiTypes.OBJECT})
    @decorators.action(detail=True, methods=['get'], url_path='budget/summary')
    def budget_summary(self, request, pk=None):
        """Return totals by category, overall total, and avg per day.

        Categories consolidated into: activities, meals, transport, stay, other.
        """
        trip = self.get_object()
        activities = Activity.objects.filter(trip_stop__trip=trip)
        # Determine currency
        first_act = activities.first()
        currency = first_act.currency if first_act and first_act.currency else 'INR'

        def normalize_category(raw: str) -> str:
            r = (raw or '').strip().lower()
            if any(k in r for k in ['food', 'meal', 'dine', 'restaurant']):
                return 'meals'
            if any(k in r for k in ['transport', 'flight', 'train', 'bus', 'cab', 'taxi']):
                return 'transport'
            if any(k in r for k in ['stay', 'hotel', 'hostel', 'accommodation']):
                return 'stay'
            if any(k in r for k in ['sight', 'tour', 'museum', 'activity', 'adventure', 'culture']):
                return 'activities'
            return 'activities' if r else 'other'

        from collections import defaultdict
        cat_totals = defaultdict(int)
        num_activities = 0
        for a in activities:
            cat = normalize_category(a.category)
            cat_totals[cat] += int(a.cost_amount or 0)
            num_activities += 1
        total = sum(cat_totals.values())

        # Average per day
        days = (trip.end_date - trip.start_date).days
        if days <= 0:
            days = 1
        avg_per_day = total // days if total else 0

        # Per-city breakdown
        per_city = []
        stops = trip.stops.select_related('city').all().order_by('order', 'start_date')
        for s in stops:
            city_cat = defaultdict(int)
            city_total = 0
            for a in s.activities.all():
                cat = normalize_category(a.category)
                amt = int(a.cost_amount or 0)
                city_cat[cat] += amt
                city_total += amt
            per_city.append({
                'city': {
                    'id': s.city.id,
                    'name': s.city.name,
                    'country': s.city.country,
                },
                'total_minor': city_total,
                'categories': {
                    'activities': city_cat.get('activities', 0),
                    'meals': city_cat.get('meals', 0),
                    'transport': city_cat.get('transport', 0),
                    'stay': city_cat.get('stay', 0),
                    'other': city_cat.get('other', 0),
                }
            })

        return response.Response({
            'trip_id': trip.id,
            'currency': currency,
            'total_minor': total,
            'avg_per_day_minor': avg_per_day,
            'num_activities': num_activities,
            'categories': {
                'activities': cat_totals.get('activities', 0),
                'meals': cat_totals.get('meals', 0),
                'transport': cat_totals.get('transport', 0),
                'stay': cat_totals.get('stay', 0),
                'other': cat_totals.get('other', 0),
            },
            'per_city': per_city,
            'days': days,
        })

    @extend_schema(tags=["Trips"], summary="Calendar day-wise schedule", responses={200: OpenApiTypes.OBJECT})
    @decorators.action(detail=True, methods=['get'], url_path='calendar')
    def calendar(self, request, pk=None):
        """Return a day-wise schedule between trip start_date (inclusive) and end_date (exclusive).

        For each day, include the stop covering that date and a distribution of activities
        across that stop's days (simple even split when activity dates are not set).
        """
        from datetime import timedelta
        trip = self.get_object()
        # compute day count (exclusive end)
        days = (trip.end_date - trip.start_date).days
        if days <= 0:
            days = 1

        # Prepare stops ordered and prefetch activities
        stops = list(trip.stops.select_related('city').prefetch_related('activities').order_by('order', 'start_date'))

        # Helper: find stop for a given date (start <= date < end)
        def stop_for(date_obj):
            for s in stops:
                if s.start_date <= date_obj < s.end_date:
                    return s
            return None

        # Pre-compute activity buckets per stop for even distribution
        stop_to_buckets = {}
        for s in stops:
            span = (s.end_date - s.start_date).days
            if span <= 0:
                span = 1
            acts = list(s.activities.all().order_by('id'))
            buckets = [[] for _ in range(span)]
            if acts:
                # chunk approximately evenly
                total = len(acts)
                for idx, a in enumerate(acts):
                    # map idx to bucket using proportional index
                    b = min((idx * span) // total, span - 1)
                    buckets[b].append(a)
            stop_to_buckets[s.id] = buckets

        def serialize_activity(a: Activity):
            return {
                'id': a.id,
                'title': a.title,
                'category': a.category,
                'start_time': a.start_time,
                'end_time': a.end_time,
                'cost_amount': a.cost_amount,
                'currency': a.currency,
            }

        timeline = []
        for i in range(days):
            day_date = trip.start_date + timedelta(days=i)
            s = stop_for(day_date)
            day_entry = {
                'date': day_date.isoformat(),
                'day_index': i + 1,
                'stop_id': s.id if s else None,
                'stop_order': s.order if s else None,
                'city': ({
                    'id': s.city.id,
                    'name': s.city.name,
                    'country': s.city.country,
                } if s else None),
                'activities': [],
            }
            if s:
                span = (s.end_date - s.start_date).days
                if span <= 0:
                    span = 1
                # index within the stop's span
                offset = (day_date - s.start_date).days
                offset = max(0, min(offset, span - 1))
                buckets = stop_to_buckets.get(s.id, [[] for _ in range(span)])
                day_entry['activities'] = [serialize_activity(a) for a in buckets[offset]]
            timeline.append(day_entry)

        return response.Response({
            'trip_id': trip.id,
            'start_date': trip.start_date.isoformat(),
            'end_date': trip.end_date.isoformat(),
            'total_days': days,
            'days': timeline,
        })


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
        cost_index = request.data.get("cost_index")
        popularity = request.data.get("popularity")
        if not name:
            return response.Response({"error": "name required"}, status=400)
        city, created = City.objects.get_or_create(name=name, country=country, defaults={"region": region})
        changed = False
        if region and city.region != region:
            city.region = region
            changed = True
        try:
            if cost_index is not None:
                ci = int(cost_index)
                if city.cost_index != ci:
                    city.cost_index = ci
                    changed = True
        except Exception:
            pass
        try:
            if popularity is not None:
                pop = int(popularity)
                if city.popularity != pop:
                    city.popularity = pop
                    changed = True
        except Exception:
            pass
        if changed:
            city.save()
        data = CitySerializer(city).data
        return response.Response(data)


@extend_schema(tags=["Public"], summary="Fetch public itinerary by slug", responses={200: OpenApiTypes.OBJECT})
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


@extend_schema(tags=["Public"], summary="Copy public itinerary into my trips", responses={200: OpenApiTypes.OBJECT})
@decorators.api_view(["POST"])
@decorators.permission_classes([permissions.IsAuthenticated])
def copy_public_itinerary(request, public_slug: str):
    """Clone a public itinerary by slug into the authenticated user's trips.

    Copies trip name/dates/origin and all stops+activities. Returns the new trip id.
    """
    src_trip = get_object_or_404(Trip, is_public=True, public_slug=public_slug)
    user = request.user
    # Create destination trip
    new_trip = Trip.objects.create(
        user=user,
        name=src_trip.name,
        start_date=src_trip.start_date,
        end_date=src_trip.end_date,
        origin_city=src_trip.origin_city,
        description=src_trip.description,
        cover_image=src_trip.cover_image,
        is_public=False,
    )
    # Copy stops and activities
    for s in src_trip.stops.all().order_by('order', 'start_date'):
        new_stop = TripStop.objects.create(
            trip=new_trip,
            city=s.city,
            start_date=s.start_date,
            end_date=s.end_date,
            order=s.order,
        )
        for a in s.activities.all().order_by('id'):
            Activity.objects.create(
                trip_stop=new_stop,
                title=a.title,
                category=a.category,
                start_time=a.start_time,
                end_time=a.end_time,
                cost_amount=a.cost_amount,
                currency=a.currency,
                notes=a.notes,
            )
    return response.Response({"trip_id": new_trip.id})


@decorators.api_view(["GET"])
@decorators.permission_classes([permissions.AllowAny])
@decorators.throttle_classes([ScopedRateThrottle])
def search_cities(request):
    q = request.query_params.get("query") or request.query_params.get("q")
    if not q:
        return response.Response({"error": "query required"}, status=400)
    # Basic debounce guard on server: require 2+ chars
    if len(q.strip()) < 2:
        return response.Response([], status=200)
    request.parser_context = getattr(request, 'parser_context', {}) or {}
    request.parser_context['throttle_scope'] = 'search_cities'
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


@decorators.api_view(["GET"])
@decorators.permission_classes([permissions.AllowAny])
@decorators.throttle_classes([ScopedRateThrottle])
def search_activities(request):
    """Browse/search activities from the catalog with filters.

    Query params:
      - q: search term in title/category (>=2 chars recommended)
      - city_id: filter by city id
      - city: filter by city name (iexact)
      - category: filter by category (iexact)
      - min_cost, max_cost: avg_cost bounds (minor units)
      - duration_min, duration_max: duration_minutes bounds
      - page (default 1), page_size (default 20, max 100)
    """
    request.parser_context = getattr(request, 'parser_context', {}) or {}
    request.parser_context['throttle_scope'] = 'search_activities'
    qs = ActivityCatalog.objects.all()
    q = request.query_params.get("q")
    city_id = request.query_params.get("city_id")
    city_name = request.query_params.get("city")
    category = request.query_params.get("category")
    min_cost = request.query_params.get("min_cost")
    max_cost = request.query_params.get("max_cost")
    dmin = request.query_params.get("duration_min")
    dmax = request.query_params.get("duration_max")

    # Require at least some filter to avoid dumping everything
    if not (q or city_id or city_name or category):
        return response.Response({"count": 0, "page": 1, "page_size": 0, "results": []})

    if q and len(q.strip()) >= 2:
        from django.db.models import Q
        qs = qs.filter(Q(title__icontains=q) | Q(category__icontains=q))
    if city_id:
        try:
            qs = qs.filter(city_id=int(city_id))
        except Exception:
            pass
    if city_name:
        qs = qs.filter(city__name__iexact=city_name)
    if category:
        qs = qs.filter(category__iexact=category)
    try:
        if min_cost is not None:
            qs = qs.filter(avg_cost__gte=int(min_cost))
        if max_cost is not None:
            qs = qs.filter(avg_cost__lte=int(max_cost))
    except Exception:
        pass
    try:
        if dmin is not None:
            qs = qs.filter(duration_minutes__gte=int(dmin))
        if dmax is not None:
            qs = qs.filter(duration_minutes__lte=int(dmax))
    except Exception:
        pass

    total = qs.count()
    try:
        page = max(1, int(request.query_params.get("page") or 1))
        page_size = int(request.query_params.get("page_size") or 20)
    except Exception:
        page, page_size = 1, 20
    page_size = max(1, min(page_size, 100))
    offset = (page - 1) * page_size
    items = list(qs.select_related("city").order_by("id")[offset: offset + page_size])

    def city_dict(c: City | None):
        if not c:
            return None
        return {"id": c.id, "name": c.name, "country": c.country}

    results = [
        {
            "id": a.id,
            "title": a.title,
            "category": a.category,
            "avg_cost": a.avg_cost,
            "duration_minutes": a.duration_minutes,
            "city": city_dict(a.city),
        }
        for a in items
    ]
    return response.Response({"count": total, "page": page, "page_size": page_size, "results": results})


@extend_schema(tags=["Recommendations"], summary="Personalized recommendations", responses={200: OpenApiTypes.OBJECT})
@decorators.api_view(["POST"])
@decorators.permission_classes([permissions.IsAuthenticated])
@decorators.throttle_classes([ScopedRateThrottle])
def personalized_recs(request):
    """Return LLM-curated homepage content based on user's profile and trips.

    If OPENROUTER_API_KEY is not set or the request fails, return a basic fallback
    using user city/country.
    """
    user = request.user
    request.parser_context = getattr(request, 'parser_context', {}) or {}
    request.parser_context['throttle_scope'] = 'personalized'
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
            data.setdefault("source", "user-cache")
            return response.Response(data)
        # City-level cache reuse
        city_name = (profile.get("city") or "").strip()
        country_name = (profile.get("country") or "").strip()
        if city_name:
            cached_city = PersonalizedRec.objects.filter(city__iexact=city_name, country__iexact=country_name).order_by("-created_at").first()
            if cached_city:
                data = dict(cached_city.data)
                data.setdefault("source", "city-cache")
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
            timeout_seconds = int(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "60"))
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
                timeout=(10, timeout_seconds),
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
                # Save to cache (user + city)
                PersonalizedRec.objects.create(user=user, signature=signature, data=parsed, city=profile.get("city") or "", country=profile.get("country") or "")
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
    # Cache fallback too for consistency (user + city)
    PersonalizedRec.objects.create(user=user, signature=signature, data=fallback, city=profile.get("city") or "", country=profile.get("country") or "")
    return response.Response(fallback)

# Create your views here.
