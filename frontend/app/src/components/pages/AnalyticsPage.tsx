import { Link, Tabs } from "@chakra-ui/react";
import MessageTable from "../../features/messages/MessageTable";

const AnalyticsPage = () => {
  return (
    <Tabs.Root defaultValue="issues" variant="line">
      <Tabs.List>
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
      <Tabs.Content value="messages">
        {/* <MessagePage /> */}
        <MessageTable />
      </Tabs.Content>
      <Tabs.Content value="issues">Инциденты</Tabs.Content>
    </Tabs.Root>
  );
};

export default AnalyticsPage;
