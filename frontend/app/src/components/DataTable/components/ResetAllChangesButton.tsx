import { Button } from "@chakra-ui/react";

interface ResetAllChangesButtonProps {
  isApplying: boolean;
  onClick: () => void;
}

const ResetAllChangesButton = ({
  isApplying,
  onClick,
}: ResetAllChangesButtonProps) => {
  return (
    <Button disabled={isApplying} onClick={onClick}>
      Отменить изменения
    </Button>
  );
};

export default ResetAllChangesButton;
