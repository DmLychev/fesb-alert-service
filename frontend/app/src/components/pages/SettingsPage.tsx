import { Box, Tabs } from "@chakra-ui/react";

import NotificationSubscription from "../../features/notificationReceivers/NotificationSubscription";

const SettingsPage = () => {
  return (
    <Box height="full" minHeight={0} overflow="hidden">
      <Tabs.Root
        defaultValue="subscriptions"
        variant="line"
        lazyMount
        unmountOnExit
        height="full"
        minHeight={0}
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        <Tabs.List flexShrink={0}>
          {/* <Tabs.Trigger value="general">
            Общие
          </Tabs.Trigger> */}

          <Tabs.Trigger value="subscriptions">Подписки</Tabs.Trigger>
        </Tabs.List>

        {/* <Tabs.Content
          value="general"
          flex="1"
          minHeight={0}
          overflow="auto"
          pt={4}
        >
          Здесь будут общие настройки
        </Tabs.Content> */}

        <Tabs.Content
          value="subscriptions"
          flex="1"
          minHeight={0}
          overflow="hidden"
          pt={4}
        >
          <NotificationSubscription />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
};

export default SettingsPage;
