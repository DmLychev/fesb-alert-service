import { createTableDefinitions } from "../../components/DataTable";
import { NOTIFICATION_RECEIVER_FIELD_REGISTRY } from "./notificationReceiverFieldRegistry";

export const {
  columns: notificationReceiverColumns,
  filterFields: notificationReceiverFilterFields,
  editableFields: notificationReceiverEditableFields,
} = createTableDefinitions(
  NOTIFICATION_RECEIVER_FIELD_REGISTRY,
);
