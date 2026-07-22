import { Icon, IconButton } from "@chakra-ui/react";
import { MdDelete } from "react-icons/md";

interface DeleteRowButton {
  disabled: boolean;
  onDelete: () => void;
}

const DeleteRowButton = ({ disabled, onDelete }: DeleteRowButton) => {
  return (
    <IconButton onClick={onDelete} variant="ghost" disabled={disabled}>
      <Icon color="red" size="sm" asChild>
        <MdDelete />
      </Icon>
    </IconButton>
  );
};

export default DeleteRowButton;
