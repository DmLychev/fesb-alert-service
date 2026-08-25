import { DataTable } from "../../components/DataTable";

import fetchNotificationReceivers from "./api/fetchNotificationReceivers";
import { notificationReceiverEditingConfig } from "./notificationReceiverEditingConfig";
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
    defaultPreferences={notificationReceiverTablePreferences}
    fetchPage={fetchNotificationReceivers}
    getRowId={(receiver) => receiver.id}
    editing={notificationReceiverEditingConfig}
  />
);

export default NotificationReceiverTable;
