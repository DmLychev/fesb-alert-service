import {
  type ListCollection,
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
}

const TablePagination = ({
  pageIndex,
  pageSize,
  totalCount,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  liveUpdateStatus,
}: TablePaginationProps) => {
  const firstVisibleRow = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
  const lastVisibleRow = Math.min((pageIndex + 1) * pageSize, totalCount);
  const rangeLabel = `${firstVisibleRow}-${lastVisibleRow}  из ${totalCount}`;

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
        alignItems="center"
        justifyContent="space-between"
        gap={3}
        paddingInline={3}
        paddingBlock={1}
        flexShrink={0}
        borderWidth="1px"
        borderColor="border.muted"
        borderRadius="md"
        bg="bg.panel"
      >
        <HStack gap={3}>
          <Text fontSize="sm" color="fg.muted" whiteSpace="nowrap">
            {rangeLabel}
          </Text>

          {liveUpdateStatus && (
            <LiveUpdateStatusIndicator status={liveUpdateStatus} />
          )}
        </HStack>

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
