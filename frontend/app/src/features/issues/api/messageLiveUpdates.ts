import api from "../../../api";
import type { LiveUpdateConfig } from "../../../components/DataTable";

interface WebSocketTicketResponse {
  ticket: string;
  expiresIn: number;
}

const createMessageConnectionUrl = async (
  signal: AbortSignal,
): Promise<string> => {
  const response = await api.post<WebSocketTicketResponse>(
    "/api/websocket-ticket/",
    {},
    { signal },
  );

  const websocketProtocol =
    window.location.protocol === "https:" ? "wss:" : "ws:";

  const websocketBaseUrl =
    import.meta.env.VITE_WEBSOCKET_BASE_URL ??
    `${websocketProtocol}//${window.location.hostname}:8000`;

  const url = new URL("ws/messages/", websocketBaseUrl);

  url.searchParams.set("ticket", response.data.ticket);

  return url.toString();
};

export const messageLiveUpdateConfig: LiveUpdateConfig = {
  createConnectionUrl: createMessageConnectionUrl,
  eventType: "messages_created",
  debounceMs: 250,
};
