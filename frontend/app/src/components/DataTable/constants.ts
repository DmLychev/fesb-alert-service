import { createListCollection } from "@chakra-ui/react";
import type { TablePreferences } from "./types";

export const default_table_preferences: TablePreferences = {
  version: 1,
  filters: [],
  sorting: [],
  columnVisibility: {},
  columnOrder: [],
  columnSizing: {},
  pageSize: 10,
};

export const page_size_options = createListCollection({
  items: [
    { value: "10", label: "10 строк" },
    { value: "25", label: "25 строк" },
    { value: "50", label: "50 строк" },
    { value: "100", label: "100 строк" },
  ],
});

export const all_filter_operations = [
  { value: "exact", label: "Равно (=)" },
  { value: "contains", label: "Содержит" },
  { value: "gt", label: "Больше (>)" },
  { value: "gte", label: "Больше или равно (>=)" },
  { value: "lt", label: "Меньше (<)" },
  { value: "lte", label: "Меньше или равно (<=)" },
  { value: "isnull", label: "Пусто" },
  { value: "notnull", label: "Не пусто" },
];

export const bool_values = createListCollection({
  items: [
    { value: "true", label: "ИСТИНА" },
    { value: "false", label: "ЛОЖЬ" },
  ],
});
