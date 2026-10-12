import bellData from './data/bell-schedules.json';
import type { AppSettings } from './storage';

export type ScheduleBlock = {
  id: string;
  period: string;
  name: string;
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
  role: 'class' | 'lunch' | 'advisory' | 'free' | 'event';
  half?: 'A' | 'B';
  anchor?: string;
};

export type Timeline = {
  dateKey: string;
  dateLabel: string;
  scheduleLabel: string;
  blocks: ScheduleBlock[];
  isSchoolDay: boolean;
};

export type Moment = {
  label: string;
  detail: string;
  countdownLabel: string;
  secondsRemaining: number;
};

type BellEntry = { period: string; start: string; end: string };
type BellSchedule = { family: string; displayName: string; fullBlocks: BellEntry[]; abBlocks?: Array<BellEntry & { half?: string }> };

const schedules = bellData.schedules as BellSchedule[];
const yearStart = '2026-08-12';
const yearEnd = '2027-05-26';

export function getChicagoDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function resolveToday(
  dateKey: string,
  remoteDates: Record<string, string>,
  customNames: Record<string, string> = {},
  settings?: Pick<AppSettings, 'extensionModes' | 'advisoryPeriods'>,
): Timeline {
  const date = new Date(`${dateKey}T12:00:00`);
  const weekday = date.getDay();
  const remoteLabel = remoteDates[dateKey];
  const isWeekend = weekday === 0 || weekday === 6;
  const outsideYear = dateKey < yearStart || dateKey > yearEnd;
  const noSchool = isWeekend || outsideYear || remoteLabel === 'No School' ||
    remoteLabel === 'Asynchronous' || remoteLabel === 'Summer';
  const schedule = noSchool ? undefined : selectSchedule(remoteLabel);
  const scheduleLabel = outsideYear ? 'Outside school year' :
    remoteLabel ?? (isWeekend ? 'No School' : 'Standard Schedule');
  const blocks = schedule ? personalizedBlocks(schedule, customNames, settings) : [];

  return {
    dateKey,
    dateLabel: date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    scheduleLabel,
    blocks,
    isSchoolDay: blocks.length > 0,
  };
}

function personalizedBlocks(
  schedule: BellSchedule,
  customNames: Record<string, string>,
  settings: Pick<AppSettings, 'extensionModes' | 'advisoryPeriods'> = {
    extensionModes: {}, advisoryPeriods: {},
  },
): ScheduleBlock[] {
  const plans: Record<string, { A: Slot; B: Slot }> = {};
  schedule.fullBlocks.forEach((block) => {
    if (!/^\d+$/.test(block.period)) return;
    const standard: Slot = { role: 'class', anchor: block.period };
    plans[block.period] = { A: standard, B: standard };
  });
  Object.keys(plans).forEach((period) => {
    const name = customNames[period]?.trim().toLowerCase() ?? '';
    if (name === 'lunch' || name.includes('lunch')) plans[period] = { A: { role: 'lunch' }, B: { role: 'lunch' } };
    if (name === 'free' || name.includes('free period')) plans[period] = { A: { role: 'free' }, B: { role: 'free' } };
    if (settings.advisoryPeriods[period] && (name === 'lunch' || name.includes('lunch'))) {
      plans[period] = { A: { role: 'advisory' }, B: { role: 'lunch' } };
    }
  });
  Object.keys(plans).forEach((period) => {
    const number = Number(period);
    const mode = settings.extensionModes[period] ?? 'none';
    if (mode === 'backward' && plans[String(number - 1)]) plans[String(number - 1)].B = { role: 'class', anchor: period };
    if (mode === 'forward' && plans[String(number + 1)]) plans[String(number + 1)].A = { role: 'class', anchor: period };
  });
  const result: ScheduleBlock[] = [];
  for (const block of schedule.fullBlocks) {
    if (!/^\d+$/.test(block.period)) {
      result.push(makeBlock(block, block.period === 'activity' || block.period === 'assembly' ? 'event' : 'event', block.period, block.period));
      continue;
    }
    const halves = schedule.abBlocks?.filter((half) => half.period === block.period) ?? [];
    const plan = plans[block.period];
    if (halves.length !== 2 || plan.A.role === plan.B.role && plan.A.anchor === plan.B.anchor) {
      const slot = plan.A;
      result.push(makeBlock(block, slot.role, slot.anchor ?? block.period, block.period));
      continue;
    }
    for (const half of halves) {
      const key = half.half === 'A' ? 'A' : 'B';
      const slot = plan[key];
      result.push(makeBlock(half, slot.role, slot.anchor ?? block.period, `${block.period}${key}`));
    }
  }
  return mergeClassRuns(result, customNames);
}

type Slot = { role: ScheduleBlock['role']; anchor?: string };
type BellBlock = BellEntry & { half?: string };

