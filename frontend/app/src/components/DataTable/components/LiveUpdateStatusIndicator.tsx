import { Box, HStack, Text } from "@chakra-ui/react";
import type { LiveUpdateStatus } from "../types";

interface Props {
  status: LiveUpdateStatus;
}

const statusDefinitions = {
  off: { label: "Автообновление выключено", color: "gray.400" },
  connecting: { label: "Подключение...", color: "orange.400" },
  connected: { label: "Live", color: "green.500" },
  disconnected: { label: "Нет соединения", color: "red.500" },
  paused: { label: "Обновление приостановлено", color: "yellow.500" },
} satisfies Record<LiveUpdateStatus, { label: string; color: string }>;

const LiveUpdateStatusIndicator = ({ status }: Props) => {
  const definition = statusDefinitions[status];

  return (
    <HStack gap={1.5} whiteSpace="nowrap">
      <Box boxSize="8px" borderRadius="full" bg={definition.color} />

      <Text fontSize="xs" color="fg.muted">
        {definition.label}
      </Text>
    </HStack>
  );
};

export default LiveUpdateStatusIndicator;
