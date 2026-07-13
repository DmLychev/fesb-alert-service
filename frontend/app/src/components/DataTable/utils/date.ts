export const formatDateTime = (isoDateTime?: string | null): string => {
  if (!isoDateTime) return "";

  const date = new Date(isoDateTime);

  const pad = (number: number, size = 2) => String(number).padStart(size, "0");

  return [
    `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`,
  ].join("");
};

export const getBeginningOfCurrentDayString = (): string => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const pad = (number: number) => String(number).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T00:00`;
};
