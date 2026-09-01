import strawberry
from strawberry.tools import merge_types

from .messages import MessageMutation, MessageQuery
from .issues import IssueMutation, IssueQuery
from .notification_receivers import NotificationReceiverQuery, NotificationReceiverMutation
from .dashboard import DashboardQuery
from .fesb_requests import FesbRequestQuery

Query = merge_types("Query", (MessageQuery, IssueQuery, NotificationReceiverQuery, DashboardQuery, FesbRequestQuery))
Mutation = merge_types("Mutation", (MessageMutation, IssueMutation, NotificationReceiverMutation))
schema = strawberry.Schema(query=Query, mutation=Mutation)
