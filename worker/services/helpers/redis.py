import redis.asyncio as redis
import os
import json
import logging

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv('REDIS_URL', None)
if REDIS_URL is None:
    raise ValueError('REDIS_URL environment variable not set')

redis_client = redis.from_url(REDIS_URL, decode_responses=True)


async def publish_new_messages(count: int) -> None:
    channel = "messages"
    payload = dict(type="messages.created", count=count)
    await redis_client.publish(channel, json.dumps(payload))

    logger.debug(f'В канале "{channel}" опубликовано сообщение: {payload}')
