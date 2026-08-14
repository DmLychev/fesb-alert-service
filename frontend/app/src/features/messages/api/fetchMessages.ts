import { createGraphQLPageFetcher } from "../../../lib/graphqlTable/createPageFetcher";
import { messageFilterFields } from "../messageTableDefinitions";
import { type Message } from "../types";

const GET_MESSAGE_PAGE = `
query GetFilteredPage($page: Int!, $size: Int!, $filters: MessageFilter, $search: String, $order: MessageOrder) {
    messagesPage(page: $page, size: $size, filters: $filters, search: $search, order: $order) {
        count
        results {
            id
            exchangeId
            requestId
            status
            errorMessage
            updateStatusAttempts
            warningLevel
            startDate
            endDate
            route {
                id
                name
                domainName
            }
        }
    }
}
`;

const fetchMessages = createGraphQLPageFetcher<Message, "messagesPage">({
  query: GET_MESSAGE_PAGE,
  rootField: "messagesPage",
  filterFields: messageFilterFields,
  fallbackError: "Ошибка получения данных по сообщениям",
});

export default fetchMessages;
