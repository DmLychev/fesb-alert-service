import { Text } from "@chakra-ui/react";

interface ScrollableTextCellProps {
  getValue: () => unknown;
}

const ScrollableTextCell = ({ getValue }: ScrollableTextCellProps) => {
  const rawValue = getValue();
  const value =
    rawValue === null || rawValue === undefined ? "" : String(rawValue);

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
      {value}
    </Text>
  );
};

export default ScrollableTextCell;
