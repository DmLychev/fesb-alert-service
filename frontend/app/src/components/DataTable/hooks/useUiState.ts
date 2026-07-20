import { useCallback, useState } from "react";
import type { TableUiState } from "../types";

const useUiState = (defaults: TableUiState) => {
  const [uiState, setUiState] = useState<TableUiState>(defaults);

  const updateUiState = useCallback(
    <k extends keyof TableUiState>(
      key: k,
      value: TableUiState[k] | ((prev: TableUiState[k]) => TableUiState[k]),
    ) => {
      setUiState((prevState) => {
        const prevValue = prevState[key];

        const nextValue =
          typeof value === "function"
            ? (value as (previous: TableUiState[k]) => TableUiState[k])(
                prevValue,
              )
            : value;

        return {
          ...prevState,
          [key]: nextValue,
        };
      });
    },
    [],
  );

  return { uiState, updateUiState };
};

export default useUiState;
