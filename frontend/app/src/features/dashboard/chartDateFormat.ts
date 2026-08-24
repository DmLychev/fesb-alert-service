interface ChartTimePoint {
  start: string;
}

const getDayKey = (date: Date): string =>
  [
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ].join("-");


const getDailyTicks = (
  data: ChartTimePoint[],
): string[] => {
  const result: string[] = [];

  let previousDay: string | null = null;

  for (const point of data) {
    const date = new Date(point.start);

    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const day = getDayKey(date);

    if (day === previousDay) {
      continue;
    }

    previousDay = day;
    result.push(point.start);
  }

  return result;
};


export const getChartAxisTicks = (
  data: ChartTimePoint[],
  rangeKey: DashboardRangeKey,
): string[] => {
  switch (rangeKey) {
    /*
     * 1-minute buckets.
     *
     * Show:
     * 16:25  16:30  16:35  16:40 ...
     */
    case "hour":
      return data
        .filter((point) => {
          const date = new Date(point.start);

          return (
            !Number.isNaN(date.getTime()) &&
            date.getMinutes() % 5 === 0
          );
        })
        .map((point) => point.start);


    /*
     * 5-minute buckets.
     *
     * Show:
     * 10:00  10:30  11:00  11:30 ...
     */
    case "sixHours":
      return data
        .filter((point) => {
          const date = new Date(point.start);

          return (
            !Number.isNaN(date.getTime()) &&
            date.getMinutes() % 30 === 0
          );
        })
        .map((point) => point.start);


    /*
     * 15-minute buckets.
     *
     * Show:
     * 00:00  02:00  04:00  06:00 ...
     */
    case "day":
      return data
        .filter((point) => {
          const date = new Date(point.start);

          return (
            !Number.isNaN(date.getTime()) &&
            date.getMinutes() === 0 &&
            date.getHours() % 2 === 0
          );
        })
        .map((point) => point.start);


    /*
     * One representative timestamp for every local calendar day.
     */
    case "week":
    case "month":
      return getDailyTicks(data);
  }
};
