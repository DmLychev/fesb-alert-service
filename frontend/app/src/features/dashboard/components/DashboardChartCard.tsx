import type { PropsWithChildren } from "react";

import { Card, Heading } from "@chakra-ui/react";

interface Props {
  title: string;
}

const DashboardChartCard = ({ title, children }: PropsWithChildren<Props>) => {
  return (
    <Card.Root variant="outline">
      <Card.Header pb={0}>
        <Heading size="md">{title}</Heading>
      </Card.Header>

      <Card.Body>{children}</Card.Body>
    </Card.Root>
  );
};

export default DashboardChartCard;
