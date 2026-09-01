import api from "../../api";
import type {
  FetchPageParams,
  FilterFieldRegistry,
  PageResult,
} from "../../components/DataTable";
import { type GraphQLResponse, unwrapGraphQLData } from "../../utils/graphql";
import { compileGraphQLFilters } from "./compileFilters";
import {
  compileGraphQLSorting,
  type SortPathOverrides,
} from "./compileSorting";

interface GraphQLPage<TData> {
  count: number;
  results: TData[];
}

type GraphQLPageData<TData, TRoot extends string> = {
  [k in TRoot]: GraphQLPage<TData>;
};

interface Options<TRoot extends string> {
  query: string;
  rootField: TRoot;
  filterFields: FilterFieldRegistry;
  fallbackError: string;
  sortPathOverrides?: SortPathOverrides;
}

export const createGraphQLPageFetcher =
  <TData, TRoot extends string>({
    query,
    rootField,
    filterFields,
    fallbackError,
    sortPathOverrides,
  }: Options<TRoot>) =>
  async ({
    pagination,
    sorting,
    search,
    filters,
    signal,
  }: FetchPageParams): Promise<PageResult<TData>> => {
    const response = await api.post<
      GraphQLResponse<GraphQLPageData<TData, TRoot>>
    >(
      "/api/graphql/",
      {
        query,
        variables: {
          page: pagination.pageIndex + 1,
          size: pagination.pageSize,
          filters: compileGraphQLFilters(filters, filterFields),
          search: search.trim() || undefined,
          order: compileGraphQLSorting(sorting, sortPathOverrides),
        },
      },
      { signal },
    );

    const data = unwrapGraphQLData(response.data, fallbackError);
    const page = data[rootField];

    return { rows: page.results, totalCount: page.count };
  };
