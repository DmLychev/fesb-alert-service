import { Box, Flex } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface TableToolbarProps {
  left: ReactNode;
  right: ReactNode;
}

const TableToolbar = ({ left, right }: TableToolbarProps) => {
  return (
    <Flex
      as="section"
      aria-label="Управление таблицей"
      direction={{
        base: "column",
        md: "row",
      }}
      align={{
        base: "stretch",
        md: "center",
      }}
      justifyContent="space-between"
      gap={2}
      p={2}
      flexShrink={0}
      borderWidth="1px"
      borderColor="border.muted"
      borderRadius="md"
      bg="bg.panel"
    >
      <Box flex="1" minWidth={0}>
        {left}
      </Box>

      <Flex
        alignItems="center"
        justifyContent={{
          base: "space-between",
          md: "flex-end",
        }}
        flexWrap="wrap"
        gap={2}
      >
        {right}
      </Flex>
    </Flex>
  );
};

export default TableToolbar;
