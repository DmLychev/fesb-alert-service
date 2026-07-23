import { Button, Text } from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";

interface ApplyAllChangesButtonProps {
  isApplying: boolean;
  changesCount: number;
  onClick: () => void;
}

const ApplyAllChangesButton = ({
  isApplying,
  changesCount,
  onClick,
}: ApplyAllChangesButtonProps) => {
  return (
    <Button
      aria-label="Применить изменения"
      size="sm"
      width={{ base: "36px", md: "132px" }}
      minWidth={{ base: "36px", md: "132px" }}
      paddingInline={{ base: 0, md: 3 }}
      colorPalette="yellow"
      disabled={isApplying}
      onClick={onClick}
    >
      <LuCheck />
      <Text hideBelow="md">
        {isApplying ? "Applying..." : `Применить (${changesCount})`}
      </Text>
    </Button>
  );
};

export default ApplyAllChangesButton;
