import { Badge } from "@chakra-ui/react";
import type { MessageStatus } from "../types";

interface StatusCellProps {
  value: MessageStatus | null | undefined;
}

const StatusCell = ({ value }: StatusCellProps) => {
  if (!value) return null;

  return (
    <Badge colorPalette={value === "ERROR" ? "red" : "green"}>{value}</Badge>
  );
};

export default StatusCell;
