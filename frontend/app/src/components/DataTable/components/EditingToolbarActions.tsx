import { Button, HStack, Text } from "@chakra-ui/react";
import DeleteSelectedRowsButton from "./DeleteSelectedRowsButton";
import ResetAllChangesButton from "./ResetAllChangesButton";
import ApplyAllChangesButton from "./ApplyAllChangesButton";
import { LuLogOut } from "react-icons/lu";

interface EditingToolbarActionsProps {
  showDeleteButton: boolean;
  isDeleting: boolean;
  isApplyingChanges: boolean;
  hasPendingChanges: boolean;
  changedCellsCount: number;
  onDeleteSelectedRows: () => void;
  onResetChanges: () => void;
  onApplyChanges: () => void | Promise<void>;
  onExitEditing: () => void;
}

const EditingToolbarActions = ({
  showDeleteButton,
  isDeleting,
  isApplyingChanges,
  hasPendingChanges,
  changedCellsCount,
  onDeleteSelectedRows,
  onResetChanges,
  onApplyChanges,
  onExitEditing,
}: EditingToolbarActionsProps) => {
  return (
    <HStack gap={2} flexWrap="wrap" justifyContent="flex-end">
      {showDeleteButton && (
        <DeleteSelectedRowsButton
          disabled={isDeleting || isApplyingChanges}
          onClick={onDeleteSelectedRows}
        />
      )}

      <ResetAllChangesButton
        isApplying={isApplyingChanges}
        disabled={!hasPendingChanges}
        onClick={onResetChanges}
      />

      <ApplyAllChangesButton
        isApplying={isApplyingChanges}
        changesCount={changedCellsCount}
        disabled={!hasPendingChanges}
        onClick={() => {
          void onApplyChanges();
        }}
      />

      <Button
        aria-label="Завершить"
        size="sm"
        variant="outline"
        width={{ base: "36px", md: "132px" }}
        minWidth={{ base: "36px", md: "132px" }}
        paddingInline={{ base: 0, md: 3 }}
        disabled={isDeleting || isApplyingChanges}
        onClick={onExitEditing}
      >
        <LuLogOut />

        <Text hideBelow="md">Завершить</Text>
      </Button>
    </HStack>
  );
};

export default EditingToolbarActions;
