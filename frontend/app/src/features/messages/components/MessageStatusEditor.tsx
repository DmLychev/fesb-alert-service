import { NativeSelect } from "@chakra-ui/react";
import type { EditableControlProps } from "../../../components/DataTable/types";

const getStatusBackground = (status: string | null) => {
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
    <NativeSelect.Root size="xs" width="full" minWidth={0} disabled={disabled}>
      <NativeSelect.Field
        value={status ?? ""}
        height="24px"
        width="full"
        minWidth={0}
        paddingInlineStart={2}
        paddingInlineEnd={6}
        borderColor="transparent"
        bg={getStatusBackground(status)}
        fontSize="xs"
        fontWeight="semibold"
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">—</option>
        <option value="SUCCESS">SUCCESS</option>
        <option value="ERROR">ERROR</option>
      </NativeSelect.Field>

      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
};

export default MessageStatusEditor;
