import { Button, Box, Text } from "@chakra-ui/react";
import type { DashboardLiveStatus } from "../types";

interface LiveUpdateButtonProps {
  status: DashboardLiveStatus;
  handleClick: (enabled: boolean) => void;
}

const LiveUpdateButton = ({ status, handleClick }: LiveUpdateButtonProps) => {
  return (
    <Button
      aria-label="Автообновление"
      size="sm"
      width={{ base: "36px", md: "132px" }}
      minWidth={{ base: "36px", md: "132px" }}
      paddingInline={{ base: 0, md: 3 }}
      variant={"outline"}
      disabled={status === "connecting" ? true : false}
      onClick={() => handleClick(status === "connected")}
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
