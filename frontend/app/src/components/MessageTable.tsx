import React, { useCallback, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { GenericDataTable, type DynamicFilterConfig } from "./GenericDataTable";
import api from "../api";

interface Message {
  id: number;
  exchange_id: string;
  status: string;
  warning_level: number;
}

export const MessagePage: React.FC = () => {
  const columns = useMemo<ColumnDef<Message>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "exchange_id", header: "Exchange ID" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "warning_level", header: "Warning Level" },
    ],
    [],
  );

  // 1. Declare your predefined static dropdown options arrays cleanly
  const predefinedDropdowns: DynamicFilterConfig[] = [
    {
      key: "status",
      label: "Status",
      options: [
        { label: "Success", value: "SUCCESS" },
        { label: "Pending", value: "PENDING" },
        { label: "Failed", value: "FAILED" },
      ],
    },
    {
      key: "warning_level",
      label: "Warning Level",
      options: [
        { label: "Information Log", value: "1" },
        { label: "Warning Alert", value: "2" },
        { label: "Critical Exception", value: "3" },
      ],
    },
  ];

  // 2. Wrap network events inside useCallback to protect against unnecessary rerenders
  const fetchMessagesFromDjango = useCallback(
    async (params: {
      page: number;
      size: number;
      ordering: string;
      filters: Record<string, string>;
    }) => {
      const response = await api.get("/api/messages/", {
        params: {
          page: params.page,
          size: params.size,
          ordering: params.ordering || undefined,
          ...params.filters, // Automatically flattens exact filters like '?status=FAILED' into query strings
        },
      });

      return {
        results: response.data.results,
        count: response.data.count,
      };
    },
    [],
  );

  return (
    <GenericDataTable
      title="System Messages Logging Panel"
      columns={columns}
      predefinedFilters={predefinedDropdowns}
      onFetchData={fetchMessagesFromDjango}
    />
  );
};
