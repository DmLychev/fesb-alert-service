import { Button, Text } from "@chakra-ui/react";
import { LuPencil } from "react-icons/lu";

interface EditingModeButtonProps {
  isEditingMode: boolean;
  onClick: () => void;
}

const EditingModeButton = ({
  isEditingMode,
  onClick,
}: EditingModeButtonProps) => {
  return (
    <Button
      aria-label="Редактировать"
      size="sm"
      width={{ base: "36px", md: "132px" }}
      minWidth={{ base: "36px", md: "132px" }}
      paddingInline={{ base: 0, md: 3 }}
      colorPalette={isEditingMode ? "yellow" : undefined}
      variant={isEditingMode ? "solid" : "outline"}
      onClick={onClick}
    >
      <LuPencil />

      <Text hideBelow="md">
        {isEditingMode ? "Завершить" : "Редактировать"}
      </Text>
    </Button>
  );
};

export default EditingModeButton;
