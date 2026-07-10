import type {
  ColumnType,
  UiFilterRow,
} from "../../../components/DataTable/types";
import messageFilterFields from "../table/messageFilterFields";

type GraphQLScalar = string | number | boolean | null;

export interface MessageFilterInput {
  [key: string]: GraphQLScalar | MessageFilterInput | MessageFilterInput[];
}

type FilterOperation =
  | "exact"
  | "contains"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "isnull"
  | "notnull";

const FILTER_OPERATIONS: readonly FilterOperation[] = [
  "exact",
  "contains",
  "gt",
  "gte",
  "lt",
  "lte",
  "isnull",
  "notnull",
];

const isFilterOperation = (value: string): value is FilterOperation =>
  FILTER_OPERATIONS.includes(value as FilterOperation);

// Преобразовать вложенные поля в структуру route.domainName + { contains: "test" } > { route: { domainName: { contains: "test" }}}
const buildNestedFilter = (
  path: string,
  leaf: MessageFilterInput,
): MessageFilterInput =>
  path.split(".").reduceRight<MessageFilterInput>(
    (nested, fieldName) => ({
      [fieldName]: nested,
    }),
    leaf,
  );

const resolveFilterValue = (
  row: UiFilterRow,
  fieldType: ColumnType,
): GraphQLScalar => {
  switch (fieldType) {
    case "number": {
      const numberValue = Number(row.value);

      if (!Number.isFinite(numberValue)) {
        throw new Error(
          `Invalid number filter value "${row.value}" for "${row.column}"`,
        );
      }

      return numberValue;
    }

    case "boolean": {
      if (row.value !== "true" && row.value !== "false") {
        throw new Error(
          `Invalid boolean filter value "${row.value}" for "${row.column}"`,
        );
      }

      return row.value === "true";
    }

    case "datetime": {
      const dateValue = new Date(row.value);

      if (Number.isNaN(dateValue.getTime())) {
        throw new Error(
          `Invalid datetime filter value "${row.value}" for "${row.column}"`,
        );
      }

      return dateValue.toISOString();
    }

    case "choice":
    case "string":
      return row.value;
  }
};

// Считать NULL и "" пустыми строками isNull: true
const compileNullFilter = (
  row: UiFilterRow,
  fieldType: ColumnType,
): MessageFilterInput => {
  const nullCondition = buildNestedFilter(row.column, {
    isNull: true,
  });

  if (fieldType === "string") {
    const emptyStringCondition = buildNestedFilter(row.column, {
      exact: "",
    });

    if (row.operation === "isnull") {
      return {
        OR: [nullCondition, emptyStringCondition],
      };
    }

    return {
      AND: [
        {
          NOT: [nullCondition],
        },
        {
          NOT: [emptyStringCondition],
        },
      ],
    };
  }

  return buildNestedFilter(row.column, {
    isNull: row.operation === "isnull",
  });
};

const compileFilterRow = (row: UiFilterRow): MessageFilterInput | null => {
  if (!row.column || !row.operation) return null;

  const field = messageFilterFields[row.column];

  if (!field) {
    throw new Error(`Unsupported filter field: "${row.column}"`);
  }

  if (!isFilterOperation) {
    throw new Error(`Unsupported filter operation: "${row.operation}"`);
  }

  if (row.operation === "isnull" || row.operation === "notnull") {
    return compileNullFilter(row, field.type);
  }

  if (row.value.trim() === "") {
    return null;
  }

  const value = resolveFilterValue(row, field.type);

  return buildNestedFilter(row.column, {
    [row.operation]: value,
  });
};

export const compileMessageFilters = (
  rows: UiFilterRow[],
): MessageFilterInput | null => {
  const conditions = rows
    .map(compileFilterRow)
    .filter((condition): condition is MessageFilterInput => condition !== null);

  if (conditions.length === 0) return null;

  if (conditions.length === 1) return conditions[0];

  return { AND: conditions };
};
