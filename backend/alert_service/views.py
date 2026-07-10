from django.contrib.auth import get_user_model
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend

from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView, ListAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import SystemSettings, Message
from .serializers import UserSerializer, SystemSettingsSerializer, MessageSerializer
from .filters import MessageFilter


class CreateUserView(CreateAPIView):
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


class SystemSettingsView(RetrieveUpdateAPIView):
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj, created = SystemSettings.objects.get_or_create(id=1)
        return obj


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'size'
    max_page_size = 100


class MessageListView(ListAPIView):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated]

    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    filterset_class = MessageFilter

    search_fields = ["route__name", "route__domain_name", "exchange_id", "request_id", "error_message",
                     "update_status_attempts", "status", "start_date", "end_date", "warning_level", "created_at"]
    ordering_fields = ["start_date", "end_date", "created_at"]
    ordering = ('-start_date',)
