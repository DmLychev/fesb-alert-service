import { Button } from "@chakra-ui/react";
import { DataTable } from "../../components/DataTable";

import fetchNotificationReceivers from "./api/fetchNotificationReceivers";
import { notificationReceiverEditingConfig } from "./notificationReceiverEditingConfig";
import {
  notificationReceiverColumns,
  notificationReceiverFilterFields,
} from "./notificationReceiverTableDefinitions";
import { notificationReceiverTablePreferences } from "./notificationReceiverTablePreferences";

import type { NotificationReceiver } from "./types";
import { LuPlus } from "react-icons/lu";

interface NotificationReceiverTableProps {
  onAddSubscription: () => void;
}

const NotificationReceiverTable = ({
  onAddSubscription,
}: NotificationReceiverTableProps) => (
  <DataTable<NotificationReceiver>
    storageKey="notification-receivers-table"
    columns={notificationReceiverColumns}
    filterFields={notificationReceiverFilterFields}
    defaultPreferences={notificationReceiverTablePreferences}
    fetchPage={fetchNotificationReceivers}
    getRowId={(receiver) => receiver.id}
    editing={notificationReceiverEditingConfig}
    toolbarActions={
      <Button
        size="sm"
        onClick={onAddSubscription}
        colorPalette="green"
        variant="surface"
      >
        <LuPlus />
        Добавить
      </Button>
    }
  />
);

export default NotificationReceiverTable;
