import { Badge, Button, Text } from "@chakra-ui/react";
import type { FilterButtonProps } from "../types";
import { LuFilter } from "react-icons/lu";

const FilterButton = ({
  isOpen,
  activeFiltersCount,
  onToggle,
}: FilterButtonProps) => {
  return (
    <Button
      aria-label="Фильтры"
      size="sm"
      variant={isOpen ? "solid" : "outline"}
      width={{ base: "36px", md: "132px" }}
      minWidth={{ base: "36px", md: "132px" }}
      paddingInline={{ base: 0, md: 3 }}
      onClick={onToggle}
    >
      <LuFilter /> <Text hideBelow="md">Фильтры</Text>
      {activeFiltersCount > 0 && (
        <Badge colorPalette="blue" size="sm">
          {activeFiltersCount}
        </Badge>
      )}
    </Button>
  );
};

export default FilterButton;
