const SCHEDULE_DATES_URL =
  'https://raw.githubusercontent.com/stevenson-space/shs/main/src/data/schedule-dates.json';

export async function fetchScheduleDates(): Promise<Record<string, string>> {
  const response = await fetch(SCHEDULE_DATES_URL);
  if (!response.ok) {
    throw new Error(`Schedule update failed with HTTP ${response.status}`);
  }
  const payload: unknown = await response.json();
  return parseScheduleDates(payload);
}

function parseScheduleDates(payload: unknown): Record<string, string> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Schedule update returned an invalid object');
  }

  const result: Record<string, string> = {};
  for (const [label, dates] of Object.entries(payload)) {
    if (!Array.isArray(dates) || !dates.every((date) => typeof date === 'string')) {
      throw new Error(`Schedule update contains invalid dates for ${label}`);
    }
    for (const value of dates) {
      for (const date of expandDate(value)) {
        result[date] = label;
      }
    }
  }
  return result;
}

function expandDate(value: string): string[] {
  const [start, end = start] = value.split('-').map(parseDate);
  const dates: string[] = [];
  const cursor = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function parseDate(value: string): string {
  const parts = value.trim().split('/');
  if (parts.length !== 3) throw new Error(`Invalid schedule date: ${value}`);
  const [month, day, year] = parts.map(Number);
  if (![month, day, year].every(Number.isInteger)) throw new Error(`Invalid schedule date: ${value}`);
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}
