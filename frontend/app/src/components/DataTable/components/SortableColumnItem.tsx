// components/SortableColumnItem.tsx
import { Box, HStack, Checkbox } from "@chakra-ui/react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

import type { Column } from "@tanstack/react-table";

interface SortableColumnItemProps<TData> {
  id: string;
  column: Column<TData, unknown>;
}

export const SortableColumnItem = <TData,>({
  id,
  column,
}: SortableColumnItemProps<TData>) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Ensure the dragging item remains on top with a solid canvas background
    zIndex: isDragging ? 100 : "auto",
    opacity: isDragging ? 0.6 : 1,
    background: isDragging ? "var(--chakra-colors-bg-muted)" : "transparent",
  };

  const label =
    typeof column.columnDef.header === "string"
      ? column.columnDef.header
      : column.id;

  return (
    <HStack
      ref={setNodeRef}
      style={style}
      p={2}
      borderRadius="sm"
      _hover={{ bg: "bg.muted/50" }}
      gap={3}
      justifyContent="space-between"
      width="full"
    >
      <HStack gap={2} flex="1">
        {/* Drag Handle Grip Icon */}
        <Box
          cursor="grab"
          _active={{ cursor: "grabbing" }}
          color="fg.muted"
          p={1}
          borderRadius="sm"
          _hover={{ bg: "bg.muted", color: "fg.default" }}
          {...attributes}
          {...listeners}
        >
          ☰
        </Box>

        {/* Native Chakra UI v3 Checkbox Layout */}
        <Checkbox.Root
          checked={column.getIsVisible()}
          onCheckedChange={(details) =>
            column.toggleVisibility(!!details.checked)
          }
          size="sm"
          cursor="pointer"
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control cursor="pointer">
            <Checkbox.Indicator />
          </Checkbox.Control>
          <Checkbox.Label cursor="pointer" userSelect="none">
            {label}
          </Checkbox.Label>
        </Checkbox.Root>
      </HStack>
    </HStack>
  );
};
