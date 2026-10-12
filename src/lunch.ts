import manifest from './data/lunch-menu.json';

export type LunchSection = { station: string; items: string[] };
export type LunchDay = { dateKey: string; sections: LunchSection[] };

type Station = { cadence: 'weekly' | 'daily'; data: Array<string | string[] | string[][]> };
export type LunchManifest = {
  validFrom: string;
  validTo: string;
  semesterSwitch: string;
  offset: number;
  stations: Record<string, Station>;
  special: string[][];
};
const stations = manifest.stations as Record<string, Station>;
const lunchBaseUrl = 'https://raw.githubusercontent.com/stevenson-space/shs/main/src/data/lunch-rotating';

export async function fetchLiveLunchManifest(): Promise<LunchManifest> {
  const names = ['comfort', 'mindful', 'sides', 'soup', 'international', 'special'];
  const responses = await Promise.all(names.map(async (name) => {
    const response = await fetch(`${lunchBaseUrl}/${name}.json`);
    if (!response.ok) throw new Error(`Lunch source ${name} returned HTTP ${response.status}`);
    return [name, await response.json()] as const;
  }));
  const liveStations = Object.fromEntries(
    responses
      .filter(([name]) => name !== 'special')
      .map(([name, value]) => {
        if (!isStation(value)) throw new Error(`Lunch source ${name} has an invalid format`);
        return [name, value];
      }),
  );
  const special = responses.find(([name]) => name === 'special')?.[1];
  if (!isSpecial(special)) throw new Error('Lunch source special has an invalid format');
  return { ...manifest, stations: liveStations, special };
}

export function getLunch(dateKey: string, source: LunchManifest = manifest as LunchManifest): LunchDay | null {
  const activeManifest = source;
  const activeStations = activeManifest.stations as Record<string, Station>;
  const date = new Date(`${dateKey}T12:00:00`);
  const weekday = date.getDay();
  if (weekday < 1 || weekday > 5 || dateKey < activeManifest.validFrom || dateKey > activeManifest.validTo) return null;
  const start = new Date(`${activeManifest.validFrom}T12:00:00`);
  const elapsedDays = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const startMondayOffset = (start.getDay() + 6) % 7;
  const week = (Math.floor((elapsedDays + startMondayOffset) / 7) + activeManifest.offset) % 5;
  const weekdayIndex = weekday - 1;
  const sections = Object.entries(activeStations).map(([station, value]) => {
    const weeklyValue = value.data[week];
    const items = value.cadence === 'weekly'
      ? (Array.isArray(weeklyValue) ? weeklyValue : [weeklyValue])
      : (() => {
        if (!Array.isArray(weeklyValue)) return [weeklyValue];
        const dayValue = weeklyValue[weekdayIndex];
        return Array.isArray(dayValue) ? dayValue : [dayValue];
      })();
    return {
      station,
      items: items.filter((item): item is string => typeof item === 'string' && item.length > 0 && !item.startsWith('??')),
    };
  }).filter((section) => section.items.length > 0);
  const special = activeManifest.special[dateKey < activeManifest.semesterSwitch ? 0 : 1][weekdayIndex];
  if (special && !special.startsWith('??')) sections.push({ station: 'special', items: [special] });
  return sections.length ? { dateKey, sections } : null;
}

function isStation(value: unknown): value is Station {
  if (!value || typeof value !== 'object') return false;
  const station = value as Partial<Station>;
  return (station.cadence === 'daily' || station.cadence === 'weekly') && Array.isArray(station.data);
}

function isSpecial(value: unknown): value is string[][] {
  return Array.isArray(value) && value.every((semester) =>
    Array.isArray(semester) && semester.every((item) => typeof item === 'string'),
  );
}
