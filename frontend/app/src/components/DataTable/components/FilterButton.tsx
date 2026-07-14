import { Badge, Button } from "@chakra-ui/react";
import type { FilterButtonProps } from "../types";
import { LuFilter } from "react-icons/lu";

const FilterButton = ({
  isOpen,
  activeFiltersCount,
  onToggle,
}: FilterButtonProps) => {
  return (
    <Button size="sm" variant={isOpen ? "solid" : "outline"} onClick={onToggle}>
      <LuFilter /> Фильтр
      {activeFiltersCount > 0 && (
        <Badge colorPalette="blue" size="sm">
          {activeFiltersCount}
        </Badge>
      )}
    </Button>
  );
};

export default FilterButton;
