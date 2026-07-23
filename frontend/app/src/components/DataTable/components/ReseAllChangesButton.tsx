import { Button } from "@chakra-ui/react";

interface ReseAllChangesButtonProps {
  isApplying: boolean;
  onClick: () => void;
}

const ReseAllChangesButton = ({
  isApplying,
  onClick,
}: ReseAllChangesButtonProps) => {
  return (
    <Button size="sm" variant="outline" disabled={isApplying} onClick={onClick}>
      Отменить изменения
    </Button>
  );
};

export default ReseAllChangesButton;
