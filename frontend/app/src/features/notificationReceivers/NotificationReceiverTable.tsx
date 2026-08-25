import { DataTable } from "../../components/DataTable";

import fetchNotificationReceivers from "./api/fetchNotificationReceivers";
import {
  notificationReceiverColumns,
  notificationReceiverFilterFields,
} from "./notificationReceiverTableDefinitions";
import { notificationReceiverTablePreferences } from "./notificationReceiverTablePreferences";

import type { NotificationReceiver } from "./types";

const NotificationReceiverTable = () => (
  <DataTable<NotificationReceiver>
    storageKey="notification-receivers-table"
    columns={notificationReceiverColumns}
    filterFields={notificationReceiverFilterFields}
    defaultPreferences={
      notificationReceiverTablePreferences
    }
    fetchPage={fetchNotificationReceivers}
    getRowId={(receiver) => receiver.id}
  />
);

export default NotificationReceiverTable;
