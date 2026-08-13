import os
import json
import logging

import redis.asyncio as redis

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv('REDIS_URL', None)
if REDIS_URL is None:
    raise ValueError('REDIS_URL environment variable not set')

redis_client = redis.from_url(REDIS_URL, decode_responses=True)


async def publish_event(channel: str, payload: dict) -> None:
    await redis_client.publish(channel, json.dumps(payload))
    logger.debug(f'В канале "{channel}" опубликовано сообщение: {payload}')


async def publish_new_messages(count: int) -> None:
    await publish_event(channel='messages', payload=dict(type="messages_created", count=count))


async def publish_updated_messages(ids: list[int]) -> None:
    if not ids:
        return

    await publish_event(channel="messages", payload=dict(type="messages_updated", ids=ids))
