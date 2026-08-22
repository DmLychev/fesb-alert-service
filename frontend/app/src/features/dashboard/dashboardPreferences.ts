import type { DashboardRangeKey } from "./types";

const STORAGE_KEY = "dashboard-preferences";

interface DashboardPreferences {
  rangeKey?: DashboardRangeKey;
  liveEnabled?: boolean;
}

const readPreferences = (): DashboardPreferences => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as DashboardPreferences;
  } catch {
    return {};
  }
};

const writePreferences = (preferences: DashboardPreferences) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
};

export const getDashboardPreferences = (): DashboardPreferences =>
  readPreferences();

export const saveDashboardPreference = <K extends keyof DashboardPreferences>(
  key: K,
  value: DashboardPreferences[K],
) => {
  const current = readPreferences();

  writePreferences({
    ...current,
    [key]: value,
  });
};
