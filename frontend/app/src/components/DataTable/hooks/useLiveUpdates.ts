import { useEffect, useRef, useState } from "react";
import { toaster } from "../../ui/toaster";
import type {
  LiveUpdateConfig,
  LiveUpdatePauseReason,
  LiveUpdateStatus,
  LiveUpdateEvent,
} from "../types/liveUpdates";

interface UseLiveUpdatesParams {
  config?: LiveUpdateConfig;
  enabled: boolean;
  pauseReason: LiveUpdatePauseReason;
  visibleRowIds: ReadonlySet<string>;
  onEvent: () => void;
}

const isLiveUpdateEvent = (payload: unknown): payload is LiveUpdateEvent => {
  if (typeof payload !== "object" || payload === null) return false;
  if (!("type" in payload)) return false;

  return typeof (payload as { type?: unknown }).type === "string";
};

const useLiveUpdates = ({
  config,
  enabled,
  pauseReason,
  visibleRowIds,
  onEvent,
}: UseLiveUpdatesParams) => {
  type ConnectionStatus = "connecting" | "connected" | "disconnected";

  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");

  const status: LiveUpdateStatus =
    !enabled || !config ? "off" : pauseReason ? "paused" : connectionStatus;

  const visibleRowIdsRef = useRef<ReadonlySet<string>>(visibleRowIds);

  useEffect(() => {
    visibleRowIdsRef.current = visibleRowIds;
  }, [visibleRowIds]);

  useEffect(() => {
    if (!enabled || !config || pauseReason) {
      return;
    }

    const controller = new AbortController();
    let socket: WebSocket | null = null;
    let closedByCleanUp = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const acceptedEventTypes = new Set(config.eventTypes);

    const connect = async () => {
      try {
        const connectionUrl = await config.createConnectionUrl(
          controller.signal,
        );

        if (controller.signal.aborted) return;

        socket = new WebSocket(connectionUrl);
        socket.onopen = () => setConnectionStatus("connected");

        socket.onmessage = (message) => {
          try {
            const payload: unknown = JSON.parse(message.data);

            if (!isLiveUpdateEvent(payload)) return;
            if (!acceptedEventTypes.has(payload.type)) return;

            const shouldRefresh = config.shouldRefresh
              ? config.shouldRefresh(payload, {
                  visibleRowIds: visibleRowIdsRef.current,
                })
              : true;

            if (!shouldRefresh) return;
            if (refreshTimer) clearTimeout(refreshTimer);

            refreshTimer = setTimeout(onEvent, config.debounceMs ?? 300);
          } catch {
            toaster.create({
              title: "Некорректное сообщение WebSocket",
              type: "error",
              duration: 6000,
            });
          }
        };

        socket.onerror = () => setConnectionStatus("disconnected");
        socket.onclose = () => {
          if (closedByCleanUp) return;

          setConnectionStatus("disconnected");

          toaster.create({
            title: "Соединение автообновления закрыто",
            type: "warning",
            duration: 6000,
          });
        };
      } catch (error: unknown) {
        if (controller.signal.aborted) return;

        setConnectionStatus("disconnected");

        toaster.create({
          title: "Не удалось подключить автообновление",
          description: error instanceof Error ? error.message : undefined,
          type: "error",
          duration: 6000,
        });
      }
    };

    void connect();

    return () => {
      closedByCleanUp = true;

      controller.abort();

      if (refreshTimer) clearTimeout(refreshTimer);

      if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
    };
  }, [config, enabled, pauseReason, onEvent]);

  return { status, pauseReason };
};

export default useLiveUpdates;
