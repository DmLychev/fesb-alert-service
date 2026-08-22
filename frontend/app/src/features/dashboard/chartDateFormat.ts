import type { DashboardRangeKey } from "./types";

export const getChartDateFormat = (
  rangeKey: DashboardRangeKey,
): Intl.DateTimeFormatOptions => {
  switch (rangeKey) {
    case "hour":
    case "sixHours":
    case "day":
      return {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      };

    case "week":
    case "month":
      return {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      };
  }
};
