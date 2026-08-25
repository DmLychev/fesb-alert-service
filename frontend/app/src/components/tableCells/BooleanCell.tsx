import { Circle } from "@chakra-ui/react";
import { LuCheck, LuX } from "react-icons/lu";

interface BooleanCellProps {
  value: boolean | null;
}

const BooleanCell = ({ value }: BooleanCellProps) => {
  if (value === null) return "";

  const label = value ? "Да" : "Нет";

  return (
    <Circle
      size="18px"
      bg={value ? "green.500" : "red.500"}
      color="white"
      title={label}
      aria-label={label}
    >
      {value ? (
        <LuCheck size={14} strokeWidth={3} />
      ) : (
        <LuX size={14} strokeWidth={3} />
      )}
    </Circle>
  );
};

export default BooleanCell;
