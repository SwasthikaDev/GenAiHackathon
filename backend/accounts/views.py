from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from .serializers import SignupSerializer, UserSerializer
from gt_backend.email_utils import send_email
from django.utils.crypto import get_random_string
from django.conf import settings


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


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    """Issue a simple password reset token via email. For MVP, we generate a one-time code and store it in user's session; in production use a model/table with expiry.
    Body: { email: string } (or username)
    """
    identifier = request.data.get("email") or request.data.get("username")
    if not identifier:
        return Response({"error": "email or username required"}, status=400)
    try:
        user = User.objects.filter(email__iexact=identifier).first() or User.objects.filter(username__iexact=identifier).first()
        if not user:
            return Response({"ok": True})  # don't leak existence
        code = get_random_string(6, '0123456789')
        request.session['pw_reset_user_id'] = user.id
        request.session['pw_reset_code'] = code
        request.session.save()
        # Send email (console backend in dev)
        send_email(
            to=[user.email or user.username],
            subject="GlobalTrotters password reset",
            text=f"Your verification code is: {code}",
        )
        resp = {"ok": True}
        if getattr(settings, 'DEBUG', False):
            resp["debug_code"] = code
        return Response(resp)
    except Exception:
        return Response({"ok": True})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def password_reset_confirm(request):
    """Confirm reset with code and set new password.
    Body: { code: string, new_password: string }
    """
    code = request.data.get("code")
    new_pw = request.data.get("new_password")
    if not code or not new_pw:
        return Response({"error": "code and new_password required"}, status=400)
    uid = request.session.get('pw_reset_user_id')
    stored = request.session.get('pw_reset_code')
    if not uid or not stored or stored != str(code):
        return Response({"error": "invalid code"}, status=400)
    user = User.objects.filter(id=uid).first()
    if not user:
        return Response({"error": "invalid session"}, status=400)
    user.set_password(new_pw)
    user.save(update_fields=["password"])
    # clear
    request.session.pop('pw_reset_user_id', None)
    request.session.pop('pw_reset_code', None)
    request.session.save()
    return Response({"ok": True})

# Create your views here.
