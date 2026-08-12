import { Button, Dialog, HStack, Portal, Text } from "@chakra-ui/react";

interface DeleteRowsDialogProps {
  open: boolean;
  rowsCount: number;
  isDeleting: boolean;

  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

const DeleteRowsDialog = ({
  open,
  rowsCount,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeleteRowsDialogProps) => {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={({ open }) => onOpenChange(open)}
      size="sm"
      placement="center"
      role="alertdialog"
      closeOnEscape={!isDeleting}
      closeOnInteractOutside={!isDeleting}
    >
      <Portal>
        <Dialog.Backdrop />

        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Удалить записи?</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Text>Будет удалено записей: {rowsCount}</Text>

              <Text mt={2} color="fg.muted" fontSize="sm">
                Операцию невозможно отменить.
              </Text>
            </Dialog.Body>

            <Dialog.Footer>
              <HStack>
                <Button
                  variant="outline"
                  disabled={isDeleting}
                  onClick={() => onOpenChange(false)}
                >
                  Отмена
                </Button>

                <Button
                  colorPalette="red"
                  disabled={isDeleting}
                  onClick={() => void onConfirm()}
                >
                  {isDeleting ? "Удаление..." : "Удалить"}
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default DeleteRowsDialog;
