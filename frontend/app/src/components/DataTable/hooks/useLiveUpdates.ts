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
  const [status, setStatus] = useState<LiveUpdateStatus>("off");
  const visibleRowIidsRef = useRef<ReadonlySet<string>>(visibleRowIds);

  useEffect(() => {
    visibleRowIidsRef.current = visibleRowIds;
  }, [visibleRowIds]);

  useEffect(() => {
    if (!enabled || !config) {
      setStatus("off");
      return;
    }

    if (pauseReason) {
      setStatus("paused");
      return;
    }

    setStatus("connecting");

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
        socket.onopen = () => setStatus("connected");

        socket.onmessage = (message) => {
          try {
            const payload: unknown = JSON.parse(message.data);

            if (!isLiveUpdateEvent(payload)) return;
            if (!acceptedEventTypes.has(payload.type)) return;

            const shouldRefresh = config.shouldRefresh
              ? config.shouldRefresh(payload, {
                  visibleRowIds: visibleRowIidsRef.current,
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

        socket.onerror = () => setStatus("disconnected");
        socket.onclose = () => {
          if (closedByCleanUp) return;

          setStatus("disconnected");

          toaster.create({
            title: "Соединение автообновления закрыто",
            type: "warning",
            duration: 6000,
          });
        };
      } catch (error: unknown) {
        if (controller.signal.aborted) return;

        setStatus("disconnected");

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
