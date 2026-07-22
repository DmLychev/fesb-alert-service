import { Button } from "@chakra-ui/react";

interface DeletedSelectedRowsButtonProps {
  disabled: boolean;
  onClick: () => void;
}

const DeleteSelectedRowsButton = ({
  disabled,
  onClick,
}: DeletedSelectedRowsButtonProps) => {
  return (
    <Button
      size="sm"
      colorPalette="red"
      disabled={disabled}
      onClick={() => onClick()}
    >
      Удалить выбранные
    </Button>
  );
};

export default DeleteSelectedRowsButton;
