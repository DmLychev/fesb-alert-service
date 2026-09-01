import type {
  FilterFieldRegistry,
  UiFilterRow,
} from "../../components/DataTable";

type GraphQLInput = Record<string, unknown>;

const isObject = (value: unknown): value is GraphQLInput =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const buildNestedObject = (path: string, leafValue: unknown) => {
  const parts = path.split(".");

  const build = (index: number): GraphQLInput => {
    const part = parts[index];

    if (!part) return {};

    return {
      [part]: index === parts.length - 1 ? leafValue : build(index + 1),
    };
  };

  return build(0);
};

const setNestedOperation = (
  target: GraphQLInput,
  path: string,
  operation: string,
  value: unknown,
) => {
  const parts = path.split(".");
  const fieldName = parts.pop();

  if (!fieldName) return;

  let current = target;

  for (const part of parts) {
    if (!isObject(current[part])) current[part] = {};

    current = current[part] as GraphQLInput;
  }

  const existing = current[fieldName];
  const operations = isObject(existing) ? existing : {};
  operations[operation] = value;
  current[fieldName] = operations;
};

export const compileGraphQLFilters = (
  filters: UiFilterRow[],
  fieldRegistry: FilterFieldRegistry,
) => {
  if (filters.length === 0) return null;

  const conditions: GraphQLInput[] = [];
  const baseFilter: GraphQLInput = {};

  filters.forEach((row) => {
    if (!row.column || !row.operation) return;

    const column = fieldRegistry[row.column];

    if (!column) return;

    const isString = column.type === "string";

    if (
      isString &&
      (row.operation === "isnull" || row.operation === "notnull")
    ) {
      const nullCondition = buildNestedObject(row.column, { isNull: true });
      const emptyCondition = buildNestedObject(row.column, { exact: "" });

      if (row.operation === "isnull") {
        conditions.push({ OR: [nullCondition, emptyCondition] });
      } else {
        conditions.push({ NOT: [nullCondition, emptyCondition] });
      }

      return;
    }

    let operation = row.operation;
    let value: unknown = row.value;

    if (row.operation === "isnull") {
      operation = "isNull";
      value = true;
    } else if (row.operation === "notnull") {
      operation = "isNull";
      value = false;
    } else if (column.type === "number" && row.value !== "") {
      value = Number(row.value);
    } else if (column.type === "datetime" && row.value) {
      value = new Date(row.value).toISOString();
    } else if (column.type === "boolean" && row.value) {
      value = row.value === "true";
    }

    setNestedOperation(baseFilter, row.column, operation, value);
  });

  if (conditions.length === 0)
    return Object.keys(baseFilter).length ? baseFilter : null;

  if (Object.keys(baseFilter).length) conditions.unshift(baseFilter);

  return { AND: conditions };
};
