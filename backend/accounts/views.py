from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from .serializers import SignupSerializer, UserSerializer


User = get_user_model()


class SignupView(generics.CreateAPIView):
    serializer_class = SignupSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response(status=204)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def check_username(request):
    username = request.query_params.get("username") or request.query_params.get("u")
    if not username:
        return Response({"error": "username required"}, status=400)
    exists = User.objects.filter(username__iexact=username).exists()
    return Response({"username": username, "available": not exists})

# Create your views here.
