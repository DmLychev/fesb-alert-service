import { useEffect, useState, type ReactNode } from "react";
import type { EditableFieldDefinition, EditableValue } from "../types";
import {
  Box,
  Checkbox,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  Spinner,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { LuCheck, LuX } from "react-icons/lu";

interface EditableCellProps {
  definition: EditableFieldDefinition;
  value: EditableValue;
  displayContent: ReactNode;

  onSave: (value: EditableValue) => Promise<void>;
}

type DraftValue = string | boolean;

const toDraftValue = (
  value: EditableValue,
  type: EditableFieldDefinition["type"],
): DraftValue => {
  if (type === "boolean") return value === true;

  return value === null ? "" : String(value);
};

const EditableCell = ({
  definition,
  value,
  displayContent,
  onSave,
}: EditableCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftValue>(
    toDraftValue(value, definition.type),
  );

  useEffect(() => {
    if (!isEditing) setDraft(toDraftValue(value, definition.type));
  }, [value, definition.type, isEditing]);

  const cancel = () => {
    setDraft(toDraftValue(value, definition.type));

    setError(null);
    setIsEditing(false);
  };

  const parseDraft = (): EditableValue => {
    if (definition.type === "boolean") return draft === true;

    const text = String(draft);

    if (text === "") {
      if (definition.nullable) return null;

      throw new Error(`${definition.label} cannot be empty`);
    }

    if (definition.type === "number") {
      const parsedValue = Number(text);

      if (!Number.isFinite(parsedValue))
        throw new Error(`${definition.label} must be a number`);

      return parsedValue;
    }

    return text;
  };

  const save = async () => {
    try {
      setError(null);

      const parsedValue = parseDraft();

      if (Object.is(parsedValue, value)) {
        setIsEditing(false);
        return;
      }

      setIsSaving(true);

      await onSave(parsedValue);

      setIsEditing(false);
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Failed to update value",
      );
    } finally {
      setIsSaving(false);
    }

    if (!isEditing)
      return (
        <Box
          minH="24px"
          cursor="text"
          onDoubleClick={() => {
            setError(null);
            setIsEditing(true);
          }}
        >
          {displayContent}
        </Box>
      );
  };

  const editor = (() => {
    if (definition.type === "string" && definition.control === "textarea")
      return (
        <Textarea
          value={String(draft)}
          onChange={(event) => setDraft(event.target.value)}
          size="sm"
          minH="80px"
          maxH="160px"
          resize="vertical"
          disabled={isSaving}
          autoFocus
        />
      );

    if (definition.type === "choice")
      return (
        <NativeSelect.Root size="sm" disabled={isSaving}>
          <NativeSelect.Field
            value={String(draft)}
            onChange={(event) => setDraft(event.target.value)}
            autoFocus
          >
            {definition.nullable && <option value="">-</option>}

            {definition.choices?.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      );

    if (definition.type === "boolean")
      return (
        <Checkbox.Root
          checked={draft === true}
          disabled={isSaving}
          onCheckedChange={({ checked }) => setDraft(checked === true)}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
        </Checkbox.Root>
      );

    return (
      <Input
        type={
          definition.type === "number"
            ? "number"
            : definition.type === "datetime"
              ? "datetime-local"
              : "text"
        }
        value={String(draft)}
        onChange={(event) => setDraft(event.target.value)}
        size="sm"
        disabled={isSaving}
        autoFocus
      />
    );
  })();

  return (
    <Stack gap={1}>
      <HStack alignItems="flex-start" gap={1}>
        <Box flex="1" minW={0}>
          {editor}
        </Box>

        <IconButton
          aria-label="Save value"
          size="xs"
          variant="ghost"
          disabled={isSaving}
          onClick={() => void save()}
        >
          {isSaving ? <Spinner size="xs" /> : <LuCheck />}
        </IconButton>

        <IconButton
          aria-label="Cancel editing"
          size="xs"
          variant="ghost"
          disabled={isSaving}
          onClick={cancel}
        >
          <LuX />
        </IconButton>
      </HStack>

      {error && (
        <Text fontSize="xs" color="fg.error" whiteSpace="normal">
          {error}
        </Text>
      )}
    </Stack>
  );
};

export default EditableCell;
