import type { Table } from "@tanstack/react-table";
import EditingModeButton from "./EditingModeButton";
import { HStack } from "@chakra-ui/react";
import FilterButton from "./FilterButton";
import TableSettings from "./TableSettings";
import RefreshButton from "../../RefreshButton";

interface DefaultToolbarActionsProps<TData> {
  table: Table<TData>;
  showEditButton: boolean;
  isRefreshing: boolean;
  hasFilterFields: boolean;
  isFilterPanelOpen: boolean;
  activeFiltersCount: number;
  columns: string[];
  isLiveUpdatesEnabled: boolean;
  onStartEditing: () => void;
  onRefresh: () => void;
  onToggleFilters: () => void;
  onColumnOrderChange: (newOrder: string[]) => void;
  onLiveUpdatesEnabledChange: (enabled: boolean) => void;
}

const DefaultToolbarActions = <TData,>({
  table,
  showEditButton,
  isRefreshing,
  hasFilterFields,
  isFilterPanelOpen,
  activeFiltersCount,
  columns,
  isLiveUpdatesEnabled,
  onStartEditing,
  onRefresh,
  onToggleFilters,
  onColumnOrderChange,
  onLiveUpdatesEnabledChange,
}: DefaultToolbarActionsProps<TData>) => {
  return (
    <HStack gap={2} flexWrap="wrap" justifyContent="flex-end">
      {showEditButton && <EditingModeButton onClick={onStartEditing} />}

      <RefreshButton
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        ariaLabel="Обновить таблицу"
      />

      {hasFilterFields && (
        <FilterButton
          isOpen={isFilterPanelOpen}
          activeFiltersCount={activeFiltersCount}
          onToggle={onToggleFilters}
        />
      )}

      <TableSettings
        table={table}
        columns={columns}
        isLiveUpdatesEnabled={isLiveUpdatesEnabled}
        onColumnOrderChange={onColumnOrderChange}
        onLiveUpdatesEnabledChange={onLiveUpdatesEnabledChange}
      />
    </HStack>
  );
};

export default DefaultToolbarActions;
