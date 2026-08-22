import { useState, type KeyboardEvent } from "react";
import type { EditableFieldDefinition, EditableValue } from "../types";
import {
  Checkbox,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";

interface EditableCellProps {
  definition: EditableFieldDefinition;
  value: EditableValue;
  disabled?: boolean;
  onChange: (value: EditableValue) => void;
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
  disabled,
  onChange,
}: EditableCellProps) => {
  const [draft, setDraft] = useState<DraftValue>(
    toDraftValue(value, definition.type),
  );
  const [error, setError] = useState<string | null>(null);

  const parseDraft = (draftValue: DraftValue): EditableValue => {
    if (definition.type === "boolean") return draftValue === true;

    const text = String(draftValue);

    if (text === "") {
      if (definition.nullable) return null;

      throw new Error(`${definition.label} cannot be empty`);
    }

    if (definition.type === "number") {
      const numberValue = Number(text);

      if (!Number.isFinite(numberValue))
        throw new Error(`${definition.label} must be a number`);

      return numberValue;
    }

    return text;
  };

  const commit = (draftValue = draft) => {
    try {
      setError(null);
      onChange(parseDraft(draftValue));
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Invalid value");
    }
  };

  const cancelEditing = () => {
    setDraft(toDraftValue(value, definition.type));
    setError(null);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
      return;
    }

    const shouldCommit =
      event.key === "Enter" &&
      (definition.control !== "textarea" || event.ctrlKey);

    if (shouldCommit) {
      event.preventDefault();
      commit();
    }
  };

  if (definition.renderEditor)
    return definition.renderEditor({ value, disabled, onChange });

  if (definition.type === "choice") {
    return (
      <NativeSelect.Root size="sm" disabled={disabled}>
        <NativeSelect.Field
          value={String(draft)}
          onChange={(event) => {
            const nextDraft = event.target.value;

            setDraft(nextDraft);
            commit(nextDraft);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") cancelEditing();
          }}
        >
          {definition.nullable && <option value="">-</option>}
          {definition.choices?.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.value}
            </option>
          ))}
        </NativeSelect.Field>

        <NativeSelect.Indicator />
      </NativeSelect.Root>
    );
  }

  if (definition.type === "boolean") {
    return (
      <Checkbox.Root
        checked={draft === true}
        disabled={disabled}
        onCheckedChange={({ checked }) => {
          const nextDraft = checked === true;
          setDraft(nextDraft);
          commit(nextDraft);
        }}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
      </Checkbox.Root>
    );
  }

  const input =
    definition.type === "string" && definition.control === "textarea" ? (
      <Textarea
        value={String(draft)}
        minH="80px"
        maxH="160px"
        resize="vertical"
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => commit()}
        onKeyDown={handleKeyDown}
      />
    ) : (
      <Input
        type={
          definition.type === "number"
            ? "number"
            : definition.type === "datetime"
              ? "datetime-local"
              : "text"
        }
        value={String(draft)}
        size="sm"
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => commit()}
        onKeyDown={handleKeyDown}
      />
    );

  return (
    <Stack gap={1}>
      {input}

      {error && (
        <Text color="fg.error" fontSize="xs" whiteSpace="normal">
          {error}
        </Text>
      )}
    </Stack>
  );
};

export default EditableCell;
