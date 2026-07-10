import type { ColumnMetadata, UiFilterRow } from "../types";

const compileGraphQLFilters = (
  filtersList: UiFilterRow[],
  fieldRegistry: Record<string, ColumnMetadata>,
) => {
  if (!filtersList || filtersList.length === 0) return null;

  // We will collect root-level conditions here (handles implicit AND)
  const conditions: any[] = [];
  // Standard fields can still be grouped into a single base object
  const baseFilterObject: Record<string, any> = {};

  filtersList.forEach((row) => {
    if (!row.column || !row.operation) return;

    const columnMeta = fieldRegistry[row.column as keyof typeof fieldRegistry];
    const isStringColumn = !columnMeta || columnMeta.type === "string";

    // --- 1. Handle the new 'isnull' and 'notnull' logic for STRINGS ---
    if (
      isStringColumn &&
      (row.operation === "isnull" || row.operation === "notnull")
    ) {
      // Helper to build the nested object path (e.g., "parent.child" -> { parent: { child: ... } })
      const buildNestedObject = (path: string, leafValue: any) => {
        const parts = path.split(".");
        const result: Record<string, any> = {};
        let current = result;

        parts.forEach((part, index) => {
          if (index === parts.length - 1) {
            current[part] = leafValue;
          } else {
            current[part] = {};
            current = current[part];
          }
        });
        return result;
      };

      const nullCondition = buildNestedObject(row.column, { isNull: true });
      const emptyCondition = buildNestedObject(row.column, { exact: "" });

      if (row.operation === "isnull") {
        conditions.push({ OR: [nullCondition, emptyCondition] });
      } else {
        conditions.push({ NOT: [nullCondition, emptyCondition] });
      }
      return; // Skip the rest of the loop for this row
    }

    // --- 2. Fallback to your original type transformations ---
    let resolvedOperation = row.operation;
    let resolvedValue: any = row.value;

    if (row.operation === "isnull") {
      resolvedOperation = "isNull";
      resolvedValue = true;
    } else if (row.operation === "notnull") {
      resolvedOperation = "isNull";
      resolvedValue = false;
    } else if (columnMeta?.type === "number" && row.value !== "") {
      resolvedValue = parseInt(row.value, 10);
    } else if (columnMeta?.type === "datetime" && row.value) {
      resolvedValue = new Date(row.value).toISOString();
    } else if (columnMeta?.type === "boolean" && row.value) {
      resolvedValue = row.value === "true";
    }

    // --- 3. Process dot-notation nested parameters for standard fields ---
    if (row.column.includes(".")) {
      const [parent, child] = row.column.split(".");
      baseFilterObject[parent] = baseFilterObject[parent] || {};
      baseFilterObject[parent][child] = baseFilterObject[parent][child] || {};
      baseFilterObject[parent][child][resolvedOperation] = resolvedValue;
    } else {
      baseFilterObject[row.column] = baseFilterObject[row.column] || {};
      baseFilterObject[row.column][resolvedOperation] = resolvedValue;
    }
  });

  // --- 4. Combine everything into a single query object ---
  // If we only have standard fields, return the flat object to keep queries clean
  if (conditions.length === 0) {
    return Object.keys(baseFilterObject).length > 0 ? baseFilterObject : null;
  }

  // If we have OR/NOT blocks, merge them alongside standard fields using "AND"
  if (Object.keys(baseFilterObject).length > 0) {
    conditions.unshift(baseFilterObject);
  }

  return { AND: conditions };
};

export default compileGraphQLFilters;
