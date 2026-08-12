import strawberry
from strawberry.tools import merge_types

from .messages import MessageMutation, MessageQuery

Query = merge_types("Query", (MessageQuery,))
Mutation = merge_types("Mutation", (MessageMutation,))
schema = strawberry.Schema(query=Query, mutation=Mutation)
