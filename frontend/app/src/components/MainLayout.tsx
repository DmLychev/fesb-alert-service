import { Box, Container } from "@chakra-ui/react";
import React from "react";
import NavBar from "./NavBar";
import { Outlet } from "react-router-dom";

const MainLayout: React.FC = () => {
  return (
    <Box minH="100vh">
      <NavBar />
      <Container as="main" maxW="1200px" py={8}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default MainLayout;
