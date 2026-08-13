import { createLiveUpdateConfig } from "../../../lib/liveUpdates";

export const messageLiveUpdateConfig = createLiveUpdateConfig({
  eventTypes: ["messages_created", "messages_updated"],
  shouldRefresh: (event, { visibleRowIds }) => {
    if (event.type === "messages_created") return true;

    if (event.type === "messages_updated") {
      if (!Array.isArray(event.ids)) return false;

      return event.ids.some((id) => visibleRowIds.has(String(id)));
    }

    return false;
  },
  debounceMs: 250,
});
