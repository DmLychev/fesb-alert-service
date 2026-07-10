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
import getBeginningOfCurrentDayString from "../utils/datetimeFormatter";
import { all_filter_operations, bool_values } from "../constants";
import { create_columns_collection } from "../utils/tableColumnCreator";

const FilterPanel = ({
  activeFilters,
  commitedFilters,
  fieldRegistry,
  onFiltersChange,
  onFiltersSubmit,
}: FilterPanelProps) => {
  const columnsCollection = create_columns_collection(fieldRegistry);

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
    selectedColumn: keyof typeof fieldRegistry,
  ) => {
    const columnMeta = fieldRegistry[selectedColumn];

    onFiltersChange((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        // Default operations and values based on the registry definition type
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

  // const currentDraftTree = compileGraphQLFilters(activeFilters);

  const isApplyDisabled =
    // 🚩 Rule 1: Disable if any active input field row is empty or incomplete
    activeFilters.some((row) => {
      if (!row.column) return true;
      if (row.operation === "isnull" || row.operation === "notnull")
        return false;
      return (
        row.value === undefined ||
        row.value === null ||
        String(row.value).trim() === ""
      );
    }) ||
    // 🚩 Rule 2: Disable if the compiled draft matches what was already sent to the backend API
    // JSON.stringify(currentDraftTree) === JSON.stringify(commitedFilters);
    commitedFilters === activeFilters;

  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="md"
      bg="bg.muted/20"
      width="full"
    >
      <Stack gap={3}>
        <Heading size="xs">Условия фильтрации</Heading>
        {activeFilters.length === 0 && (
          <Text fontSize="sm" color="fg.muted">
            Условия не заданы. Будут загружены все строки.
          </Text>
        )}

        {activeFilters.map((row) => {
          // Look up current column type metadata from the central registry
          const columnMeta =
            fieldRegistry[row.column as keyof typeof fieldRegistry];
          const currentColumnType = columnMeta?.type;

          return (
            <HStack
              key={`${row.id}-${row.column || "empty"}`}
              gap={3}
              width="full"
            >
              {/* 1. ВЫБОР СТОЛБЦА */}
              <Select.Root
                collection={columnsCollection} // Использует сгенерированную из реестра коллекцию
                value={row.column ? [row.column] : []}
                onValueChange={(details) => {
                  const selectedColumn = details.value[0];
                  if (selectedColumn) {
                    handleColumnChange(row.id, selectedColumn as any);
                  }
                }}
                size="sm"
                width="200px"
              >
                <Select.Trigger>
                  <Select.ValueText placeholder="Выберите поле" />
                </Select.Trigger>
                <Portal>
                  <Select.Positioner>
                    <Select.Content zIndex={15}>
                      {columnsCollection.items.map((i) => (
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
                // Если это строго перечисляемый статус — оператор не нужен (всегда "Равно")
                if (currentColumnType === "choice" && !columnMeta.nullable) {
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

                // Фильтруем операторы в зависимости от типа из реестра
                const allowedItems =
                  currentColumnType === "choice" && columnMeta.nullable
                    ? all_filter_operations.filter(
                        (op) =>
                          op.value === "exact" ||
                          op.value === "isnull" ||
                          op.value === "notnull",
                      ) // ✅ exact, null, notnull
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
                      // details.value is an array string layout (e.g. ["isnull"])
                      const nextOp = details.value[0];

                      if (nextOp) {
                        const shouldClearValue =
                          nextOp === "isnull" || nextOp === "notnull";

                        updateFilterRow(row.id, {
                          operation: nextOp, // ✅ Passes pure string primitive ("isnull")
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
                // Если выбрано NULL или NOT NULL — поле ввода значения не отображается
                if (row.operation === "isnull" || row.operation === "notnull")
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

                // А. Если поле типа выбор (Choice) — Рендерим выпадающий список вариантов из интерфейса
                if (currentColumnType === "choice" && columnMeta.choices) {
                  const choiceCollection = createListCollection({
                    items: columnMeta.choices,
                  });

                  const safeSelectValue = row.value ? [String(row.value)] : [];

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
                      width="200px"
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

                // Б. Если поле Логическое (Boolean) — Рендерим Да / Нет селектор
                if (currentColumnType === "boolean") {
                  const safeBoolValue = row.value ? [String(row.value)] : [];

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
                      width="200px"
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

                // В. Если поле Дата/Время (Datetime) — Рендерим инпут выбора календаря
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

                // Г. НАТИВНЫЙ ЧИСЛОВОЙ ИНПУТ ДЛЯ ЧИСЛОВЫХ КОЛОНОК
                if (currentColumnType === "number") {
                  return (
                    <Input
                      type="number"
                      size="sm"
                      placeholder="Введите число..."
                      // ✅ FIX: If the value is empty or missing during a transition, force "0"
                      // so the element stays strictly controlled across mounts
                      value={
                        row.value === undefined || row.value === null
                          ? ""
                          : String(row.value)
                      }
                      onChange={(e) => {
                        // Allow the user to type normally
                        const inputValue = e.target.value;

                        // ✅ Regex check: Allow only positive integers, or an empty string if clearing out
                        if (/^\d*$/.test(inputValue)) {
                          updateFilterRow(row.id, { value: inputValue });
                        }
                      }}
                      width="150px"
                      bg="bg.panel"
                    />
                  );
                }

                // Г. По умолчанию — Обычный текстовый/числовой инпут для строк и чисел
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
                🗑️
              </IconButton>
            </HStack>
          );
        })}
        {/* Action Control Panel Footer */}
        <Flex justifyContent="space-between" mt={2}>
          <HStack gap={2}>
            <Button size="sm" variant="outline" onClick={addFilterRow}>
              + Добавить условие
            </Button>

            {activeFilters.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                colorPalette="red"
                onClick={() => onFiltersSubmit([])}
              >
                Сбросить всё
              </Button>
            )}
          </HStack>

          <Button
            size="sm"
            colorPalette="blue"
            disabled={isApplyDisabled}
            // onClick={() => {
            //   const compiledTree = compileGraphQLFilters(activeFilters);
            //   onFiltersSubmit(compiledTree);
            // }}
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
