from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "nome", "role", "is_staff", "is_superuser"]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Inclui nome/role no payload do token e os dados do usuário na resposta."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["nome"] = user.nome or user.username
        token["role"] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
