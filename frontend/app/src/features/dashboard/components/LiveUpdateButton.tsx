import { Button, Box, Text } from "@chakra-ui/react";
import type { DashboardLiveStatus } from "../types";

interface LiveUpdateButtonProps {
  status: DashboardLiveStatus;
  onClick: () => void;
}

const STATUS_LABELS: Record<DashboardLiveStatus, string> = {
  off: "Автообновление отключено",
  connecting: "Подключение...",
  connected: "Автообновление включено",
  disconnected: "Автообновление потеряно",
};

const LiveUpdateButton = ({ status, onClick }: LiveUpdateButtonProps) => {
  return (
    <Button
      aria-label={STATUS_LABELS[status]}
      title={STATUS_LABELS[status]}
      size="sm"
      paddingInline={{ base: 0, md: 3 }}
      variant={"outline"}
      disabled={status === "connecting"}
      onClick={onClick}
    >
      <Box
        width="8px"
        height="8px"
        borderRadius="full"
        bg={
          status === "connected"
            ? "green.solid"
            : status === "connecting"
              ? "orange.solid"
              : status === "disconnected"
                ? "red.solid"
                : "fg.subtle"
        }
      />

      <Text>Live</Text>
    </Button>
  );
};

export default LiveUpdateButton;
