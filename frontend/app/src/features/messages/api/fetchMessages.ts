import api from "../../../api";
import type {
  FetchPageParams,
  PageResult,
} from "../../../components/DataTable";
import {
  unwrapGraphQLData,
  type GraphQLResponse,
} from "../../../utils/graphql";
import type { Message } from "../types";
import { compileMessageFilters } from "../utils/compileMessageFilters";
import { compileMessageSorting } from "../utils/compileMessageSorting";

interface MessagesPageData {
  messagesPage: {
    count: number;
    results: Message[];
  };
}

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

const fetchMessages = async ({
  pagination,
  sorting,
  search,
  filters,
  signal,
}: FetchPageParams): Promise<PageResult<Message>> => {
  const response = await api.post<GraphQLResponse<MessagesPageData>>(
    "/api/graphql/",
    {
      query: GET_MESSAGE_PAGE,
      variables: {
        page: pagination.pageIndex + 1,
        size: pagination.pageSize,
        filters: compileMessageFilters(filters),
        search: search.trim() || undefined,
        order: compileMessageSorting(sorting),
      },
    },
    { signal },
  );

  const data = unwrapGraphQLData(
    response.data,
    "Ошибка получения данных по сообщениям",
  );

  const payload = data.messagesPage;

  return {
    rows: payload.results,
    totalCount: payload.count,
  };
};

export default fetchMessages;
