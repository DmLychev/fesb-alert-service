import { useRef, useState } from "react";
import type { GlobalSearchProps } from "../types";
import {
  Button,
  CloseButton,
  Group,
  Input,
  InputGroup,
} from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";

const GlobalSearch = ({
  globalSearchInput,
  onGlobalSearchSubmit,
}: GlobalSearchProps) => {
  const [input, setInput] = useState(globalSearchInput);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const globalFilterClearButton = input ? (
    <CloseButton
      size="xs"
      onClick={() => {
        setInput("");
        onGlobalSearchSubmit("");
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
          size="sm"
          placeholder="Поиск по всем столбцам"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          ref={inputRef}
        />
      </InputGroup>
      <Button
        size="sm"
        bg="bg.subtle"
        variant="outline"
        onClick={() => onGlobalSearchSubmit(input)}
      >
        Найти
      </Button>
    </Group>
  );
};

export default GlobalSearch;
