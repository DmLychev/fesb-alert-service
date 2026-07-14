import type { RefreshButtonProps } from "../types";
import { Button } from "@chakra-ui/react";
import { LuRefreshCw } from "react-icons/lu";

const RefreshButton = ({ onRefresh }: RefreshButtonProps) => {
  return (
    <Button variant="outline" size="sm" onClick={onRefresh}>
      <LuRefreshCw /> Обновить
    </Button>
  );
};

export default RefreshButton;
