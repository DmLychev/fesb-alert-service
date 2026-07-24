import {
  type ListCollection,
  Box,
  ButtonGroup,
  Flex,
  HStack,
  IconButton,
  Pagination,
  Portal,
  Select,
  Text,
} from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import type { LiveUpdateStatus } from "../types";
import LiveUpdateStatusIndicator from "./LiveUpdateStatusIndicator";

interface TablePaginationProps {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  pageSizeOptions: ListCollection<{
    value: string;
    label: string;
  }>;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  liveUpdateStatus: LiveUpdateStatus;
  disabled?: boolean;
}

const TablePagination = ({
  pageIndex,
  pageSize,
  totalCount,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  liveUpdateStatus,
  disabled,
}: TablePaginationProps) => {
  const firstVisibleRow = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
  const lastVisibleRow = Math.min((pageIndex + 1) * pageSize, totalCount);
  const rangeLabel = `${firstVisibleRow}-${lastVisibleRow}  из ${totalCount}`;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <Pagination.Root
      pageSize={pageSize}
      page={pageIndex + 1}
      count={totalCount}
      defaultPage={1}
      onPageChange={(details) => onPageChange(details.page)}
    >
      <Flex
        minHeight="40px"
        justifyContent="space-between"
        paddingInline={3}
        paddingBlock={1}
        flexShrink={0}
        borderWidth="1px"
        borderColor="border.muted"
        borderRadius="md"
        bg="bg.panel"
        direction={{ base: "column", md: "row" }}
        alignItems={{ base: "stretch", md: "center" }}
        gap={2}
      >
        <HStack gap={3}>
          <Text fontSize="sm" color="fg.muted" whiteSpace="nowrap">
            {rangeLabel}
          </Text>

          {liveUpdateStatus && (
            <LiveUpdateStatusIndicator status={liveUpdateStatus} />
          )}
        </HStack>

        <Text hideFrom="md" fontSize="sm" whiteSpace="nowrap">
          Стр. {pageIndex + 1} {pageCount}
        </Text>

        <ButtonGroup variant="ghost" size="sm" attached={false}>
          <HStack gap={1}>
            <Pagination.PrevTrigger asChild>
              <IconButton disabled={disabled}>
                <LuChevronLeft />
              </IconButton>
            </Pagination.PrevTrigger>

            <Box hideBelow="md">
              <Pagination.Items
                render={(page) => (
                  <IconButton
                    variant={{ base: "ghost", _selected: "outline" }}
                    disabled={disabled}
                  >
                    {page.value}
                  </IconButton>
                )}
              />
            </Box>

            <Pagination.NextTrigger asChild>
              <IconButton disabled={disabled}>
                <LuChevronRight />
              </IconButton>
            </Pagination.NextTrigger>
          </HStack>
        </ButtonGroup>

        <Box hideBelow="md">
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
            disabled={disabled}
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
        </Box>
      </Flex>
    </Pagination.Root>
  );
};

export default TablePagination;
