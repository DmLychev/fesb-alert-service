from django.contrib.auth.models import AnonymousUser
from django.http import HttpRequest, HttpResponse
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from strawberry.django.views import GraphQLView


class JWTGraphQLView(GraphQLView):
    def get_context(self, request: HttpRequest, response: HttpResponse):
        request.user = getattr(request, "user", AnonymousUser())

        try:
            authentication_result = JWTAuthentication().authenticate(request)
        except AuthenticationFailed:
            authentication_result = None

        if authentication_result is not None:
            user, _validated_token = authentication_result
            request.user = user

        return super().get_context(request, response)
