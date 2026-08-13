import { Box, Link, Tabs } from "@chakra-ui/react";
import MessageTable from "../../features/messages/MessageTable";
import IssueTable from "../../features/issues/IssueTable";

const AnalyticsPage = () => {
  return (
    <Box height="full" minHeight={0} overflow="hidden">
      <Tabs.Root
        defaultValue="messages"
        variant="line"
        height="full"
        minHeight={0}
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        <Tabs.List flexShrink={0}>
          <Tabs.Trigger value="messages" asChild>
            <Link unstyled href="#messages">
              Сообщения
            </Link>
          </Tabs.Trigger>
          <Tabs.Trigger value="issues" asChild>
            <Link unstyled href="#issues">
              Инциденты
            </Link>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content
          value="messages"
          flex="1"
          minHeight={0}
          overflow="hidden"
          pt={4}
        >
          <MessageTable />
        </Tabs.Content>
        <Tabs.Content
          value="issues"
          flex="1"
          minHeight={0}
          overflow="auto"
          pt={4}
        >
          <IssueTable />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
};

export default AnalyticsPage;