function makeBlock(block: BellBlock, role: ScheduleBlock['role'], anchor: string, id: string): ScheduleBlock {
  return {
    id,
    period: anchor,
    name: role === 'class' ? defaultPeriodName(anchor) : role === 'lunch' ? 'Lunch' : role === 'advisory' ? 'Advisory' : role === 'free' ? 'Free' : anchor === 'activity' ? 'Activity' : anchor === 'assembly' ? 'Assembly' : anchor,
    start: block.start,
    end: block.end,
    startMinutes: toMinutes(block.start),
    endMinutes: toMinutes(block.end),
    role,
    half: block.half === 'A' || block.half === 'B' ? block.half : undefined,
    anchor,
  };
}

function mergeClassRuns(blocks: ScheduleBlock[], customNames: Record<string, string>) {
  const merged: ScheduleBlock[] = [];
  for (const block of blocks) {
    const previous = merged[merged.length - 1];
    if (previous?.role === 'class' && block.role === 'class' && previous.anchor === block.anchor) {
      previous.end = block.end;
      previous.endMinutes = block.endMinutes;
      previous.id = `${previous.id}+${block.id}`;
      previous.half = undefined;
    } else {
      if (block.role === 'class' && block.anchor) block.name = customNames[block.anchor] || defaultPeriodName(block.anchor);
      merged.push(block);
    }

  }
  return merged;
}

function defaultPeriodName(value: string) {
  const period = Number(value);
  if (!Number.isInteger(period)) return value;
  const suffix = period === 1 ? 'st' : period === 2 ? 'nd' : period === 3 ? 'rd' : 'th';
  return `${period}${suffix} Period`;
}

function selectSchedule(label?: string) {
  const normalized = (label ?? '').toLowerCase();
  if (normalized.includes('late')) return schedules.find((item) => item.family === 'lateArrival');
  if (normalized.includes('activity')) return schedules.find((item) => item.family === 'activityPeriod');
  if (normalized.includes('assembly')) return schedules.find((item) => item.family === 'pmAssembly');
  if (normalized.includes('odyssey')) return schedules.find((item) => item.family === 'odyssey');
  if (normalized.includes('early dismissal')) return schedules.find((item) => item.family === 'earlyDismissal');
  return schedules.find((item) => item.family === 'standard');
}

export function getMomentState(now: Date, timeline: Timeline, nextSchoolDay?: Timeline): Moment {
  if (!timeline.isSchoolDay) {
    return { label: 'No classes today', detail: timeline.scheduleLabel, countdownLabel: 'Enjoy your day', secondsRemaining: 0 };
  }
  const chicagoTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(now);
  const hour = Number(chicagoTime.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(chicagoTime.find((part) => part.type === 'minute')?.value ?? 0);
  const currentMinutes = hour * 60 + minute;
  const current = timeline.blocks.find((block) => currentMinutes >= block.startMinutes && currentMinutes < block.endMinutes);
  const next = timeline.blocks.find((block) => block.startMinutes > currentMinutes);
  if (current) {
    const secondsRemaining = Math.max(0, (current.endMinutes - currentMinutes) * 60 - now.getSeconds());
    return { label: 'In progress', detail: current.name, countdownLabel: 'until this period ends', secondsRemaining };
  }
  if (next) {
    const secondsRemaining = Math.max(0, (next.startMinutes - currentMinutes) * 60 - now.getSeconds());
    return { label: 'Up next', detail: next.name, countdownLabel: 'until this period starts', secondsRemaining };
  }
  const nextStart = nextSchoolDay?.blocks[0];
  if (!nextStart) {
    return { label: 'School day complete', detail: 'No upcoming school day', countdownLabel: '', secondsRemaining: 0 };
  }
  const chicagoTimeWithSeconds = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(now);
  const currentHour = Number(chicagoTimeWithSeconds.find((part) => part.type === 'hour')?.value ?? 0);
  const currentMinute = Number(chicagoTimeWithSeconds.find((part) => part.type === 'minute')?.value ?? 0);
  const currentSecond = Number(chicagoTimeWithSeconds.find((part) => part.type === 'second')?.value ?? 0);
  const currentDate = new Date(`${timeline.dateKey}T12:00:00`);
  const nextDate = new Date(`${nextSchoolDay.dateKey}T12:00:00`);
  const dayDifference = Math.round((nextDate.getTime() - currentDate.getTime()) / 86400000);
  const secondsRemaining = Math.max(0,
    dayDifference * 86400 + nextStart.startMinutes * 60 -
    (currentHour * 3600 + currentMinute * 60 + currentSecond));
  return { label: 'School starts in', detail: nextSchoolDay.scheduleLabel, countdownLabel: '', secondsRemaining };
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}
