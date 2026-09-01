import type { PropsWithChildren } from "react";

import { Card, Center, Heading, Text, VStack } from "@chakra-ui/react";

interface Props {
  title: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  height?: string;
}

const DashboardChartCard = ({
  title,
  children,
  isEmpty = false,
  emptyMessage = "Нет данных за выбранный период",
  height = "260px",
}: PropsWithChildren<Props>) => {
  return (
    <Card.Root variant="outline" height="full" bg="bg.panel">
      <Card.Header pb={0}>
        <Heading size="md">{title}</Heading>
      </Card.Header>

      <Card.Body>
        {isEmpty ? (
          <Center height={height}>
            <VStack gap={1}>
              <Text
                fontSize="sm"
                fontWeight="medium"
                color="fg.muted"
                textAlign="center"
              >
                {emptyMessage}
              </Text>

              <Text fontSize="xs" color="fg.subtle" textAlign="center">
                Попробуйте выбрать другой период
              </Text>
            </VStack>
          </Center>
        ) : (
          children
        )}
      </Card.Body>
    </Card.Root>
  );
};

export default DashboardChartCard;
