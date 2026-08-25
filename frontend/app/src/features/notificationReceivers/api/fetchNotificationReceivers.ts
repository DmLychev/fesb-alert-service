import { createGraphQLPageFetcher } from "../../../lib/graphqlTable/createPageFetcher";
import { notificationReceiverFilterFields } from "../notificationReceiverTableDefinitions";
import type { NotificationReceiver } from "../types";

const GET_NOTIFICATION_RECEIVERS_PAGE = `
query GetNotificationReceiversPage(
  $page: Int!,
  $size: Int!,
  $filters: NotificationReceiverFilter,
  $search: String,
  $order: NotificationReceiverOrder
) {
  notificationReceiversPage(
    page: $page,
    size: $size,
    filters: $filters,
    search: $search,
    order: $order
  ) {
    count
    results {
      id
      email
      domainName
      createdAt
      updatedAt

      issueType {
        code
        description
        scope
      }

      route {
        id
        name
        domainName
      }
    }
  }
}
`;

const fetchNotificationReceivers =
  createGraphQLPageFetcher<
    NotificationReceiver,
    "notificationReceiversPage"
  >({
    query: GET_NOTIFICATION_RECEIVERS_PAGE,
    rootField: "notificationReceiversPage",
    filterFields: notificationReceiverFilterFields,
    fallbackError: "Ошибка получения получателей уведомлений",
  });

export default fetchNotificationReceivers;
