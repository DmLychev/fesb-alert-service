import {
  Box,
  Card,
  Flex,
  SimpleGrid,
  Skeleton,
  Stack,
} from "@chakra-ui/react";


const KpiSkeleton = () => (
  <Card.Root
    variant="outline"
    height="full"
    bg="bg.panel"
  >
    <Card.Body>
      <Stack gap={3}>
        <Skeleton
          height="16px"
          width="45%"
        />

        <Skeleton
          height="36px"
          width="35%"
        />

        <Skeleton
          height="14px"
          width="65%"
        />
      </Stack>
    </Card.Body>
  </Card.Root>
);


interface ChartSkeletonProps {
  height?: string;
}


const ChartSkeleton = ({
  height = "260px",
}: ChartSkeletonProps) => (
  <Card.Root
    variant="outline"
    height="full"
    bg="bg.panel"
  >
    <Card.Header pb={0}>
      <Skeleton
        height="22px"
        width="180px"
      />
    </Card.Header>

    <Card.Body>
      <Skeleton
        height={height}
        width="full"
        borderRadius="md"
      />
    </Card.Body>
  </Card.Root>
);


const DashboardSkeleton = () => {
  return (
    <Box
      height="full"
      overflow="auto"
      pb={4}
    >
      <Flex
        gap={4}
        mb={4}
        align={{
          base: "stretch",
          xl: "center",
        }}
        justify="space-between"
        direction={{
          base: "column",
          xl: "row",
        }}
      >
        <Skeleton
          height="36px"
          width="170px"
        />

        <Flex
          gap={2}
          flexWrap="wrap"
        >
          <Skeleton height="32px" width="190px" />
          <Skeleton height="32px" width="180px" />
          <Skeleton height="32px" width="240px" />
          <Skeleton height="32px" width="32px" />
          <Skeleton height="32px" width="32px" />
          <Skeleton height="32px" width="150px" />
        </Flex>
      </Flex>

      <SimpleGrid
        columns={{
          base: 1,
          sm: 2,
          xl: 4,
        }}
        gap={4}
        mb={4}
      >
        {Array.from(
          { length: 4 },
          (_, index) => (
            <KpiSkeleton key={index} />
          ),
        )}
      </SimpleGrid>

      <Box mb={4}>
        <ChartSkeleton height="320px" />
      </Box>

      <SimpleGrid
        columns={{
          base: 1,
          xl: 2,
        }}
        gap={4}
        mb={4}
      >
        {Array.from(
          { length: 4 },
          (_, index) => (
            <ChartSkeleton key={index} />
          ),
        )}
      </SimpleGrid>
    </Box>
  );
};


export default DashboardSkeleton;
