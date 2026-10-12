import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'stevenson.scheduleDates';
const SETTINGS_KEY = 'stevenson.settings';
const ID_KEY = 'stevenson.studentId';
const LUNCH_KEY = 'stevenson.lunchManifest';
const ONE_HOUR = 60 * 60 * 1000;

export type AppSettings = {
  appearance: 'system' | 'light' | 'dark';
  customNames: Record<string, string>;
  extensionModes: Record<string, 'none' | 'forward' | 'backward'>;
  advisoryPeriods: Record<string, boolean>;
};
export type SavedId = { imageUri: string; idNumber: string; name: string; grade: string; schoolYear: string };

export async function loadScheduleCache() {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) return {};
  const value = JSON.parse(raw) as { savedAt: number; dates: Record<string, string> };
  return Date.now() - value.savedAt < 7 * 24 * 60 * 60 * 1000 ? value.dates : {};
}

export async function saveScheduleCache(dates: Record<string, string>) {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), dates }));
}

export async function shouldSync() {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) return true;
  return Date.now() - (JSON.parse(raw) as { savedAt: number }).savedAt >= ONE_HOUR;
}

export async function loadSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (raw) {
    const saved = JSON.parse(raw) as Partial<AppSettings> & {
      earlyStarts?: Record<string, boolean>;
      extendedPeriods?: Record<string, boolean>;
    };
    const extensionModes = saved.extensionModes ?? {};
    Object.keys(saved.extendedPeriods ?? {}).forEach((period) => {
      if (saved.extendedPeriods?.[period]) extensionModes[period] = 'forward';
    });
    Object.keys(saved.earlyStarts ?? {}).forEach((period) => {
      if (saved.earlyStarts?.[period]) extensionModes[period] = 'backward';
    });
    return {
      appearance: 'dark',
      customNames: {},
      advisoryPeriods: {},
      ...saved,
      extensionModes,
    };
  }
  return {
    appearance: 'dark',
    customNames: {},
    extensionModes: {},
    advisoryPeriods: {},
  };
}

export async function saveSettings(settings: AppSettings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function loadSavedId(): Promise<SavedId | null> {
  const raw = await AsyncStorage.getItem(ID_KEY);
  return raw ? JSON.parse(raw) as SavedId : null;
}

export async function saveSavedId(value: SavedId) {
  await AsyncStorage.setItem(ID_KEY, JSON.stringify(value));
}

export async function clearSavedId() {
  await AsyncStorage.removeItem(ID_KEY);
}

export async function saveLunchManifest(manifest: unknown) {
  await AsyncStorage.setItem(LUNCH_KEY, JSON.stringify({ savedAt: Date.now(), manifest }));
}

export async function loadLunchManifest() {
  const raw = await AsyncStorage.getItem(LUNCH_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as { savedAt: number; manifest: unknown };
}
