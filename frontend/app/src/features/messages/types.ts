export type DateTimeString = string;

export type MessageStatus = "SUCCESS" | "ERROR";

export interface Route {
  id: string;
  name: string;
  domainName: string;
}

export interface Message {
  id: string;
  route: Route;
  exchangeId: string;
  requestId: string;
  errorMessage: string | null;
  updateStatusAttempts: number;
  status: "SUCCESS" | "ERROR" | null;
  startDate: DateTimeString;
  endDate?: DateTimeString | null;
  warningLevel?: number | null;
}
