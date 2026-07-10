import { Badge } from "@chakra-ui/react";

const StatusCell = (status: any) => {
  if (!status) return "";
  const isError = status === "ERROR";
  return <Badge colorPalette={isError ? "red" : "green"}>{status}</Badge>;
};

export default StatusCell;
