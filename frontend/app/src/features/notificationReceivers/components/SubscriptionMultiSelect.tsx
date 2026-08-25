import { useMemo, useState } from "react";

import {
  Box,
  Button,
  Checkbox,
  HStack,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";

import { LuSearch } from "react-icons/lu";

export interface SubscriptionMultiSelectOption<
  TValue extends string | number,
> {
  value: TValue;
  label: string;
  description?: string;
  searchText?: string;
}

interface SubscriptionMultiSelectProps<
  TValue extends string | number,
> {
  options: SubscriptionMultiSelectOption<TValue>[];
  selected: TValue[];
  onChange: (selected: TValue[]) => void;

  disabled?: boolean;
  emptyText?: string;
  maxHeight?: string;
}

const SubscriptionMultiSelect = <
  TValue extends string | number,
>({
  options,
  selected,
  onChange,
  disabled = false,
  emptyText = "Ничего не найдено",
  maxHeight = "220px",
}: SubscriptionMultiSelectProps<TValue>) => {
  const [search, setSearch] = useState("");

  const selectedSet = useMemo(
    () => new Set(selected),
    [selected],
  );

  const filteredOptions = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase();

    if (!normalizedSearch) return options;

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

  const toggleValue = (
    value: TValue,
    checked: boolean,
  ) => {
    if (checked) {
      if (!selectedSet.has(value)) {
        onChange([...selected, value]);
      }

      return;
    }

    onChange(
      selected.filter(
        (selectedValue) => selectedValue !== value,
      ),
    );
  };

  return (
    <Stack gap={2}>
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
          disabled={disabled}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />
      </HStack>

      <HStack justify="space-between">
        <Text
          fontSize="xs"
          color="fg.muted"
        >
          Выбрано: {selected.length}
        </Text>

        <Button
          size="xs"
          variant="ghost"
          disabled={
            disabled || selected.length === 0
          }
          onClick={() => onChange([])}
        >
          Сбросить
        </Button>
      </HStack>

      <Stack
        gap={1}
        maxHeight={maxHeight}
        overflowY="auto"
        overscrollBehavior="contain"
        borderWidth="1px"
        borderColor="border.muted"
        borderRadius="md"
        p={2}
        opacity={disabled ? 0.6 : 1}
      >
        {filteredOptions.length === 0 ? (
          <Text
            py={3}
            px={2}
            fontSize="sm"
            color="fg.muted"
          >
            {emptyText}
          </Text>
        ) : (
          filteredOptions.map((option) => (
            <Checkbox.Root
              key={String(option.value)}
              checked={selectedSet.has(option.value)}
              disabled={disabled}
              size="sm"
              cursor={
                disabled ? "default" : "pointer"
              }
              px={2}
              py={1.5}
              borderRadius="sm"
              _hover={
                disabled
                  ? undefined
                  : {
                      bg: "bg.muted",
                    }
              }
              onCheckedChange={({ checked }) =>
                toggleValue(
                  option.value,
                  checked === true,
                )
              }
            >
              <Checkbox.HiddenInput />

              <Checkbox.Control
                cursor={
                  disabled
                    ? "default"
                    : "pointer"
                }
              >
                <Checkbox.Indicator />
              </Checkbox.Control>

              <Checkbox.Label
                cursor={
                  disabled
                    ? "default"
                    : "pointer"
                }
                userSelect="none"
                flex="1"
                minWidth={0}
              >
                <Box>
                  <Text fontSize="sm">
                    {option.label}
                  </Text>

                  {option.description && (
                    <Text
                      fontSize="xs"
                      color="fg.muted"
                    >
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
  );
};

export default SubscriptionMultiSelect;
