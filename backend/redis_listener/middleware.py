import logging
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from redis.exceptions import RedisError

from .websocket_tickets import consume_websocket_ticket

logger = logging.getLogger(__name__)


@database_sync_to_async
def get_active_user(ser_id: int):
    User = get_user_model()

    try:
        return User.objects.get(pk=ser_id, is_active=True)
    except User.DoesNotExist:
        return AnonymousUser()


class WebSocketTicketAuthMiddleware:
    def __init__(self, application):
        self.application = application

    async def __call__(self, scope, receive, send):
        scope = dict(scope)
        scope['user'] = AnonymousUser()

        raw_query_string = scope.get('query_string', b"")

        try:
            query_string = raw_query_string.decode('utf-8')
        except UnicodeDecodeError:
            query_string = ""

        query = parse_qs(query_string)
        ticket = query.get('ticket', [None])[0]
        payload = None

        if ticket:
            try:
                payload = await consume_websocket_ticket(ticket)
            except RedisError:
                logger.exception("Failed to consume WebSocket ticket")

            if payload is not None and payload['path'] == scope.get('path'):
                scope['user'] = get_active_user(payload['user_id'])

        return await self.application(scope, receive, send)
