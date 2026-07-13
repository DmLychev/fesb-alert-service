import type { SortingState } from "@tanstack/react-table";

export type MessageSortDirection = "ASC" | "DESC";

export interface MessageOrderInput {
  [key: string]: MessageSortDirection | MessageOrderInput;
}

const MESSAGE_SORT_PATHS = {
  exchangeId: ["exchangeId"],
  requestId: ["requestId"],
  errorMessage: ["errorMessage"],
  updateStatusAttempts: ["updateStatusAttempts"],
  status: ["status"],
  startDate: ["startDate"],
  endDate: ["endDate"],
  warningLevel: ["warningLevel"],
  createdAt: ["createdAt"],
  updatedAt: ["updatedAt"],

  "route.name": ["route", "name"],
  "route.domainName": ["route", "domainName"],
} as const;

type MessageSortableColumnId = keyof typeof MESSAGE_SORT_PATHS;

const isMessageSortableColumnId = (
  columnId: string,
): columnId is MessageSortableColumnId =>
  Object.prototype.hasOwnProperty.call(MESSAGE_SORT_PATHS, columnId);

const buildNestedOrder = (
  path: readonly string[],
  direction: MessageSortDirection,
): MessageOrderInput => {
  const [fieldName, ...nestedPath] = path;

  if (!fieldName) {
    throw new Error("Message sorting path cannot be empty");
  }

  return {
    [fieldName]:
      nestedPath.length === 0
        ? direction
        : buildNestedOrder(nestedPath, direction),
  };
};

export const compileMessageSorting = (
  sorting: SortingState,
): MessageOrderInput | null => {
  const primarySorting = sorting[0];

  if (!primarySorting) return null;

  if (!isMessageSortableColumnId(primarySorting.id)) {
    throw new Error(
      `Unsupported Message sorting column: "${primarySorting.id}"`,
    );
  }

  const direction: MessageSortDirection = primarySorting.desc ? "DESC" : "ASC";

  return buildNestedOrder(MESSAGE_SORT_PATHS[primarySorting.id], direction);
};
