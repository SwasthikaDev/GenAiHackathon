from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import SignupView, ProfileView, LogoutView, check_username


urlpatterns = [
    path('signup', SignupView.as_view(), name='signup'),
    path('login', TokenObtainPairView.as_view(), name='login'),
    path('refresh', TokenRefreshView.as_view(), name='refresh'),
    path('profile', ProfileView.as_view(), name='profile'),
    path('logout', LogoutView.as_view(), name='logout'),
    path('check-username', check_username, name='check-username'),
]

