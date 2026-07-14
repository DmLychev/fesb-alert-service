import type { RefreshButtonProps } from "../types";
import { Box, Button } from "@chakra-ui/react";
import { LuRefreshCw } from "react-icons/lu";

const RefreshButton = ({ isRefreshing, onRefresh }: RefreshButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onRefresh}
      disabled={isRefreshing}
      aria-busy={isRefreshing}
    >
      <Box
        as="span"
        display="inline-flex"
        animationName={isRefreshing ? "spin" : undefined}
        animationDuration="800ms"
        animationTimingFunction="linear"
        animationIterationCount="infinite"
      >
        <LuRefreshCw />
      </Box>
      Обновить
    </Button>
  );
};

export default RefreshButton;
