import { NativeSelect } from "@chakra-ui/react";
import type { EditableControlProps } from "../../../components/DataTable/types";

const getStatusBackgroud = (status: string | null) => {
  if (status === "ERROR") return "red.subtle";
  if (status === "SUCCESS") return "green.subtle";
  return "gray.subtle";
};

const MessageStatusEditor = ({
  value,
  disabled,
  onChange,
}: EditableControlProps) => {
  const status = typeof value === "string" ? value : null;

  return (
    <NativeSelect.Root size="xs" width="fit-content" disabled={disabled}>
      <NativeSelect.Field
        value={status ?? ""}
        height="24px"
        minWidth="96px"
        paddingInlineStart={2}
        paddingInlineEnd={6}
        borderColor="transparent"
        bg={getStatusBackgroud(status)}
        fontSize="xs"
        fontWeight="semibold"
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">-</option>
        <option value="SUCCESS">SUCCESS</option>
        <option value="ERROR">ERROR</option>
      </NativeSelect.Field>

      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
};

export default MessageStatusEditor;
