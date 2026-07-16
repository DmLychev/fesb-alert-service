import asyncio
import json
import os

import redis.asyncio as redis
from channels.layers import get_channel_layer
from django.core.management.base import BaseCommand

REDIS_CHANNEL = 'messages.created'
CHANNELS_GROUP = 'messages'


class Command(BaseCommand):
    help = 'Listen to Redis message events and broadcast them to WebSocket clients.'

    def handle(self, *args, **options):
        asyncio.run(self.listen())

    async def listen(self):
        redis_url = os.environ.get("REDIS_URL")
        redis_client = redis.from_url(redis_url, decode_responses=True)
        pubsub = redis_client.pubsub()
        channel_layer = get_channel_layer()

        print(f"Starting Redis listener on {redis_url}")

        await pubsub.subscribe(REDIS_CHANNEL)

        try:
            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue

                payload = json.loads(message["data"])
                print(f"Django received message: {payload}")

                await channel_layer.group_send(
                    CHANNELS_GROUP,
                    {
                        "type": "messages.created",
                        "count": payload["count"],
                    },
                )
        finally:
            await pubsub.unsubscribe(REDIS_CHANNEL)
            await pubsub.aclose()
            await redis_client.aclose()
