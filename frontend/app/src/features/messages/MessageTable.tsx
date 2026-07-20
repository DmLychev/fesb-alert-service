import { DataTable } from "../../components/DataTable";
import type { Message } from "./types";
import { messageColumns, messageFilterFields } from "./messageTableDefinitions";
import { messageTablePreferences } from "./messageTablePreferences";
import fetchMessages from "./api/fetchMessages";
import { messagesWebSocketConfig } from "../../components/DataTable/constants";

const MessageTable = () => {
  return (
    <DataTable<Message>
      storageKey="messages-table"
      columns={messageColumns}
      filterFields={messageFilterFields}
      defaultPreferences={messageTablePreferences}
      fetchPage={fetchMessages}
      liveUpdates={messagesWebSocketConfig}
    />
  );
};

export default MessageTable;
