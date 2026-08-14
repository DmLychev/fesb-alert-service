import { createTableLiveUpdateConfig } from "../../lib/liveUpdates";

export const messageLiveUpdateConfig = createTableLiveUpdateConfig({
  refreshAlwaysOn: ["messages_created"],
  refreshWhenVisibleOn: ["messages_updated"],
});
