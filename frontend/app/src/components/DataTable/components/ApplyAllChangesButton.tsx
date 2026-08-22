import { Button, Text } from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";

interface ApplyAllChangesButtonProps {
  isApplying: boolean;
  disabled: boolean;
  changesCount: number;
  onClick: () => void;
}

const ApplyAllChangesButton = ({
  isApplying,
  disabled,
  onClick,
}: ApplyAllChangesButtonProps) => {
  return (
    <Button
      aria-label="Применить изменения"
      size="sm"
      width={{ base: "36px", md: "132px" }}
      minWidth={{ base: "36px", md: "132px" }}
      paddingInline={{ base: 0, md: 3 }}
      colorPalette="blue"
      disabled={disabled || isApplying}
      onClick={onClick}
    >
      <LuCheck />
      <Text hideBelow="md">{isApplying ? "Applying..." : "Применить"}</Text>
    </Button>
  );
};

export default ApplyAllChangesButton;
