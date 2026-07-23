import {
  Box,
  HStack,
  IconButton,
  Popover,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  restrictToFirstScrollableAncestor,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { SortableColumnItem } from "./SortableColumnItem";
import type { Table } from "@tanstack/react-table";
import { LuSettings2 } from "react-icons/lu";
import LiveUpdateToggle from "./LiveUpdateToggle";

interface TableSettingsProps<TData> {
  table: Table<TData>;
  columns: string[];

  isLiveUpdatesEnabled: boolean;

  onColumnOrderChange: (newOrder: string[]) => void;
  onLiveUpdatesEnabledChange: (enabled: boolean) => void;
}

const TableSettings = <TData,>({
  table,
  columns,
  isLiveUpdatesEnabled,
  onColumnOrderChange,
  onLiveUpdatesEnabledChange,
}: TableSettingsProps<TData>) => {
  return (
    <Popover.Root portalled lazyMount closeOnInteractOutside={true}>
      <Popover.Trigger asChild>
        <IconButton
          aria-label="Настройки таблицы"
          title="Настройки таблицы"
          size="sm"
          variant="outline"
        >
          <LuSettings2 />
        </IconButton>
      </Popover.Trigger>

      <Popover.Positioner>
        <Popover.Content
          width="240px"
          p={3}
          boxShadow="md"
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.muted"
          zIndex={20}
          overflowX="hidden"
        >
          <Popover.Arrow bg="bg.panel" />
          <Stack gap={2}>
            <Popover.Title
              fontSize="xs"
              fontWeight="bold"
              color="fg.muted"
              mb={1}
            >
              Настройки таблицы
            </Popover.Title>

            <Stack gap={2}>
              <Text fontSize="sm" fontWeight="medium">
                Столбцы
              </Text>

              <DndContext
                collisionDetection={closestCenter}
                modifiers={[
                  restrictToVerticalAxis,
                  restrictToFirstScrollableAncestor,
                ]}
                onDragEnd={(event: DragEndEvent) => {
                  const { active, over } = event;
                  if (over && active.id !== over.id) {
                    const oldIndex = columns.indexOf(active.id as string);
                    const newIndex = columns.indexOf(over.id as string);
                    const newOrder = arrayMove(columns, oldIndex, newIndex);
                    onColumnOrderChange(newOrder);
                  }
                }}
              >
                <SortableContext
                  items={columns}
                  strategy={verticalListSortingStrategy}
                >
                  <Stack gap={1} maxH="300px" overflowY="auto" pr={1}>
                    {columns.map((columnId) => {
                      const col = table.getColumn(columnId);

                      if (!col || !col.getCanHide()) return null;

                      return (
                        <SortableColumnItem
                          key={col.id}
                          id={col.id}
                          column={col}
                        />
                      );
                    })}
                  </Stack>
                </SortableContext>
              </DndContext>
            </Stack>

            <Separator />

            <HStack justifyContent="space-between" alignItems="center" gap={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium">
                  Автообновление
                </Text>

                <Text fontSize="xs" color="fg.muted">
                  Получать новые записи автоматически
                </Text>
              </Box>

              <LiveUpdateToggle
                isChecked={isLiveUpdatesEnabled}
                onCheckedChange={onLiveUpdatesEnabledChange}
              />
            </HStack>
          </Stack>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
};

export default TableSettings;
