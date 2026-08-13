import { Box } from "@chakra-ui/react";
import React from "react";
import NavBar from "./NavBar";
import { Outlet } from "react-router-dom";

const MainLayout: React.FC = () => {
  return (
    <Box
      height="100dvh"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      <Box flexShrink={0}>
        <NavBar />
      </Box>

      <Box
        as="main"
        width="full"
        flex="1"
        minHeight={0}
        px={{ base: 2, md: 3 }}
        py={3}
        overflow="hidden"
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
