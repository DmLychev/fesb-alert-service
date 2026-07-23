import { Switch } from "@chakra-ui/react";

interface LiveUpdateToggleProps {
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const LiveUpdateToggle = ({
  isChecked,
  onCheckedChange,
}: LiveUpdateToggleProps) => {
  return (
    <Switch.Root
      aria-label="Автообновление"
      checked={isChecked}
      onCheckedChange={({ checked }) => onCheckedChange(checked)}
      size="sm"
      colorPalette="green"
    >
      <Switch.HiddenInput />
      <Switch.Control />
    </Switch.Root>
  );
};

export default LiveUpdateToggle;
