import { useEffect, useState } from "react";
import type { TablePreferences } from "../types";
import { default_table_preferences } from "../constants";

const useTablePreferences = (
  storageKey: string,
  defaults: TablePreferences = default_table_preferences,
) => {
  const [preferences, setPreferences] = useState<TablePreferences>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return defaults;

      const current = JSON.parse(saved);
      if (current.version !== defaults.version) return defaults;

      return { ...defaults, ...current };
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  }, [storageKey, preferences]);

  const updatePreferences = <k extends keyof TablePreferences>(
    key: k,
    value: TablePreferences[k],
  ) => setPreferences((prev) => ({ ...prev, [key]: value }));

  const resetPreferences = () => setPreferences(defaults);

  return {
    preferences,
    updatePreferences,
    resetPreferences,
  };
};

export default useTablePreferences;
