import type { DashboardRangeKey } from "./types";

const createDateFormatter = (options: Intl.DateTimeFormatOptions) => {
  const formatter = new Intl.DateTimeFormat("ru-RU", options);

  return (value: string | number): string => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return formatter.format(date);
  };
};

export const getChartAxisDateFormatter = (rangeKey: DashboardRangeKey) => {
  switch (rangeKey) {
    case "hour":
    case "sixHours":
    case "day":
      return createDateFormatter({
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });

    case "week":
    case "month":
      return createDateFormatter({
        day: "2-digit",
        month: "2-digit",
      });
  }
};

export const getChartTooltipDateFormatter = (rangeKey: DashboardRangeKey) => {
  switch (rangeKey) {
    case "hour":
      return createDateFormatter({
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });

    case "sixHours":
    case "day":
    case "week":
    case "month":
      return createDateFormatter({
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
  }
};
