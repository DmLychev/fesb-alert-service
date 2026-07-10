import { createListCollection } from "@chakra-ui/react";
import type { ColumnMetadata } from "../types";
import { createColumnHelper } from "@tanstack/react-table";

export const create_columns_collection = (
  fieldRegistry: Record<string, ColumnMetadata>,
) =>
  createListCollection({
    items: Object.entries(fieldRegistry).map(([key, meta]) => ({
      value: key,
      label: meta.label,
    })),
  });

export const create_tanstack_columns = (
  fieldRegistry: Record<string, ColumnMetadata>,
) => {
  const columnHelper = createColumnHelper();

  const columns = Object.entries(fieldRegistry).map(([columnKey, meta]) => {
    const safeId = columnKey.replace(/\./g, "_");

    return columnHelper.accessor(columnKey as any, {
      id: safeId,
      header: meta.label,
      cell: (info) => {
        const rawValue = info.getValue();
        return meta.renderCell ? meta.renderCell(rawValue) : rawValue;
      },
    });
  });

  return columns;
};
