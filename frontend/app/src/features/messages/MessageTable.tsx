import { DataTable } from "../../components/DataTable";
import type { Message } from "./types";
import { messageColumns, messageFilterFields } from "./messageTableDefinitions";
import { messageTablePreferences } from "./messageTablePreferences";
import fetchMessages from "./api/fetchMessages";
import { messageLiveUpdateConfig } from "./api/messageLiveUpdates";

const MessageTable = () => {
  return (
    <DataTable<Message>
      storageKey="messages-table"
      columns={messageColumns}
      filterFields={messageFilterFields}
      defaultPreferences={messageTablePreferences}
      fetchPage={fetchMessages}
      getRowId={(message) => message.id}
      liveUpdates={messageLiveUpdateConfig}
    />
  );
};

export default MessageTable;
