import type { SortingState } from "@tanstack/react-table";

export type IssueSortDirection = "ASC" | "DESC";

export interface IssueOrderInput {
  [key: string]: IssueSortDirection | IssueOrderInput;
}

const ISSUE_SORT_PATHS = {
  "type.code": ["type", "code"],
  "type.description": ["type", "description"],
  text: ["text"],
  routeId: ["routeId"],
  domainName: ["domainName"],
  isNotified: ["isNotified"],
  isSolved: ["isSolved"],
  createdAt: ["createdAt"],
  updatedAt: ["updatedAt"],
} as const;

type IssueSortableColumnId = keyof typeof ISSUE_SORT_PATHS;

const isIssueSortableColumnId = (
  columnId: string,
): columnId is IssueSortableColumnId =>
  Object.prototype.hasOwnProperty.call(ISSUE_SORT_PATHS, columnId);

const buildNestedOrder = (
  path: readonly string[],
  direction: IssueSortDirection,
): IssueOrderInput => {
  const [fieldName, ...nestedPath] = path;

  if (!fieldName) {
    throw new Error("Issue sorting path cannot be empty");
  }

  return {
    [fieldName]:
      nestedPath.length === 0
        ? direction
        : buildNestedOrder(nestedPath, direction),
  };
};

export const compileIssueSorting = (
  sorting: SortingState,
): IssueOrderInput | null => {
  const primarySorting = sorting[0];

  if (!primarySorting) return null;

  if (!isIssueSortableColumnId(primarySorting.id)) {
    throw new Error(`Unsupported Issue sorting column: "${primarySorting.id}"`);
  }

  const direction: IssueSortDirection = primarySorting.desc ? "DESC" : "ASC";

  return buildNestedOrder(ISSUE_SORT_PATHS[primarySorting.id], direction);
};
