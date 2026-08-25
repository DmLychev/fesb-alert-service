import {
  Box,
  Button,
  HStack,
  Stack,
} from "@chakra-ui/react";

import { useState } from "react";
import { LuPlus } from "react-icons/lu";

import NotificationReceiverTable from "./NotificationReceiverTable";
import CreateSubscriptionDialog from "./components/CreateSubscriptionDialog";


const NotificationSubscription = () => {
  const [
    isCreateDialogOpen,
    setIsCreateDialogOpen,
  ] = useState(false);

  const [
    tableVersion,
    setTableVersion,
  ] = useState(0);


  const handleCreated = () => {
    setTableVersion(
      (current) => current + 1,
    );
  };


  return (
    <Stack
      height="full"
      minHeight={0}
      overflow="hidden"
      gap={4}
    >
      <HStack
        justify="flex-end"
        flexShrink={0}
      >
        <Button
          size="sm"
          onClick={() =>
            setIsCreateDialogOpen(true)
          }
        >
          <LuPlus />
          Добавить подписку
        </Button>
      </HStack>

      <Box
        flex="1"
        minHeight={0}
        overflow="hidden"
      >
        <NotificationReceiverTable
          key={tableVersion}
        />
      </Box>

      <CreateSubscriptionDialog
        open={isCreateDialogOpen}
        onOpenChange={
          setIsCreateDialogOpen
        }
        onCreated={handleCreated}
      />
    </Stack>
  );
};

export default NotificationSubscription;
