import { Box } from "@chakra-ui/react";
import NotificationReceiverTable from "./NotificationReceiverTable";

const NotificationSubscription = () => {
  return (
    <Box
      height="full"
      minHeight={0}
      overflow="hidden"
    >
      <NotificationReceiverTable />
    </Box>
  );
};

export default NotificationSubscription;
