import type { SortingState } from "@tanstack/react-table";
import type { FetchPageParams, PageResult, UiFilterRow } from "../types";
import { useCallback, useEffect, useState } from "react";
import { toaster } from "../../ui/toaster";

interface UseTableDataParams<TData> {
  fetchPage: (params: FetchPageParams) => Promise<PageResult<TData>>;
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  search: string;
  filters: UiFilterRow[];
}

const useTableData = <TData>({
  fetchPage,
  pageIndex,
  pageSize,
  sorting,
  search,
  filters,
}: UseTableDataParams<TData>) => {
  const [rows, setRows] = useState<TData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshVersion((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let skeletonTimer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      const refreshStartedAt = performance.now();

      try {
        skeletonTimer = setTimeout(() => setShowSkeleton(true), 200);

        const result = await fetchPage({
          pagination: { pageIndex, pageSize },
          sorting,
          search,
          filters,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setRows(result.rows);
        setTotalCount(result.totalCount);
      } catch (error: unknown) {
        if (controller.signal.aborted) return;

        toaster.create({
          title:
            error instanceof Error ? error.message : "Ошибка загрузки данных",
          type: "error",
          duration: 6000,
        });
      } finally {
        if (skeletonTimer) clearTimeout(skeletonTimer);

        const elapsed = performance.now() - refreshStartedAt;
        const remainingAnimationTime = Math.max(0, 300 - elapsed);

        if (remainingAnimationTime > 0) {
          await new Promise<void>((resolve) =>
            setTimeout(resolve, remainingAnimationTime),
          );
        }

        if (!controller.signal.aborted) {
          setShowSkeleton(false);
          setIsRefreshing(false);
        }
      }
    };

    void load();

    return () => {
      controller.abort();

      if (skeletonTimer) clearTimeout(skeletonTimer);
    };
  }, [
    fetchPage,
    pageIndex,
    pageSize,
    sorting,
    search,
    filters,
    refreshVersion,
  ]);

  return { rows, setRows, totalCount, showSkeleton, isRefreshing, refresh };
};

export default useTableData;
