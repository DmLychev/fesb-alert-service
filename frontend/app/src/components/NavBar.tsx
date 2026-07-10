import {
  Box,
  Button,
  Drawer,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Link,
  Stack,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import { useState } from "react";
import { FiMenu } from "react-icons/fi";
import ColorModeButton from "./ColorModeButton";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Дашборд", href: "/dashboard" },
  { label: "Детализация", href: "/analytics" },
  { label: "Настройки", href: "/settings" },
];
const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    setIsMenuOpen(false);
    navigate("/logout");
  };

  return (
    <Box
      as="nav"
      position="sticky"
      top="0"
      zIndex="sticky"
      bg="bg.panel"
      borderBottom="1px solid"
      borderColor="border.subtle"
      px={4}
      h="16"
      boxShadow="sm"
    >
      <Flex
        h="full"
        alignItems="center"
        justifyContent="space-between"
        maxW="1200px"
        mx="auto"
      >
        {/* Лого + название приложения */}
        <Link asChild _hover={{ textDecoration: "none" }}>
          <RouterLink to="/dashboard">
            <HStack>
              <Image src={logo} boxSize="30px" />
              <Heading size="md" fontWeight="bold" color="fg.muted">
                Сервис Мониторинга FESB
              </Heading>
            </HStack>
          </RouterLink>
        </Link>

        {/* Меню */}
        <HStack gap={2} display={{ base: "none", md: "flex" }}>
          <HStack gap={6}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                asChild
                fontWeight="medium"
                color="fg.muted"
                _hover={{ color: "blue.500" }}
              >
                <RouterLink to={item.href}>{item.label}</RouterLink>
              </Link>
            ))}
          </HStack>

          <ColorModeButton />

          <Button
            colorPalette="gray"
            variant="outline"
            size="sm"
            onClick={handleLogout}
          >
            Выйти
          </Button>
        </HStack>

        {/* Гамбургер */}
        <HStack display={{ base: "flex", md: "none" }} gap={2}>
          <ColorModeButton />

          <IconButton
            onClick={() => setIsMenuOpen(true)}
            variant="outline"
            aria-label="Меню"
          >
            <FiMenu size={20} />
          </IconButton>
        </HStack>
      </Flex>

      {/* Вертикальное меню (мобильная версия) */}
      <Drawer.Root
        open={isMenuOpen}
        onOpenChange={(e) => setIsMenuOpen(e.open)}
        placement="end"
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.CloseTrigger onClick={() => setIsMenuOpen(false)} />
            {/* <Drawer.Header borderBottomWidth="1px">Меню</Drawer.Header> */}
            <Drawer.Body py={6}>
              <Stack gap={6}>
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    asChild
                    fontSize="lg"
                    fontWeight="medium"
                    color="fg.muted"
                    _hover={{ color: "blue.500" }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <RouterLink to={item.href}>{item.label}</RouterLink>
                  </Link>
                ))}
                <Button
                  colorPalette="gray"
                  width="full"
                  mt={4}
                  onClick={handleLogout}
                >
                  Выйти
                </Button>
              </Stack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Box>
  );
};

export default NavBar;
