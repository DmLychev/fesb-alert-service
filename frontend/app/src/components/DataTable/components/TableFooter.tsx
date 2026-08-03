import {
  type ListCollection,
  Box,
  Button,
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
import { useState } from "react";
import GoToPageDialog from "./GoToPageDialog";

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

const TableFooter = ({
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
  const rangeLabel = `${firstVisibleRow}-${lastVisibleRow} из ${totalCount}`;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  const [isPageDialogOpen, setIsPageDialogOpen] = useState(false);

  return (
    <>
      <Pagination.Root
        pageSize={pageSize}
        page={pageIndex + 1}
        count={totalCount}
        defaultPage={1}
        onPageChange={(details) => onPageChange(details.page)}
      >
        <Flex
          width="full"
          minHeight="40px"
          direction={{ base: "column", md: "row" }}
          alignItems={{ base: "stretch", md: "center" }}
          justifyContent="space-between"
          gap={{ base: 2, md: 3 }}
          paddingInline={3}
          paddingBlock={1.5}
          borderWidth="1px"
          borderColor="border.muted"
          borderRadius="md"
          bg="bg.panel"
        >
          <HStack
            width={{ base: "full", md: "auto" }}
            justifyContent={{ base: "space-between", md: "flex-start" }}
            gap={3}
          >
            <Text fontSize="sm" color="fg.muted" whiteSpace="nowrap">
              {rangeLabel}
            </Text>

            {liveUpdateStatus && (
              <LiveUpdateStatusIndicator status={liveUpdateStatus} />
            )}
          </HStack>

          <HStack
            width={{ base: "full", md: "auto" }}
            justifyContent="space-between"
            gap={1}
          >
            <Pagination.PrevTrigger asChild>
              <IconButton
                area-label="Предыдущая страница"
                size="sm"
                variant="ghost"
                disabled={disabled}
              >
                <LuChevronLeft />
              </IconButton>
            </Pagination.PrevTrigger>

            <Button
              hideFrom="md"
              minWidth="150px"
              size="sm"
              variant="ghost"
              onClick={() => setIsPageDialogOpen(true)}
            >
              Стр. {pageIndex + 1} из {pageCount}
            </Button>

            <ButtonGroup hideBelow="md" variant="ghost" size="sm">
              <HStack gap={1}>
                <Box hideBelow="md">
                  {/* <Pagination.Items
                  render={(page) => (
                    <IconButton
                      variant={{ base: "ghost", _selected: "outline" }}
                      disabled={disabled}
                    >
                      {page.value}
                    </IconButton>
                  )}
                /> */}
                  <Pagination.Context>
                    {({ pages }) =>
                      pages.map((item, index) => {
                        if (item.type === "page")
                          return (
                            <Pagination.Item key={item.value} {...item} asChild>
                              <IconButton
                                aria-label={`Страница ${item.value}`}
                                size="sm"
                                variant={{
                                  base: "ghost",
                                  _selected: "outline",
                                }}
                              >
                                {item.value}
                              </IconButton>
                            </Pagination.Item>
                          );

                        return (
                          <IconButton
                            key={`ellipsis-${index}`}
                            aria-label="Перейти к странице"
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsPageDialogOpen(true)}
                          >
                            ...
                          </IconButton>
                        );
                      })
                    }
                  </Pagination.Context>
                </Box>
              </HStack>
            </ButtonGroup>

            <Pagination.NextTrigger asChild>
              <IconButton
                aria-label="Следующая страница"
                size="sm"
                variant="ghost"
                disabled={disabled}
              >
                <LuChevronRight />
              </IconButton>
            </Pagination.NextTrigger>
          </HStack>

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

      <GoToPageDialog
        open={isPageDialogOpen}
        currentPage={pageIndex + 1}
        pageCount={pageCount}
        onOpenchange={setIsPageDialogOpen}
        onSubmit={onPageChange}
      />
    </>
  );
};

export default TableFooter;
