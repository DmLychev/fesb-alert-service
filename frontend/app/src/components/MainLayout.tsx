import { Box, Container } from "@chakra-ui/react";
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

      <Container
        as="main"
        maxW="1200px"
        width="full"
        flex="1"
        minHeight={0}
        py={4}
        overflow="hidden"
      >
        <Outlet />
      </Container>
    </Box>
  );
};

export default MainLayout;
