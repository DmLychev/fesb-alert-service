import type { DataTableEditingConfig } from "../../components/DataTable/types";
import { deleteMessages, updateMessage } from "./api/messageMutations";
import { messageEditableFields } from "./messageTableDefinitions";
import type { Message } from "./types";

export const messageEditingConfig: DataTableEditingConfig<Message> = {
  fields: messageEditableFields,
  updateRow: updateMessage,
  deleteRows: deleteMessages,
};
