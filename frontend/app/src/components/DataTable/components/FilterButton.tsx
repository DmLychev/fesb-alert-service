import { Badge, Button, Text } from "@chakra-ui/react";
import { LuFilter } from "react-icons/lu";

interface FilterButtonProps {
  isOpen: boolean;
  activeFiltersCount: number;
  onToggle: () => void;
}

const FilterButton = ({
  isOpen,
  activeFiltersCount,
  onToggle,
}: FilterButtonProps) => {
  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <Button
      aria-label="Фильтры"
      size="sm"
      colorPalette={isOpen || hasActiveFilters ? "blue" : "gray"}
      variant={isOpen ? "subtle" : "outline"}
      width={{ base: activeFiltersCount > 0 ? "72px" : "36px", md: "132px" }}
      minWidth={{ base: activeFiltersCount > 0 ? "72px" : "36px", md: "132px" }}
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
