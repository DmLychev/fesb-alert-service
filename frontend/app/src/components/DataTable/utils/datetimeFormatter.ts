const getBeginningOfCurrentDayString = (): string => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const pad = (n: number) => String(n).padStart(2, "0");
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());

  return `${year}-${month}-${day}T00:00`;
};

export default getBeginningOfCurrentDayString;
