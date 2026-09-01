import type { DashboardBucket, DashboardRangeKey } from "./types";

interface DashboardRange {
  label: string;
  durationMs: number;
  bucketMs: number;
  bucket: DashboardBucket;
}

export const DASHBOARD_RANGES: Record<DashboardRangeKey, DashboardRange> = {
  hour: {
    label: "Последний час",
    durationMs: 60 * 60 * 1000,
    bucketMs: 60 * 1000,
    bucket: "ONE_MINUTE",
  },

  sixHours: {
    label: "Последние 6 часов",
    durationMs: 6 * 60 * 60 * 1000,
    bucketMs: 5 * 60 * 1000,
    bucket: "FIVE_MINUTES",
  },

  day: {
    label: "Последние 24 часа",
    durationMs: 24 * 60 * 60 * 1000,
    bucketMs: 15 * 60 * 1000,
    bucket: "FIFTEEN_MINUTES",
  },

  week: {
    label: "Последние 7 дней",
    durationMs: 7 * 24 * 60 * 60 * 1000,
    bucketMs: 60 * 60 * 1000,
    bucket: "ONE_HOUR",
  },

  month: {
    label: "Последние 30 дней",
    durationMs: 30 * 24 * 60 * 60 * 1000,
    bucketMs: 6 * 60 * 60 * 1000,
    bucket: "SIX_HOURS",
  },
};

export const getDashboardWindow = (
  rangeKey: DashboardRangeKey,
  now = new Date(),
) => {
  const range = DASHBOARD_RANGES[rangeKey];

  return {
    fromTime: new Date(now.getTime() - range.durationMs).toISOString(),

    toTime: now.toISOString(),
  };
};
