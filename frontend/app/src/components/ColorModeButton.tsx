import { useColorMode } from "./ui/color-mode";
import { Icon, IconButton } from "@chakra-ui/react";
import { FaMoon, FaSun } from "react-icons/fa";

const ColorModeButton = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <IconButton onClick={toggleColorMode} variant="ghost" size="md">
      {colorMode === "dark" ? (
        <Icon color="yellow.400" size="sm" asChild>
          <FaMoon />
        </Icon>
      ) : (
        <Icon color="gray.500" size="sm" asChild>
          <FaSun />
        </Icon>
      )}
    </IconButton>
  );
};

export default ColorModeButton;
