import { useState } from "react";
import type { TableUIState } from "../types";

const useUiState = (defaults: TableUIState) => {
  const [uiState, setUiState] = useState<TableUIState>(defaults);

  const updateUiState = <k extends keyof TableUIState>(
    key: k,
    value: TableUIState[k] | ((prev: TableUIState[k]) => TableUIState[k]),
  ) => {
    setUiState((prev) => ({
      ...prev,
      [key]:
        typeof value === "function" ? (value as Function)(prev[key]) : value,
    }));
  };

  return { uiState, updateUiState };
};

export default useUiState;
