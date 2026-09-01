import { useEffect, useRef, useState } from "react";

import { createConnectionUrl } from "../../../lib/liveUpdates";

import type { DashboardLiveEvent, DashboardLiveStatus } from "../types";

interface Props {
  enabled: boolean;
  onEvent: (event: DashboardLiveEvent) => void;
  onReconnect: () => void;
}

const EVENT_TYPES = new Set([
  "messages_created",
  "messages_updated",
  "issues_created",
  "issues_updated",
  "requests_created",
]);

const isDashboardLiveEvent = (value: unknown): value is DashboardLiveEvent => {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }

  const type = (value as { type?: unknown }).type;

  return typeof type === "string" && EVENT_TYPES.has(type);
};

const useDashboardLiveUpdates = ({
  enabled,
  onEvent,
  onReconnect,
}: Props): DashboardLiveStatus => {
  const [connectionStatus, setConnectionStatus] =
    useState<Exclude<DashboardLiveStatus, "off">>("connecting");

  const onEventRef = useRef(onEvent);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    let stopped = false;
    let hasConnected = false;

    const connect = async () => {
      setConnectionStatus("connecting");

      try {
        const url = await createConnectionUrl(controller.signal);

        if (stopped) return;

        socket = new WebSocket(url);

        socket.onopen = () => {
          setConnectionStatus("connected");

          if (hasConnected) {
            onReconnectRef.current();
          }

          hasConnected = true;
        };

        socket.onmessage = (message) => {
          try {
            const payload: unknown = JSON.parse(message.data);

            if (!isDashboardLiveEvent(payload)) {
              return;
            }

            onEventRef.current(payload);
          } catch {
            console.error("Invalid dashboard WebSocket payload");
          }
        };

        socket.onerror = () => {
          setConnectionStatus("disconnected");
        };

        socket.onclose = () => {
          if (stopped) return;

          setConnectionStatus("disconnected");

          reconnectTimer = setTimeout(() => void connect(), 3000);
        };
      } catch {
        if (stopped) return;

        setConnectionStatus("disconnected");

        reconnectTimer = setTimeout(() => void connect(), 3000);
      }
    };

    void connect();

    return () => {
      stopped = true;
      controller.abort();

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      if (socket && socket.readyState < WebSocket.CLOSING) {
        socket.close();
      }
    };
  }, [enabled]);

  return enabled ? connectionStatus : "off";
};

export default useDashboardLiveUpdates;
