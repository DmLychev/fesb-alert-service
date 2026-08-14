import type { Getter } from "@tanstack/react-table";
import { Text } from "@chakra-ui/react";

interface ScrollableTextCellProps {
  getValue: Getter<any>;
}

const ScrollableTextCell = ({ getValue }: ScrollableTextCellProps) => {
  const value = getValue<string | null>();

  return (
    <Text
      maxH="120px"
      overflowY="auto"
      whiteSpace="pre-wrap"
      overflowWrap="anywhere"
      lineHeight="short"
      pe={2}
      overscrollBehavior="contain"
    >
      {value ?? ""}
    </Text>
  );
};

export default ScrollableTextCell;
