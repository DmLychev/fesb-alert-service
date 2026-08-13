import { Icon } from "@chakra-ui/react";
import { IoMdCheckmarkCircle } from "react-icons/io";
import { TiDelete } from "react-icons/ti";

interface BooleanCellProps {
  value: boolean;
}

const BooleanCell = ({ value }: BooleanCellProps) => {
  if (value)
    return (
      <Icon color="green" size="sm" asChild>
        <IoMdCheckmarkCircle />
      </Icon>
    );

  return (
    <Icon color="red" size="md" asChild>
      <TiDelete />
    </Icon>
  );
};

export default BooleanCell;
