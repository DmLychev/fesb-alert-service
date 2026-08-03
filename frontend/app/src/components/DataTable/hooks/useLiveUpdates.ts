import { useEffect, useState } from "react";
import type { LiveUpdateConfig, LiveUpdateStatus } from "../types";
import { toaster } from "../../ui/toaster";

export type LiveUpdatePauseReason = "editing" | "not-first-page" | null;

interface UseLiveUpdatesParams {
  config?: LiveUpdateConfig;
  enabled: boolean;

  pauseReason: LiveUpdatePauseReason;

  onEvent: () => void;
}

const useLiveUpdates = ({
  config,
  enabled,
  pauseReason,
  onEvent,
}: UseLiveUpdatesParams) => {
  const [status, setStatus] = useState<LiveUpdateStatus>("off");

  useEffect(() => {
    if (!enabled || !config?.createConnectionUrl) {
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

            if (typeof payload !== "object" || payload === null) return;

            const eventType =
              "type" in payload
                ? (payload as { type?: unknown }).type
                : undefined;

            if (config.eventType && eventType !== config.eventType) return;

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
