import { useMemo, useState } from "react";

import {
  Box,
  Button,
  Checkbox,
  HStack,
  Input,
  Popover,
  Stack,
  Text,
} from "@chakra-ui/react";

import { LuChevronDown, LuSearch } from "react-icons/lu";

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
  searchText?: string;
}

interface MultiSelectFilterProps {
  title: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
  minWidth?: string;
}

const MultiSelectFilter = ({
  title,
  options,
  selected,
  onChange,
  disabled = false,
  minWidth = "190px",
}: MultiSelectFilterProps) => {
  const [search, setSearch] = useState("");

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filteredOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    if (!normalizedSearch) {
      return options;
    }

    return options.filter((option) => {
      const searchable = [
        option.label,
        option.description,
        option.searchText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [options, search]);

  const toggleValue = (value: string, checked: boolean) => {
    if (checked) {
      if (!selectedSet.has(value)) {
        onChange([...selected, value]);
      }

      return;
    }

    onChange(selected.filter((selectedValue) => selectedValue !== value));
  };

  return (
    <Popover.Root portalled lazyMount closeOnInteractOutside={true}>
      <Popover.Trigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          minWidth={minWidth}
          justifyContent="space-between"
        >
          <Text truncate>
            {selected.length > 0 ? `${title}: ${selected.length}` : title}
          </Text>

          <LuChevronDown />
        </Button>
      </Popover.Trigger>

      <Popover.Positioner>
        <Popover.Content
          width="340px"
          p={3}
          boxShadow="md"
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.muted"
          zIndex={20}
        >
          <Popover.Arrow bg="bg.panel" />

          <Stack gap={3}>
            <Popover.Title fontSize="sm" fontWeight="semibold">
              {title}
            </Popover.Title>

            <HStack position="relative">
              <Box
                position="absolute"
                left={3}
                display="flex"
                alignItems="center"
                color="fg.muted"
                pointerEvents="none"
                zIndex={1}
              >
                <LuSearch />
              </Box>

              <Input
                size="sm"
                value={search}
                placeholder="Поиск..."
                ps={9}
                onChange={(event) => setSearch(event.target.value)}
              />
            </HStack>

            <HStack justify="space-between">
              <Text fontSize="xs" color="fg.muted">
                Выбрано: {selected.length}
              </Text>

              <Button
                size="xs"
                variant="ghost"
                disabled={selected.length === 0}
                onClick={() => onChange([])}
              >
                Сбросить
              </Button>
            </HStack>

            <Stack
              gap={1}
              maxHeight="320px"
              overflowY="auto"
              overscrollBehavior="contain"
              pe={1}
            >
              {filteredOptions.length === 0 ? (
                <Text py={3} fontSize="sm" color="fg.muted">
                  Ничего не найдено
                </Text>
              ) : (
                filteredOptions.map((option) => (
                  <Checkbox.Root
                    key={option.value}
                    checked={selectedSet.has(option.value)}
                    size="sm"
                    cursor="pointer"
                    px={2}
                    py={1.5}
                    borderRadius="sm"
                    _hover={{
                      bg: "bg.muted",
                    }}
                    onCheckedChange={({ checked }) =>
                      toggleValue(option.value, checked === true)
                    }
                  >
                    <Checkbox.HiddenInput />

                    <Checkbox.Control cursor="pointer">
                      <Checkbox.Indicator />
                    </Checkbox.Control>

                    <Checkbox.Label
                      cursor="pointer"
                      userSelect="none"
                      flex="1"
                      minWidth={0}
                    >
                      <Box>
                        <Text fontSize="sm" truncate>
                          {option.label}
                        </Text>

                        {option.description && (
                          <Text fontSize="xs" color="fg.muted" truncate>
                            {option.description}
                          </Text>
                        )}
                      </Box>
                    </Checkbox.Label>
                  </Checkbox.Root>
                ))
              )}
            </Stack>
          </Stack>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
};

export default MultiSelectFilter;
