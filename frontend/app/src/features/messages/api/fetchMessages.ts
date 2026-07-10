import api from "../../../api";
import type {
  FetchPageParams,
  PageResult,
} from "../../../components/DataTable/types";
import type { Message } from "../types";
import { compileMessageFilters } from "../utils/compileMessageFilters";
import { compileMessageSorting } from "../utils/compileMessageSorting";

const GET_MESSAGE_PAGE = `
query GetFilteredPage($page: Int!, $size: Int!, $filters: MessageFilter, $search: String, $order: MessageOrder) {
    messagesPage(page: $page, size: $size, filters: $filters, search: $search, order: $order) {
        count
        results {
            exchangeId
            requestId
            status
            errorMessage
            updateStatusAttempts
            startDate
            route {
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
  const response = await api.post(
    "/api/graphql",
    {
      query: GET_MESSAGE_PAGE,
      variables: {
        page: pagination.pageIndex + 1,
        size: pagination.pageSize,
        filters: compileMessageFilters(filters),
        search: search || undefined,
        order: compileMessageSorting(sorting),
      },
    },
    { signal },
  );

  const payload = response.data.data.messagesPage;

  return {
    rows: payload.results,
    totalCount: payload.count,
  };
};

export default fetchMessages;
