import { Card, Text, VStack } from "@chakra-ui/react";

interface Props {
  title: string;
  value: string;
  secondary?: string;
}

const DashboardKpiCard = ({ title, value, secondary }: Props) => {
  return (
    <Card.Root variant="outline" height="full" bg="bg.panel">
      <Card.Body>
        <VStack align="start" gap={1}>
          <Text fontSize="sm" color="fg.muted">
            {title}
          </Text>

          <Text fontSize="3xl" fontWeight="semibold" lineHeight="1.1">
            {value}
          </Text>

          {secondary && (
            <Text fontSize="sm" color="fg.muted">
              {secondary}
            </Text>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

export default DashboardKpiCard;
