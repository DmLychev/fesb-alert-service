import { Button } from "@chakra-ui/react";

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
      size="sm"
      colorPalette="yellow"
      disabled={isApplying}
      onClick={onClick}
    >
      {isApplying ? "Applying..." : `Применить (${changesCount})`}
    </Button>
  );
};

export default ApplyAllChangesButton;
