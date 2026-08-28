import {
  createTableLiveUpdateConfig,
} from "../../lib/liveUpdates";


export const fesbRequestLiveUpdateConfig =
  createTableLiveUpdateConfig({
    refreshAlwaysOn: [
      "requests_created",
    ],

    refreshWhenVisibleOn: [
      "requests_updated",
    ],
  });
