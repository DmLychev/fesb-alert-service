import type { DateTimeString } from "../../components/DataTable/types";

export interface Route {
  id: string;
  name: string;
  domainName: string;
}

export interface Message {
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
