import type { SortingState } from "@tanstack/react-table";

export type GraphQLSortDirection = "ASC" | "DESC";

export interface GraphQLOrderInput {
  [key: string]: GraphQLSortDirection | GraphQLOrderInput;
}

export type SortPathOverrides = Readonly<Record<string, readonly string[]>>;

const buildNestedOrder = (
  path: readonly string[],
  direction: GraphQLSortDirection,
): GraphQLOrderInput => {
  const [field, ...rest] = path;

  if (!field) throw new Error("Sorting path cannot be empty");

  return {
    [field]: rest.length === 0 ? direction : buildNestedOrder(rest, direction),
  };
};

export const compileGraphQLSorting = (
  sorting: SortingState,
  overrrides: SortPathOverrides = {},
): GraphQLOrderInput | null => {
  const primary = sorting[0];

  if (!primary) return null;

  const path = overrrides[primary.id] ?? primary.id.split(".");

  return buildNestedOrder(path, primary.desc ? "DESC" : "ASC");
};
