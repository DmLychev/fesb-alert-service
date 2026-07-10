import { Button } from "@chakra-ui/react";
import type { FilterButtonProps } from "../types";

const FilterButton = ({
  isFilterPanelOpened,
  activeFiltersCount,
  onFilterButtonClick,
}: FilterButtonProps) => {
  return (
    <Button
      size="sm"
      variant={isFilterPanelOpened ? "solid" : "outline"}
      onClick={() => onFilterButtonClick(!isFilterPanelOpened)}
    >
      Фильтр {activeFiltersCount > 0 && `(${activeFiltersCount})`}
    </Button>
  );
};

export default FilterButton;
