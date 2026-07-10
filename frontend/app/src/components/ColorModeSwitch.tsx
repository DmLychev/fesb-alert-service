import { HStack, Icon, Switch, SwitchHiddenInput } from "@chakra-ui/react";
import { useColorMode } from "./ui/color-mode";
import { FaMoon, FaSun } from "react-icons/fa";

const ColorModeSwitch = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <HStack>
      <Switch.Root
        colorPalette="blue"
        size="lg"
        checked={colorMode === "dark"}
        onCheckedChange={toggleColorMode}
      >
        <SwitchHiddenInput />
        <Switch.Control>
          <Switch.Thumb />
          <Switch.Indicator fallback={<Icon as={FaSun} color="gray.400" />}>
            <Icon as={FaMoon} color="yellow.400" />
          </Switch.Indicator>
        </Switch.Control>
      </Switch.Root>
    </HStack>
  );
};

export default ColorModeSwitch;
