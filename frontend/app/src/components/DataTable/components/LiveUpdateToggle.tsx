import { Switch } from "@chakra-ui/react";
import type { LiveUpdateToggleProps } from "../types";

const LiveUpdateToggle = ({
  isChecked,
  onCheckedChange,
}: LiveUpdateToggleProps) => {
  return (
    <Switch.Root
      checked={isChecked}
      onCheckedChange={({ checked }) => onCheckedChange(checked)}
      size="sm"
      colorPalette="green"
    >
      <Switch.HiddenInput />
      <Switch.Control />
      <Switch.Label>Live</Switch.Label>
    </Switch.Root>
  );
};

export default LiveUpdateToggle;
