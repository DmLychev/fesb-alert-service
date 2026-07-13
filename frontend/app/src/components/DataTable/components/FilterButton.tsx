import { Button } from "@chakra-ui/react";
import type { FilterButtonProps } from "../types";

const FilterButton = ({
  isOpen,
  activeFiltersCount,
  onToggle,
}: FilterButtonProps) => {
  return (
    <Button size="sm" variant={isOpen ? "solid" : "outline"} onClick={onToggle}>
      Фильтр {activeFiltersCount > 0 && `(${activeFiltersCount})`}
    </Button>
  );
};

export default FilterButton;
