import { createGraphQLPageFetcher } from "../../../lib/graphqlTable/createPageFetcher";
import { issueFilterFields } from "../issueTableDefinitions";
import type { Issue } from "../types";

const GET_ISSUES_PAGE = `
query GetFilteredPage(
  $page: Int!,
  $size: Int!, 
  $filters: IssueFilter,
  $search: String,
  $order: IssueOrder) {
    issuesPage(
      page: $page,
      size: $size,
      filters: $filters,
      search: $search,
      order: $order
    ) {
        count
        results {
          id
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

const fetchIssues = createGraphQLPageFetcher<Issue, "issuesPage">({
  query: GET_ISSUES_PAGE,
  rootField: "issuesPage",
  filterFields: issueFilterFields,
  fallbackError: "Ошибка получения данных по инцидентам",
});

export default fetchIssues;
