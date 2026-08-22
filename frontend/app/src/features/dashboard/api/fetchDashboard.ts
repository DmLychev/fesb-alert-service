import api from "../../../api";
import {
  type GraphQLResponse,
  unwrapGraphQLData,
} from "../../../utils/graphql";

import { DASHBOARD_RANGES, getDashboardWindow } from "../dashboardRanges";

import type { DashboardRangeKey, DashboardSnapshot } from "../types";

const GET_DASHBOARD = `
  query Dashboard(
    $fromTime: DateTime!
    $toTime: DateTime!
    $bucket: DashboardBucket!
  ) {
    dashboard(
      fromTime: $fromTime
      toTime: $toTime
      bucket: $bucket
    ) {
      generatedAt
      activeIssues

      messageTraffic {
        start
        total
        successful
        failed
      }

      issuesTimeline {
        start
        total
      }

      issueTypes {
        code
        description
        count
      }

      problematicRoutes {
        routeId
        routeName
        count
      }

      fesbApiHealth {
        start
        successful
        failed
      }
    }
  }
`;

interface DashboardData {
  dashboard: DashboardSnapshot;
}

const fetchDashboard = async (
  rangeKey: DashboardRangeKey,
): Promise<DashboardSnapshot> => {
  const range = DASHBOARD_RANGES[rangeKey];
  const window = getDashboardWindow(rangeKey);

  const response = await api.post<GraphQLResponse<DashboardData>>(
    "/api/graphql/",
    {
      query: GET_DASHBOARD,
      variables: {
        ...window,
        bucket: range.bucket,
      },
    },
  );

  const data = unwrapGraphQLData(
    response.data,
    "Ошибка получения данных Dashboard",
  );

  return data.dashboard;
};

export default fetchDashboard;
