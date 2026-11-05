// Pure schedule logic for the Today card: no DOM access here, so it can be
// tested on its own. Dates are local calendar dates as "YYYY-MM-DD" strings,
// which compare correctly as plain strings.

export type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface Visit {
  place: string;
  address: string;
  start: string;
  end: string;
  note: string;
  maps: string;
}

export interface Stop extends Visit {
  day: Day;
}

export interface SpecialStop extends Visit {
  date: string;
}

export interface Schedule {
  stops: Stop[];
  specials: SpecialStop[];
  closedUntil: string; // "" when the truck is not closed
  closedNote: string;
}

export interface Upcoming {
  date: string;
  visit: Visit;
}

export type TodayState =
  | { kind: "open"; visits: Visit[] }
  | { kind: "off"; next: Upcoming | null }
  | { kind: "closed"; until: string; note: string; next: Upcoming | null }
  | { kind: "empty" };

const DAYS: Day[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const pad = (n: number): string => String(n).padStart(2, "0");

/** The visitor's local calendar date. Never toISOString(), which is UTC. */
export function localISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(iso: string, n: number): string {
  const d = parse(iso);
  d.setDate(d.getDate() + n);
  return localISODate(d);
}

export function dayOf(iso: string): Day {
  return DAYS[parse(iso).getDay()];
}

function isClosed(s: Schedule, date: string): boolean {
  return s.closedUntil !== "" && date <= s.closedUntil;
}

function rotationOn(s: Schedule, date: string): Stop[] {
  if (isClosed(s, date)) return [];
  const day = dayOf(date);
  return s.stops.filter((x) => x.day === day);
}

export function upcomingSpecials(s: Schedule, today: string): SpecialStop[] {
  return s.specials.filter((x) => x.date >= today);
}

function nextVisit(s: Schedule, today: string): Upcoming | null {
  let best: Upcoming | null = null;
  if (s.stops.length > 0) {
    const from = isClosed(s, today) ? s.closedUntil : today;
    for (let i = 1; i <= 7; i++) {
      const date = addDays(from, i);
      const stops = rotationOn(s, date);
      if (stops.length > 0) {
        best = { date, visit: stops[0] };
        break;
      }
    }
  }
  for (const sp of s.specials) {
    if (sp.date > today && (best === null || sp.date < best.date)) best = { date: sp.date, visit: sp };
  }
  return best;
}

export function todayState(s: Schedule, today: string): TodayState {
  const visits: Visit[] = [...rotationOn(s, today), ...s.specials.filter((x) => x.date === today)];
  if (visits.length > 0) return { kind: "open", visits };
  if (s.stops.length === 0 && upcomingSpecials(s, today).length === 0) return { kind: "empty" };
  const next = nextVisit(s, today);
  if (isClosed(s, today)) return { kind: "closed", until: s.closedUntil, note: s.closedNote, next };
  return { kind: "off", next };
}
