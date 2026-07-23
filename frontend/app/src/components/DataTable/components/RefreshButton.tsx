import { Box, IconButton } from "@chakra-ui/react";
import { LuRefreshCw } from "react-icons/lu";

interface RefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  disabled?: boolean;
}

const RefreshButton = ({
  isRefreshing,
  onRefresh,
  disabled,
}: RefreshButtonProps) => {
  return (
    <IconButton
      aria-label="Обновить таблицу"
      title="Обновить таблицу"
      size="sm"
      variant="outline"
      disabled={disabled || isRefreshing}
      onClick={onRefresh}
    >
      <Box animation={isRefreshing ? "spin 0.8s linear infinite" : undefined}>
        <LuRefreshCw />
      </Box>
    </IconButton>
  );
};

export default RefreshButton;
