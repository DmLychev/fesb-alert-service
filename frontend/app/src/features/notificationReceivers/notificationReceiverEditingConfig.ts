import type { DataTableEditingConfig } from "../../components/DataTable";
import { deleteNotificationReceivers } from "./api/notificationReceiverMutations";
import { notificationReceiverEditableFields } from "./notificationReceiverTableDefinitions";
import type { NotificationReceiver } from "./types";

export const notificationReceiverEditingConfig: DataTableEditingConfig<NotificationReceiver> =
  {
    fields: notificationReceiverEditableFields,
    deleteRows: deleteNotificationReceivers,
  };
