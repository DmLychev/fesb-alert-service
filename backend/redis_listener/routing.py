from django.urls import path

from .consumers import LiveUpdateConsumer

websocket_urlpatterns = [
    path("ws/events/", LiveUpdateConsumer.as_asgi()),
]