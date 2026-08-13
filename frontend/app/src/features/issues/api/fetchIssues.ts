import api from "../../../api";
import type {
  FetchPageParams,
  PageResult,
} from "../../../components/DataTable";
import type { Issue } from "../types";
import { compileIssueFilters } from "../utils/compileIssueFilters";
import { compileIssueSorting } from "../utils/compileIssueSorting";

const GET_ISSUES_PAGE = `
query GetFilteredPage($page: Int!, $size: Int!, $filters: IssueFilter, $search: String, $order: IssueOrder) {
    issuesPage(page: $page, size: $size, filters: $filters, search: $search, order: $order) {
         count
    results {
      text
      routeId
      domainName
      isNotified
      isSolved
      createdAt
      updatedAt
      type {
        code
        description
      }
    }
  }
}
`;

const fetchIssues = async ({
  pagination,
  sorting,
  search,
  filters,
  signal,
}: FetchPageParams): Promise<PageResult<Issue>> => {
  const response = await api.post(
    "/api/graphql/",
    {
      query: GET_ISSUES_PAGE,
      variables: {
        page: pagination.pageIndex + 1,
        size: pagination.pageSize,
        filters: compileIssueFilters(filters),
        search: search.trim() || undefined,
        order: compileIssueSorting(sorting),
      },
    },
    { signal },
  );

  const payload = response.data.data.issuesPage;

  return {
    rows: payload.results,
    totalCount: payload.count,
  };
};

export default fetchIssues;
