from rest_framework import serializers

from django.contrib.auth import get_user_model
from .models import SystemSettings, Message, Route


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = get_user_model().objects.create_user(**validated_data)
        return user


class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = '__all__'


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = ['id', 'name', 'domain_name']


class MessageSerializer(serializers.ModelSerializer):
    route = RouteSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ["route", "exchange_id", "request_id", "error_message", "update_status_attempts",
                  "status", "start_date", "end_date", "warning_level", "created_at"]
