import { Box } from "@chakra-ui/react";

import { useState } from "react";

import NotificationReceiverTable from "./NotificationReceiverTable";
import CreateSubscriptionDialog from "./components/CreateSubscriptionDialog";

const NotificationSubscription = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [tableVersion, setTableVersion] = useState(0);

  const handleCreated = () => {
    setTableVersion((current) => current + 1);
  };

  return (
    <Box height="full" minHeight={0} overflow="hidden">
      <NotificationReceiverTable
        key={tableVersion}
        onAddSubscription={() => setIsCreateDialogOpen(true)}
      />

      <CreateSubscriptionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreated={handleCreated}
      />
    </Box>
  );
};

export default NotificationSubscription;
