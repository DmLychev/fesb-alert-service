import {
  ButtonGroup,
  Flex,
  HStack,
  IconButton,
  Pagination,
  Portal,
  Select,
} from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import type { TablePaginationProps } from "../types";

const TablePagination = ({
  pageIndex,
  pageSize,
  totalCount,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) => {
  return (
    <Pagination.Root
      pageSize={pageSize}
      page={pageIndex + 1}
      count={totalCount}
      defaultPage={1}
      onPageChange={(details) => onPageChange(details.page)}
    >
      <Flex
        width="full"
        justifyContent="space-between"
        alignItems="center"
        wrap="wrap"
        gap={4}
      >
        <Pagination.PageText
          format={() =>
            totalCount > 0
              ? `${pageIndex * pageSize + 1} - ${Math.min((pageIndex + 1) * pageSize, totalCount)} из ${totalCount}`
              : "0 - 0 из 0"
          }
        />

        <ButtonGroup variant="ghost" size="sm" attached={false}>
          <HStack gap={1}>
            <Pagination.PrevTrigger asChild>
              <IconButton>
                <LuChevronLeft />
              </IconButton>
            </Pagination.PrevTrigger>

            <Pagination.Items
              render={(page) => (
                <IconButton variant={{ base: "ghost", _selected: "outline" }}>
                  {page.value}
                </IconButton>
              )}
            />

            <Pagination.NextTrigger asChild>
              <IconButton>
                <LuChevronRight />
              </IconButton>
            </Pagination.NextTrigger>
          </HStack>
        </ButtonGroup>

        <Select.Root
          collection={pageSizeOptions}
          value={[pageSize.toString()]}
          onValueChange={(details) => {
            const selectedValue = details.value[0];
            if (selectedValue) {
              onPageSizeChange(Number(selectedValue));
            }
          }}
          size="sm"
          width="110px"
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>

          <Portal>
            <Select.Positioner>
              <Select.Content>
                {pageSizeOptions.items.map((item) => (
                  <Select.Item item={item} key={item.value}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </Flex>
    </Pagination.Root>
  );
};

export default TablePagination;
