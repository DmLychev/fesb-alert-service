import {
  type ListCollection,
  Box,
  Button,
  ButtonGroup,
  Grid,
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
  liveUpdateStatus?: LiveUpdateStatus;
}

const TableFooter = ({
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
        <Grid
          width="full"
          gridTemplateColumns={{ base: "1fr", md: "1fr auto 1fr" }}
          alignItems="center"
          gap={{ base: 2, md: 3 }}
          paddingInline={3}
          paddingBlock={1.5}
          borderWidth="1px"
          borderColor="border.muted"
          borderRadius="md"
          bg="bg.panel"
        >
          <HStack
            width="fit-content"
            justifySelf={{ base: "stretch", md: "start" }}
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

          <HStack justifySelf="center" justifyContent="center" gap={1}>
            <Pagination.PrevTrigger asChild>
              <IconButton
                aria-label="Предыдущая страница"
                size="sm"
                variant="ghost"
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
              >
                <LuChevronRight />
              </IconButton>
            </Pagination.NextTrigger>
          </HStack>

          <Box hideBelow="md" justifySelf="end">
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
          </Box>
        </Grid>
      </Pagination.Root>

      {isPageDialogOpen && (
        <GoToPageDialog
          open
          currentPage={pageIndex + 1}
          pageCount={pageCount}
          onOpenChange={setIsPageDialogOpen}
          onSubmit={onPageChange}
        />
      )}
    </>
  );
};

export default TableFooter;
