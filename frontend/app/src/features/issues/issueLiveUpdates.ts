import { createTableLiveUpdateConfig } from "../../lib/liveUpdates";

export const issueLiveUpdateConfig = createTableLiveUpdateConfig({
  refreshAlwaysOn: ["issues_created"],
  refreshWhenVisibleOn: ["issues_updated"],
});
