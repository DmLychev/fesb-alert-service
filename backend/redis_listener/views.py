import logging

from django.conf import settings
from redis.exceptions import RedisError
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .websocket_tickets import issue_websocket_ticket

logger = logging.getLogger(__name__)


class WebSocketTicketView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        try:
            ticket = issue_websocket_ticket(
                user_id=request.user.pk,
                path="/ws/events/"
            )
        except (RedisError, RuntimeError):
            logger.exception("Failed to issue a WebSocket ticket")

            return Response(dict(detail="WebSocket authentication is temporarily unavailable"),
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response(dict(ticket=ticket), status=status.HTTP_201_CREATED)
