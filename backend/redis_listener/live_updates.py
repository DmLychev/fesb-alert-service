import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction

logger = logging.getLogger(__name__)

LIVE_UPDATES_GROUP = "live_updates"


def publish_live_update_on_commit(event_type: str, *, ids: list[int] | None = None, **payload) -> None:
    event = {"type": event_type, **payload}

    if ids is not None:
        event["ids"] = ids

    def send_event() -> None:
        channel_layer = get_channel_layer()

        if channel_layer is None:
            logger.error("Channel layer is not configured")
            return

        try:
            async_to_sync(channel_layer.group_send)(LIVE_UPDATES_GROUP, event)
        except Exception:
            logger.exception("Failed to publish live update: %s", event)

    transaction.on_commit(send_event)
