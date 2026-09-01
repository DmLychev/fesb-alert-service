export interface LiveUpdateEvent {
  type: string;
  ids?: readonly (string | number)[];
  [key: string]: unknown;
}

export interface LiveUpdateContext {
  visibleRowIds: ReadonlySet<string>;
}

export interface LiveUpdateConfig {
  createConnectionUrl: (signal: AbortSignal) => Promise<string>;
  eventTypes: readonly string[];
  shouldRefresh?: (
    event: LiveUpdateEvent,
    context: LiveUpdateContext,
  ) => boolean;
  debounceMs?: number;
}

export type LiveUpdateStatus =
  | "off"
  | "connecting"
  | "connected"
  | "disconnected"
  | "paused";

export type LiveUpdatePauseReason = "editing" | "not-first-page" | null;
