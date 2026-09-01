import type { TablePreferences } from "../../components/DataTable";
import { NOTIFICATION_RECEIVER_FIELD_REGISTRY } from "./notificationReceiverFieldRegistry";

export const notificationReceiverTablePreferences: TablePreferences = {
  version: 1,

  filters: [],

  sorting: [
    {
      id: "createdAt",
      desc: true,
    },
  ],

  columnVisibility: {
    "issueType.description": false,
    "route.id": false,
  },

  columnOrder: Object.entries(
    NOTIFICATION_RECEIVER_FIELD_REGISTRY,
  )
    .filter(([, definition]) =>
      Boolean(definition.column),
    )
    .map(([fieldId]) => fieldId),

  columnSizing: {},

  pageSize: 10,

  isLiveUpdatesEnabled: false,
};
