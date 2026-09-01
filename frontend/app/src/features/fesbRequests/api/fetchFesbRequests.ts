import {
  createGraphQLPageFetcher,
} from "../../../lib/graphqlTable/createPageFetcher";

import {
  fesbRequestFilterFields,
} from "../fesbRequestTableDefinitions";

import type {
  FesbRequest,
} from "../types";


const GET_FESB_REQUESTS_PAGE = `
query GetFesbRequestsPage(
  $page: Int!,
  $size: Int!,
  $filters: FesbRequestFilter,
  $search: String,
  $order: FesbRequestOrder
) {
  fesbRequestsPage(
    page: $page,
    size: $size,
    filters: $filters,
    search: $search,
    order: $order
  ) {
    count

    results {
      id

      isSuccessful
      details
      warningLevel

      createdAt
      updatedAt

      type {
        id
        title
      }
    }
  }
}
`;


const fetchFesbRequests =
  createGraphQLPageFetcher<
    FesbRequest,
    "fesbRequestsPage"
  >({
    query: GET_FESB_REQUESTS_PAGE,

    rootField:
      "fesbRequestsPage",

    filterFields:
      fesbRequestFilterFields,

    fallbackError:
      "Ошибка получения данных по запросам FESB",
  });


export default fetchFesbRequests;
