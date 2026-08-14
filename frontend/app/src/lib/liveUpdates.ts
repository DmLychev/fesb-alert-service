import api from "../api";
import type { LiveUpdateConfig } from "../components/DataTable";

interface WebSocketTicketResponse {
  ticket: string;
}

interface CreateLiveUpdateConfigOptions {
  eventTypes: readonly string[];
  shouldRefresh?: LiveUpdateConfig["shouldRefresh"];
  debounceMs?: number;
}

interface CreateTableLiveUpdateConfigOptions {
  refreshAlwaysOn?: readonly string[];
  refreshWhenVisibleOn?: readonly string[];
  debounceMs?: number;
}

const createConnectionUrl = async (signal: AbortSignal): Promise<string> => {
  const response = await api.post<WebSocketTicketResponse>(
    "/api/websocket-ticket/",
    {},
    { signal },
  );

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const baseUrl =
    import.meta.env.VITE_WEBSOCKET_BASE_URL ??
    `${protocol}//${window.location.hostname}:8000`;
  const url = new URL("/ws/events/", baseUrl);

  url.searchParams.set("ticket", response.data.ticket);

  return url.toString();
};

export const createLiveUpdateConfig = ({
  eventTypes,
  shouldRefresh,
  debounceMs = 250,
}: CreateLiveUpdateConfigOptions): LiveUpdateConfig => ({
  createConnectionUrl,
  eventTypes,
  shouldRefresh,
  debounceMs,
});

export const createTableLiveUpdateConfig = ({
  refreshAlwaysOn = [],
  refreshWhenVisibleOn = [],
  debounceMs = 250,
}: CreateTableLiveUpdateConfigOptions): LiveUpdateConfig => {
  const alwaysRefreshEvents = new Set(refreshAlwaysOn);
  const visibleRowEvents = new Set(refreshWhenVisibleOn);

  return createLiveUpdateConfig({
    eventTypes: [...new Set([...refreshAlwaysOn, ...refreshWhenVisibleOn])],

    shouldRefresh: (event, { visibleRowIds }) => {
      if (alwaysRefreshEvents.has(event.type)) return true;
      if (!visibleRowEvents.has(event.type)) return false;
      if (!Array.isArray(event.ids)) return false;

      return event.ids.some((id) => visibleRowIds.has(String(id)));
    },

    debounceMs,
  });
};
