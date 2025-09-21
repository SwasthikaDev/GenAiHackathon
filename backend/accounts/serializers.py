from rest_framework import serializers
from rest_framework import serializers
from django.contrib.auth import get_user_model


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "display_name",
            "avatar_url",
            "phone_number",
            "city",
            "country",
            "bio",
            "language",
        ]


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    avatar_file = serializers.FileField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "display_name",
            "avatar_url",
            "avatar_file",
            "phone_number",
            "city",
            "country",
            "bio",
        ]
        extra_kwargs = {
            "email": {"required": True, "allow_blank": False},
        }

    def validate_email(self, value: str):
        if not value:
            raise serializers.ValidationError("Email is required")
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        avatar_file = validated_data.pop("avatar_file", None)
        user = User(**validated_data)
        user.set_password(password)
        # Save first to get an id
        user.save()
        # Simple local file handling for avatar_file -> MEDIA
        if avatar_file:
            # Store at media/avatars/<username>.ext
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile
            import os
            ext = os.path.splitext(avatar_file.name)[1] or ".jpg"
            path = f"avatars/{user.username}{ext}"
            default_storage.save(path, ContentFile(avatar_file.read()))
            user.avatar_url = default_storage.url(path)
            user.save(update_fields=["avatar_url"])
        return user

