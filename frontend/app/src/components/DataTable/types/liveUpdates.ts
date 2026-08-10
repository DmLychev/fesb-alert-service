export interface LiveUpdateConfig {
  createConnectionUrl: (signal: AbortSignal) => Promise<string>;
  eventType?: string;
  debounceMs?: number;
}

export type LiveUpdateStatus =
  | "off"
  | "connecting"
  | "connected"
  | "disconnected"
  | "paused";

export type LiveUpdatePauseReason = "editing" | "not-first-page" | null;
