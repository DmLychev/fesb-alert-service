from typing import Any, Awaitable

from strawberry.permission import BasePermission
from strawberry.types import Info

class IsAuthenticated(BasePermission):
    message = "Authentication is required"

    def has_permission(
        self, source: Any, info: Info, **kwargs: Any
    ) -> bool | Awaitable[bool]:
        user = info.context.request.user

        return bool(user and user.is_authenticated and user.is_active)


class CanDeleteMessages(BasePermission):
    message = "You do not have permission to delete this message"

    def has_permission(
            self, source: Any, info: Info, **kwargs: Any
    ) -> bool | Awaitable[bool]:
        user = info.context.request.user

        return user.is_authenticated and user.has_perm("alert_service.delete_message")
