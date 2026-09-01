import api from "../../../api";

import {
  type GraphQLResponse,
  unwrapGraphQLData,
} from "../../../utils/graphql";

import type { DashboardFilterOptions } from "../types";

const GET_DASHBOARD_FILTER_OPTIONS = `
  query DashboardFilterOptions {
    dashboardFilterOptions {
      domains

      routes {
        id
        name
        domainName
      }
    }
  }
`;

interface DashboardFilterOptionsData {
  dashboardFilterOptions: DashboardFilterOptions;
}

const fetchDashboardFilterOptions =
  async (): Promise<DashboardFilterOptions> => {
    const response = await api.post<
      GraphQLResponse<DashboardFilterOptionsData>
    >("/api/graphql/", {
      query: GET_DASHBOARD_FILTER_OPTIONS,
    });

    const data = unwrapGraphQLData(
      response.data,
      "Ошибка получения списка фильтров Dashboard",
    );

    return data.dashboardFilterOptions;
  };

export default fetchDashboardFilterOptions;
