import type { CSSProperties } from "react";
import type { Column } from "@tanstack/react-table";

export const getPinnedColumnStyles = <TData>(
  column: Column<TData>,
): CSSProperties => {
  const pinned = column.getIsPinned();

  const isLastLeftColumn = pinned === "left" && column.getIsLastColumn("left");
  const isFirstRightColumn =
    pinned === "right" && column.getIsFirstColumn("right");

  return {
    position: pinned ? "sticky" : "relative",
    left: pinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: pinned === "right" ? `${column.getAfter("right")}px` : undefined,
    zIndex: pinned ? 2 : 0,
    boxShadow: isLastLeftColumn
      ? "-4px 0 4px -4px var(--chakra-colors-border-emphasized) inset"
      : isFirstRightColumn
        ? "4px 0 4px -4px var(--chakra-colors-border-emphasized) inset"
        : undefined,
  };
};
