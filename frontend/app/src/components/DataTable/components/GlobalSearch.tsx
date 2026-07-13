import { useEffect, useRef, useState } from "react";
import type { GlobalSearchProps } from "../types";
import {
  Button,
  CloseButton,
  Group,
  Input,
  InputGroup,
} from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";

const GlobalSearch = ({ value, onSubmit }: GlobalSearchProps) => {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const globalFilterClearButton = inputValue ? (
    <CloseButton
      size="xs"
      onClick={() => {
        setInputValue("");
        onSubmit("");
        inputRef.current?.focus();
      }}
      me="-2"
    />
  ) : undefined;

  return (
    <Group attached>
      <InputGroup
        flex="1"
        startElement={<LuSearch />}
        endElement={globalFilterClearButton}
      >
        <Input
          ref={inputRef}
          size="sm"
          placeholder="Поиск по всем столбцам"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.type === "Enter") {
              onSubmit(inputValue);
            }
          }}
        />
      </InputGroup>

      <Button
        size="sm"
        bg="bg.subtle"
        variant="outline"
        onClick={() => onSubmit(inputValue)}
      >
        Найти
      </Button>
    </Group>
  );
};

export default GlobalSearch;
