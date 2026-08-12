import strawberry
from strawberry.tools import merge_types

from .messages import MessageMutation, MessageQuery
from .issues import IssueMutation, IssueQuery

Query = merge_types("Query", (MessageQuery, IssueQuery))
Mutation = merge_types("Mutation", (MessageMutation, IssueMutation))
schema = strawberry.Schema(query=Query, mutation=Mutation)
