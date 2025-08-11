from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter
from .views import TripViewSet, TripStopViewSet, ActivityViewSet, CityViewSet, public_itinerary, search_cities, personalized_recs


router = DefaultRouter()
router.register(r'trips', TripViewSet, basename='trip')
router.register(r'cities', CityViewSet, basename='city')

trips_router = NestedDefaultRouter(router, r'trips', lookup='trip')
trips_router.register(r'stops', TripStopViewSet, basename='trip-stops')

stops_router = NestedDefaultRouter(trips_router, r'stops', lookup='stop')
stops_router.register(r'activities', ActivityViewSet, basename='stop-activities')


urlpatterns = [
    path('', include(router.urls)),
    path('', include(trips_router.urls)),
    path('', include(stops_router.urls)),
    path('public/itineraries/<slug:public_slug>', public_itinerary, name='public-itinerary'),
    path('search/cities', search_cities, name='search-cities'),
    path('recs/personalized/', personalized_recs, name='personalized-recs'),
]

