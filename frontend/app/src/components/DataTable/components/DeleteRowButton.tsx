import { Icon, IconButton } from "@chakra-ui/react";
import { TiDelete } from "react-icons/ti";

interface DeleteRowButton {
  disabled: boolean;
  onDelete: () => void;
}

const DeleteRowButton = ({ disabled, onDelete }: DeleteRowButton) => {
  return (
    <IconButton onClick={onDelete} variant="ghost" disabled={disabled}>
      <Icon color="red" size="sm" asChild>
        <TiDelete />
      </Icon>
    </IconButton>
  );
};

export default DeleteRowButton;
