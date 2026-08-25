import asyncio
import json
import os

import redis.asyncio as redis
from channels.layers import get_channel_layer
from django.core.management.base import BaseCommand

from alert_service.models import Route, IssueType

REDIS_CHANNELS = ('messages', "issues", "requests")
CHANNELS_GROUP = 'live_updates'


class Command(BaseCommand):
    help = 'Listen to Redis events and broadcast them to WebSocket clients.'

    def handle(self, *args, **options):
        asyncio.run(self.listen())

    async def listen(self):
        redis_url = os.environ.get("REDIS_URL")
        redis_client = redis.from_url(redis_url, decode_responses=True)
        pubsub = redis_client.pubsub()
        channel_layer = get_channel_layer()

        print(f"Starting Redis listener on {redis_url}")

        await pubsub.subscribe(*REDIS_CHANNELS)

        try:
            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue

                payload = json.loads(message["data"])
                payload = await self.enrich_issue_created(payload)
                print(f"Django event listener received message: {payload}")

                await channel_layer.group_send(
                    CHANNELS_GROUP,
                    payload,
                )
        finally:
            await pubsub.unsubscribe(*REDIS_CHANNELS)
            await pubsub.aclose()
            await redis_client.aclose()

    async def enrich_issue_created(self, payload: dict) -> dict:
        if payload.get('type') != 'issues_created':
            return payload

        type_code = payload.get('type_code')
        route_id = payload.get('route_id')
        type_description = None
        route_name = None

        if type_code is not None:
            type_description = await IssueType.objects.filter(code=type_code).values_list("description",
                                                                                          flat=True).afirst()

        if route_id is not None:
            route_name = await Route.objects.filter(id=route_id).values_list("name", flat=True).afirst()

        return {**payload, "type_description": type_description, "route_name": route_name}
