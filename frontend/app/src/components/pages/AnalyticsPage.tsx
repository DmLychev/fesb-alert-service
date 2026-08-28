import { Box, Tabs } from "@chakra-ui/react";
import MessageTable from "../../features/messages/MessageTable";
import IssueTable from "../../features/issues/IssueTable";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import FesbRequestTable from "../../features/fesbRequests/FesbRequestTable";

type AnalyticsTab = "messages" | "issues" | "requests";

const isAnalyticsTab = (value: string | undefined): value is AnalyticsTab =>
  value === "messages" || value === "issues" || value === "requests";

const AnalyticsPage = () => {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();

  if (!isAnalyticsTab(tab)) return <Navigate to="/analytics/issues" replace />;

  return (
    <Box height="full" minHeight={0} overflow="hidden">
      <Tabs.Root
        value={tab}
        variant="line"
        lazyMount
        unmountOnExit
        height="full"
        minHeight={0}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        onValueChange={({ value }) => navigate(`/analytics/${value}`)}
      >
        <Tabs.List flexShrink={0}>
          <Tabs.Trigger value="issues">Инциденты</Tabs.Trigger>
          <Tabs.Trigger value="messages">Сообщения</Tabs.Trigger>
          <Tabs.Trigger value="requests">Запросы</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content
          value="issues"
          flex="1"
          minHeight={0}
          overflow="auto"
          pt={4}
        >
          <IssueTable />
        </Tabs.Content>

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
          value="requests"
          flex="1"
          minHeight={0}
          overflow="hidden"
          pt={4}
        >
          <FesbRequestTable />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
};

export default AnalyticsPage;
