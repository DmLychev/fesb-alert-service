import { Button, Dialog, HStack, Input, Portal, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface GoToPageDialogProps {
  open: boolean;
  currentPage: number;
  pageCount: number;

  onOpenChange: (open: boolean) => void;
  onSubmit: (page: number) => void;
}

const GoToPageDialog = ({
  open,
  currentPage,
  pageCount,
  onOpenChange,
  onSubmit,
}: GoToPageDialogProps) => {
  const [value, setValue] = useState(String(currentPage));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setValue(String(currentPage));
    setError(null);
  }, [open, currentPage]);

  const submit = () => {
    const page = Number(value);

    if (!Number.isInteger(page) || page < 1 || page > pageCount) {
      setError(`Введите число от 1 до ${pageCount}`);
      return;
    }

    onSubmit(page);
    onOpenChange(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={({ open }) => onOpenChange(open)}
      size="sm"
      placement="bottom"
    >
      <Portal>
        <Dialog.Backdrop />

        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Перейти к странице</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Input
                type="number"
                min={1}
                max={pageCount}
                value={value}
                autoFocus
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submit();
                }}
              />

              {error && (
                <Text mt={2} color="fg.error" fontSize="sm">
                  {error}
                </Text>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              <HStack>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Отмена
                </Button>

                <Button onClick={submit}>Перейти</Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default GoToPageDialog;
