from channels.generic.websocket import AsyncJsonWebsocketConsumer
import logging

logger = logging.getLogger(__name__)


class LiveUpdateConsumer(AsyncJsonWebsocketConsumer):
    group_name = 'live_updates'

    async def connect(self):
        user = self.scope['user']

        if user is None or not user.is_authenticated:
            await self.close(code=4401)
            return

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

        logger.info(f"Authenticated WebSocket: {user.username}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def messages_created(self, event):
        logger.debug(f"Websocket event: {event}")

        await self.send_json(event)

    async def messages_updated(self, event):
        logger.debug(f"Websocket event: {event}")

        await self.send_json(event)

    async def issues_created(self, event):
        logger.debug(f"Websocket event: {event}")

        await self.send_json(event)

    async def issues_updated(self, event):
        logger.debug(f"Websocket event: {event}")

        await self.send_json(event)

    async def requests_created(self, event):
        logger.debug(f"Websocket event: {event}")

        await self.send_json(event)

    async def requests_updated(self, event):
        logger.debug(f"Websocket event: {event}")
        await self.send_json(event)

