import {
  Box,
  Card,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";

import {
  LuArrowDown,
  LuArrowUp,
} from "react-icons/lu";


export type DashboardKpiTrendIntent =
  | "higher-is-better"
  | "lower-is-better"
  | "neutral";


export interface DashboardKpiComparison {
  difference: number;
  percentage: number | null;
  intent: DashboardKpiTrendIntent;
}


interface Props {
  title: string;
  value: string;
  secondary?: string;

  valueColor?: string;

  comparison?: DashboardKpiComparison;
}


const formatSignedNumber = (
  value: number,
) => {
  if (value === 0) {
    return "0";
  }

  const formatted =
    Math.abs(value).toLocaleString("ru-RU");

  return value > 0
    ? `+${formatted}`
    : `−${formatted}`;
};


const formatSignedPercentage = (
  value: number,
) => {
  if (value === 0) {
    return "0%";
  }

  const formatted =
    Math.abs(value).toLocaleString(
      "ru-RU",
      {
        maximumFractionDigits: 1,
      },
    );

  return value > 0
    ? `+${formatted}%`
    : `−${formatted}%`;
};


const getTrendColor = (
  difference: number,
  intent: DashboardKpiTrendIntent,
) => {
  if (difference === 0) {
    return "fg.muted";
  }

  /*
   * Traffic volume itself is neither good nor bad.
   */
  if (intent === "neutral") {
    return "blue.fg";
  }

  const increaseIsPositive =
    intent === "higher-is-better";

  const isPositive =
    difference > 0
      ? increaseIsPositive
      : !increaseIsPositive;

  return isPositive
    ? "green.fg"
    : "red.fg";
};


const DashboardKpiCard = ({
  title,
  value,
  secondary,
  valueColor,
  comparison,
}: Props) => {
  const trendColor = comparison
    ? getTrendColor(
        comparison.difference,
        comparison.intent,
      )
    : undefined;

  return (
    <Card.Root
      variant="outline"
      height="full"
      bg="bg.panel"
    >
      <Card.Body>
        <VStack
          align="start"
          gap={1}
        >
          <Text
            fontSize="sm"
            color="fg.muted"
          >
            {title}
          </Text>

          <HStack
            gap={2}
            align="center"
          >
            <Text
              fontSize="3xl"
              fontWeight="semibold"
              lineHeight="1.1"
              color={valueColor}
            >
              {value}
            </Text>

            {comparison &&
              comparison.difference !== 0 && (
                <Box
                  color={trendColor}
                  lineHeight="1"
                >
                  {comparison.difference > 0 ? (
                    <LuArrowUp size={32} />
                  ) : (
                    <LuArrowDown size={32} />
                  )}
                </Box>
              )}
          </HStack>

          {secondary && (
            <Text
              fontSize="sm"
              color="fg.muted"
            >
              {secondary}
            </Text>
          )}

          {comparison && (
            <Text
              fontSize="xs"
              color={trendColor}
            >
              {comparison.difference === 0
                ? "Без изменений к предыдущему периоду"
                : `${formatSignedNumber(
                    comparison.difference,
                  )}${
                    comparison.percentage === null
                      ? ""
                      : ` (${formatSignedPercentage(
                          comparison.percentage,
                        )})`
                  } к предыдущему периоду`}
            </Text>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};


export default DashboardKpiCard;
