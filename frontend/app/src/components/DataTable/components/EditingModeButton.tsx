import { Button, Text } from "@chakra-ui/react";
import { LuPencil } from "react-icons/lu";

interface EditingModeButtonProps {
  onClick: () => void;
}

const EditingModeButton = ({ onClick }: EditingModeButtonProps) => {
  return (
    <Button
      aria-label="Редактировать"
      size="sm"
      width={{ base: "36px", md: "132px" }}
      minWidth={{ base: "36px", md: "132px" }}
      paddingInline={{ base: 0, md: 3 }}
      variant={"outline"}
      onClick={onClick}
    >
      <LuPencil />

      <Text hideBelow="md">Редактировать</Text>
    </Button>
  );
};

export default EditingModeButton;
