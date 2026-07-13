import { useState } from "react";
import type { TableUiState } from "../types";

const useUiState = (defaults: TableUiState) => {
  const [uiState, setUiState] = useState<TableUiState>(defaults);

  const updateUiState = <k extends keyof TableUiState>(
    key: k,
    value: TableUiState[k] | ((prev: TableUiState[k]) => TableUiState[k]),
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
