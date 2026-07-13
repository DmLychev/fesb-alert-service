import { type FilterVisibilityAndOrderProps } from "../types";

import { Button, Popover, Stack } from "@chakra-ui/react";
import { CiViewColumn } from "react-icons/ci";
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

const FilterVisibilityAndOrder = <TData,>({
  table,
  columns,
  onColumnOrderChange,
}: FilterVisibilityAndOrderProps<TData>) => {
  return (
    <Popover.Root portalled lazyMount closeOnInteractOutside={true}>
      <Popover.Trigger asChild>
        <Button variant="outline" size="sm">
          <CiViewColumn /> Столбцы
        </Button>
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
              Видимость и порядок
            </Popover.Title>

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
              {/* 1. SortableContext monitors the plain column ID string array state */}
              <SortableContext
                items={columns}
                strategy={verticalListSortingStrategy}
              >
                <Stack gap={1} maxH="300px" overflowY="auto" pr={1}>
                  {/* 2. ✅ FIX: Loop directly over your active 'columnOrder' state array */}
                  {columns.map((columnId) => {
                    // Fetch the corresponding TanStack column instance by its matching string ID
                    const col = table.getColumn(columnId);

                    // Safety check: if a column isn't hideable/sortable, skip it
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
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
};

export default FilterVisibilityAndOrder;
