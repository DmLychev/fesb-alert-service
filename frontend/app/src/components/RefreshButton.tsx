import { Box, IconButton } from "@chakra-ui/react";
import { LuRefreshCw } from "react-icons/lu";

interface RefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

const RefreshButton = ({
  isRefreshing,
  onRefresh,
  disabled,
  ariaLabel = "Обновить данные",
}: RefreshButtonProps) => {
  return (
    <IconButton
      aria-label={ariaLabel}
      title={ariaLabel}
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
