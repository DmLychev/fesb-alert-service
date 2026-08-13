import api from "../api";
import type { LiveUpdateConfig } from "../components/DataTable";

interface WebSocketTicketResponse {
  ticket: string;
  expiresIn: number;
}

const createConnectionUrl = async (signal: AbortSignal): Promise<string> => {
  const response = await api.post<WebSocketTicketResponse>(
    "/api/websocket-ticket",
    {},
    { signal },
  );

  const protocol = window.location.protocol === "https" ? "wss" : "ws";
  const baseUrl =
    import.meta.env.VITE_WEBSOCKET_BASE_URL ??
    `${protocol}//${window.location.hostname}:8000`;
  const url = new URL("ws/events", baseUrl);

  url.searchParams.set("ticket", response.data.ticket);

  return url.toString();
};

export const createLiveUpdateConfig = (
  eventType: string,
  debounceMs = 250,
): LiveUpdateConfig => ({
  createConnectionUrl,
  eventType,
  debounceMs,
});
