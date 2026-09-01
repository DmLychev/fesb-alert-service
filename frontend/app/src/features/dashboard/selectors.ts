import type { DashboardSnapshot } from "./types";

export const getDashboardMetrics = (dashboard: DashboardSnapshot) => {
  const messages = dashboard.messageTraffic.reduce(
    (result, bucket) => ({
      total: result.total + bucket.total,
      successful: result.successful + bucket.successful,
      failed: result.failed + bucket.failed,
    }),
    {
      total: 0,
      successful: 0,
      failed: 0,
    },
  );

  const completedMessages = messages.successful + messages.failed;

  const messageSuccessRate =
    completedMessages === 0
      ? null
      : (messages.successful / completedMessages) * 100;

  const newIssues = dashboard.issuesTimeline.reduce(
    (total, bucket) => total + bucket.total,
    0,
  );

  const fesbRequests = dashboard.fesbApiHealth.reduce(
    (result, bucket) => ({
      successful: result.successful + bucket.successful,
      failed: result.failed + bucket.failed,
    }),
    {
      successful: 0,
      failed: 0,
    },
  );

  const totalRequests = fesbRequests.successful + fesbRequests.failed;

  const fesbSuccessRate =
    totalRequests === 0
      ? null
      : (fesbRequests.successful / totalRequests) * 100;

  return {
    messages: messages.total,
    messageFailures: messages.failed,
    messageSuccessRate,
    newIssues,
    activeIssues: dashboard.activeIssues,
    fesbFailures: fesbRequests.failed,
    fesbSuccessRate,
  };
};

export const getMetricComparison = (current: number, previous: number) => {
  const difference = current - previous;

  const percentage =
    previous === 0 ? (current === 0 ? 0 : null) : (difference / previous) * 100;

  return { difference, percentage };
};
