import strawberry
from strawberry.tools import merge_types

from .messages import MessageMutation, MessageQuery
from .issues import IssueMutation, IssueQuery
from .notification_receivers import NotificationReceiverQuery

Query = merge_types("Query", (MessageQuery, IssueQuery, NotificationReceiverQuery))
Mutation = merge_types("Mutation", (MessageMutation, IssueMutation))
schema = strawberry.Schema(query=Query, mutation=Mutation)
