import { IconButton } from "@chakra-ui/react";
import { LuFilterX } from "react-icons/lu";

interface ResetFilterButtonProps {
  disabled: boolean;
  onClick: () => void;
}

const ResetFilterButton = ({ disabled, onClick }: ResetFilterButtonProps) => {
  return (
    <IconButton
      aria-label="Сбросить фильтры"
      title="Сбросить фильтры"
      size="sm"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
    >
      {" "}
      <LuFilterX />
    </IconButton>
  );
};

export default ResetFilterButton;
