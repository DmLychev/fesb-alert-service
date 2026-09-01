import { Button, Text } from "@chakra-ui/react";
import { LuTrash2 } from "react-icons/lu";

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
      aria-label="Удалить выбранные"
      size="sm"
      variant="outline"
      colorPalette="red"
      width={{ base: "36px", md: "132px" }}
      minWidth={{ base: "36px", md: "132px" }}
      paddingInline={{ base: 0, md: 3 }}
      disabled={disabled}
      onClick={() => onClick()}
    >
      <LuTrash2 />
      <Text hideBelow="md">Удалить</Text>
    </Button>
  );
};

export default DeleteSelectedRowsButton;
