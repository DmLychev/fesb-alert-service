import {
  Box,
  Button,
  createListCollection,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Portal,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { FilterPanelProps, UiFilterRow } from "../types";
import { getBeginningOfCurrentDayString } from "../utils/date";
import { all_filter_operations, bool_values } from "../constants";
import { LuTrash2 } from "react-icons/lu";

const FilterPanel = ({
  activeFilters,
  committedFilters,
  filterFields,
  onFiltersChange,
  onFiltersSubmit,
}: FilterPanelProps) => {
  const filterFieldsCollection = createListCollection({
    items: Object.entries(filterFields).map(([value, field]) => ({
      value,
      label: field.label,
    })),
  });

  const addFilterRow = () => {
    onFiltersChange((prev) => [
      ...prev,
      { id: crypto.randomUUID(), column: "", operation: "exact", value: "" },
    ]);
  };

  const updateFilterRow = (id: string, updatedFields: Partial<UiFilterRow>) => {
    onFiltersChange((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...updatedFields } : row)),
    );
  };

  const removeFilterRow = (id: string) => {
    onFiltersChange((prev) => prev.filter((row) => row.id !== id));
  };

  const handleColumnChange = (
    rowId: string,
    selectedColumn: keyof typeof filterFields,
  ) => {
    const columnMeta = filterFields[selectedColumn];

    onFiltersChange((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        let defaultOp = "exact";
        let defaultValue = columnMeta.type === "number" ? "0" : "";

        if (columnMeta.type === "choice") {
          defaultOp = "exact";
        } else if (columnMeta.type === "datetime") {
          defaultValue = getBeginningOfCurrentDayString();
        }

        return {
          ...row,
          column: selectedColumn,
          operation: defaultOp,
          value: defaultValue,
        };
      }),
    );
  };

  const filtersAreUnchanged =
    JSON.stringify(committedFilters) === JSON.stringify(activeFilters);

  const isApplyDisabled =
    activeFilters.some((row) => {
      if (!row.column) return true;
      if (row.operation === "isnull" || row.operation === "notnull")
        return false;
      return (
        row.value === undefined ||
        row.value === null ||
        String(row.value).trim() === ""
      );
    }) || filtersAreUnchanged;

  return (
    <Box
      width="full"
      maxHeight="min(480px, 55dvh)"
      minHeight={0}
      display="flex"
      flexDirection="column"
      padding={4}
      borderWidth="1px"
      borderRadius="md"
      bg="bg.muted/20"
    >
      <Stack gap={3}>
        <Heading size="xs" flexShrink={0} marginBottom={3}>
          Условия фильтрации
        </Heading>

        <Box
          flex="1"
          minHeight={0}
          overflow="auto"
          overscrollBehavior="contain"
          paddingRight={2}
        >
          <Stack gap={3}>
            {" "}
            {activeFilters.length === 0 && (
              <Text fontSize="sm" color="fg.muted">
                Условия не заданы. Будут загружены все строки.
              </Text>
            )}
            {activeFilters.map((row) => {
              const columnMeta =
                filterFields[row.column as keyof typeof filterFields];
              const currentColumnType = columnMeta?.type;

              return (
                <HStack
                  key={row.id}
                  direction={{ base: "column", lg: "row" }}
                  alignItems={{ base: "stretch", lg: "center" }}
                  gap={3}
                  width="full"
                >
                  {/* 1. ВЫБОР СТОЛБЦА */}
                  <Select.Root
                    collection={filterFieldsCollection}
                    value={row.column ? [row.column] : []}
                    onValueChange={(details) => {
                      const selectedColumn = details.value[0];
                      if (selectedColumn) {
                        handleColumnChange(row.id, selectedColumn as any);
                      }
                    }}
                    size="sm"
                    width={{ base: "full", lg: "200px" }}
                  >
                    <Select.Trigger>
                      <Select.ValueText placeholder="Выберите поле" />
                    </Select.Trigger>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content zIndex={15}>
                          {filterFieldsCollection.items.map((i) => (
                            <Select.Item item={i} key={i.value}>
                              {i.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>

                  {/* 2. ВЫБОР ОПЕРАТОРА СРАВНЕНИЯ */}
                  {(() => {
                    if (
                      currentColumnType === "choice" &&
                      !columnMeta.nullable
                    ) {
                      return (
                        <Text
                          fontSize="sm"
                          color="fg.muted"
                          width="180px"
                          textAlign="center"
                          alignSelf="center"
                        >
                          Равно (=)
                        </Text>
                      );
                    }

                    const allowedItems =
                      currentColumnType === "choice" && columnMeta.nullable
                        ? all_filter_operations.filter(
                            (op) =>
                              op.value === "exact" ||
                              op.value === "isnull" ||
                              op.value === "notnull",
                          )
                        : currentColumnType === "boolean"
                          ? all_filter_operations.filter(
                              (op) =>
                                op.value === "exact" ||
                                op.value === "isnull" ||
                                op.value === "notnull",
                            )
                          : currentColumnType === "datetime"
                            ? all_filter_operations.filter(
                                (op) => op.value !== "contains",
                              )
                            : all_filter_operations;

                    const dynamicOperationsCollection = createListCollection({
                      items: allowedItems,
                    });

                    return (
                      <Select.Root
                        key={`${row.id}-${currentColumnType || "empty"}-operator`}
                        collection={dynamicOperationsCollection}
                        value={[row.operation]}
                        onValueChange={(details) => {
                          const nextOp = details.value[0];

                          if (nextOp) {
                            const shouldClearValue =
                              nextOp === "isnull" || nextOp === "notnull";

                            updateFilterRow(row.id, {
                              operation: nextOp,
                              value: shouldClearValue ? "" : row.value,
                            });
                          }
                        }}
                        size="sm"
                        width="180px"
                        disabled={!row.column}
                      >
                        <Select.Trigger>
                          <Select.ValueText placeholder="Условие" />
                        </Select.Trigger>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content zIndex={15}>
                              {allowedItems.map((item) => (
                                <Select.Item item={item} key={item.value}>
                                  {item.label}
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    );
                  })()}

                  {/* 3. ПОЛЯ ДЛЯ ВВОДА ЗНАЧЕНИЯ (Контекстные) */}
                  {(() => {
                    if (
                      row.operation === "isnull" ||
                      row.operation === "notnull"
                    )
                      return null;
                    if (!columnMeta)
                      return (
                        <Input
                          size="sm"
                          disabled
                          placeholder="Значение..."
                          flex="1"
                          bg="bg.panel"
                        />
                      );

                    if (currentColumnType === "choice" && columnMeta.choices) {
                      const choiceCollection = createListCollection({
                        items: columnMeta.choices,
                      });

                      const safeSelectValue = row.value
                        ? [String(row.value)]
                        : [];

                      return (
                        <Select.Root
                          collection={choiceCollection}
                          value={safeSelectValue}
                          onValueChange={(details) => {
                            const nextVal = details.value[0];
                            if (nextVal)
                              updateFilterRow(row.id, { value: nextVal });
                          }}
                          size="sm"
                          width={{ base: "full", lg: "200px" }}
                        >
                          <Select.Trigger>
                            <Select.ValueText placeholder="Выберите..." />
                          </Select.Trigger>
                          <Portal>
                            <Select.Positioner>
                              <Select.Content zIndex={20}>
                                {columnMeta.choices.map((i) => (
                                  <Select.Item item={i} key={i.value}>
                                    {i.label}
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select.Positioner>
                          </Portal>
                        </Select.Root>
                      );
                    }

                    if (currentColumnType === "boolean") {
                      const safeBoolValue = row.value
                        ? [String(row.value)]
                        : [];

                      return (
                        <Select.Root
                          collection={bool_values}
                          value={safeBoolValue}
                          onValueChange={(details) => {
                            const nextVal = details.value[0];
                            if (nextVal)
                              updateFilterRow(row.id, { value: nextVal });
                          }}
                          size="sm"
                          width={{ base: "full", lg: "200px" }}
                        >
                          <Select.Trigger>
                            <Select.ValueText placeholder="Выберите значение" />
                          </Select.Trigger>
                          <Portal>
                            <Select.Positioner>
                              <Select.Content zIndex={20}>
                                {bool_values.items.map((i) => (
                                  <Select.Item item={i} key={i.value}>
                                    {i.label}
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select.Positioner>
                          </Portal>
                        </Select.Root>
                      );
                    }

                    if (currentColumnType === "datetime") {
                      return (
                        <Input
                          type="datetime-local"
                          step="0.001"
                          size="sm"
                          value={row.value ?? ""}
                          onChange={(e) =>
                            updateFilterRow(row.id, { value: e.target.value })
                          }
                          width="240px"
                          bg="bg.panel"
                        />
                      );
                    }

                    if (currentColumnType === "number") {
                      return (
                        <Input
                          type="number"
                          size="sm"
                          placeholder="Введите число..."
                          value={
                            row.value === undefined || row.value === null
                              ? ""
                              : String(row.value)
                          }
                          onChange={(e) => {
                            const inputValue = e.target.value;

                            if (/^\d*$/.test(inputValue)) {
                              updateFilterRow(row.id, { value: inputValue });
                            }
                          }}
                          width="150px"
                          bg="bg.panel"
                        />
                      );
                    }

                    return (
                      <Input
                        size="sm"
                        placeholder="Значение..."
                        value={
                          row.value === undefined || row.value === null
                            ? ""
                            : String(row.value)
                        }
                        onChange={(e) => {
                          updateFilterRow(row.id, { value: e.target.value });
                        }}
                        flex="1"
                        bg="bg.panel"
                      />
                    );
                  })()}

                  {/* КНОПКА УДАЛЕНИЯ СТРОКИ */}
                  <IconButton
                    aria-label="Delete filter"
                    variant="ghost"
                    colorPalette="red"
                    size="sm"
                    onClick={() => removeFilterRow(row.id)}
                  >
                    <LuTrash2 />
                  </IconButton>
                </HStack>
              );
            })}
          </Stack>
        </Box>

        {/* Action Control Panel Footer */}
        <Flex
          flexShrink={0}
          direction={{ base: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ base: "stretch", sm: "center" }}
          gap={2}
          paddingTop={3}
          marginTop={3}
          borderTopWidth="1px"
          borderTopColor="border.muted"
        >
          <HStack gap={2}>
            <Button size="sm" variant="outline" onClick={addFilterRow}>
              + Добавить условие
            </Button>

            {activeFilters.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                colorPalette="red"
                onClick={() => {
                  onFiltersChange([]);
                  onFiltersSubmit([]);
                }}
              >
                Сбросить всё
              </Button>
            )}
          </HStack>

          <Button
            size="sm"
            colorPalette="blue"
            disabled={isApplyDisabled}
            onClick={() => onFiltersSubmit(activeFilters)}
          >
            Применить фильтры
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
};

export default FilterPanel;
