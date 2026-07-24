import { Button, Text } from "@chakra-ui/react";
import { LuUndo2 } from "react-icons/lu";

interface ResetAllChangesButtonProps {
  isApplying: boolean;
  disabled: boolean;
  onClick: () => void;
}

const ResetAllChangesButton = ({
  isApplying,
  disabled,
  onClick,
}: ResetAllChangesButtonProps) => {
  return (
    <Button
      aria-label=" Отменить изменения"
      size="sm"
      width={{ base: "36px", md: "132px" }}
      minWidth={{ base: "36px", md: "132px" }}
      paddingInline={{ base: 0, md: 3 }}
      disabled={isApplying}
      onClick={onClick}
    >
      <LuUndo2 />
      <Text hideBelow="md">Отменить</Text>
    </Button>
  );
};

export default ResetAllChangesButton;
