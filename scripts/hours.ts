// Opening-hours logic for the open badge: parse the times the owner typed,
// apply a holiday closure, and decide what the badge says right now. Pure
// functions only, no DOM, so they can be unit tested. The page is built ahead
// of time, so all of this runs in the visitor's browser, in their local time.

export type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface Hours {
  day: Day;
  opens: string;
  closes: string;
}

/** Dates are ISO "YYYY-MM-DD", or "" when unset. */
export interface CafeData {
  hours: Hours[];
  closureStart: string;
  closureEnd: string;
}

/** Minutes after local midnight, open < close. */
export interface Range {
  open: number;
  close: number;
}

export type Badge =
  | { kind: "open"; until: string }
  | { kind: "opens-later"; at: string }
  | { kind: "closed-now"; nextDate: string; at: string }
  | { kind: "closed-today" }
  | { kind: "none" };

const DAYS: Day[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const pad = (n: number): string => String(n).padStart(2, "0");

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** The visitor's local calendar date, never UTC. */
export function localISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dayOf(iso: string): Day {
  return DAYS[parseISO(iso).getDay()];
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return localISODate(d);
}

interface Time {
  minutes: number;
  /** A bare 1 to 12 with no am/pm: morning or afternoon is a guess. */
  ambiguous: boolean;
}

function parseTime(raw: string): Time | null {
  const s = raw.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
  if (s === "noon") return { minutes: 720, ambiguous: false };
  const m = /^(\d{1,2})(?::(\d{2}))? ?(am|pm)?$/.exec(s);
  if (!m) return null;
  const hour = Number(m[1]);
  const min = m[2] === undefined ? 0 : Number(m[2]);
  if (min > 59) return null;
  const suffix = m[3];
  if (suffix) {
    if (hour < 1 || hour > 12) return null;
    const h24 = (hour % 12) + (suffix === "pm" ? 12 : 0);
    return { minutes: h24 * 60 + min, ambiguous: false };
  }
  if (hour > 23) return null;
  const exact = hour >= 13 || hour === 0 || m[1].startsWith("0");
  return { minutes: hour * 60 + min, ambiguous: !exact };
}

/**
 * Reads an opening range as café hours. A bare opening hour is morning (12 is
 * noon); a bare closing hour moves to the afternoon when it would otherwise
 * fall at or before opening, so "7 to 3" is 7am to 3pm. Ranges past midnight
 * are not supported and come back null, as does anything unreadable.
 */
export function parseRange(opens: string, closes: string): Range | null {
  const o = parseTime(opens);
  const c = parseTime(closes);
  if (!o || !c) return null;
  let close = c.minutes;
  if (c.ambiguous && close <= o.minutes && close < 720) close += 720;
  return close > o.minutes ? { open: o.minutes, close } : null;
}

/** Only an end: open-ended into the past (start ""). Only a start: that one day. */
export function closureWindow(d: CafeData): { start: string; end: string } | null {
  if (!d.closureStart && !d.closureEnd) return null;
  return { start: d.closureStart, end: d.closureEnd || d.closureStart };
}

export function closureActive(d: CafeData, today: string): boolean {
  const w = closureWindow(d);
  return w !== null && (w.start === "" || today >= w.start) && today <= w.end;
}

/** The notice shows from the moment it is saved until its last day has passed. */
export function closureNoticeVisible(d: CafeData, today: string): boolean {
  const w = closureWindow(d);
  return w !== null && w.end >= today;
}

/** The first row for a day, or null when the café is closed that day. */
export function rowFor(d: CafeData, day: Day): Hours | null {
  return d.hours.find((h) => h.day === day) ?? null;
}

export function badgeState(d: CafeData, now: Date): Badge {
  const today = localISODate(now);
  if (closureActive(d, today)) return { kind: "closed-today" };
  const row = rowFor(d, dayOf(today));
  if (row) {
    const range = parseRange(row.opens, row.closes);
    if (!range) return { kind: "none" };
    const minutes = now.getHours() * 60 + now.getMinutes();
    if (minutes < range.open) return { kind: "opens-later", at: row.opens };
    if (minutes < range.close) return { kind: "open", until: row.closes };
  }
  for (let i = 1; i <= 7; i++) {
    const date = addDays(today, i);
    if (closureActive(d, date)) continue;
    const next = rowFor(d, dayOf(date));
    if (next && parseRange(next.opens, next.closes)) {
      return { kind: "closed-now", nextDate: date, at: next.opens };
    }
  }
  return { kind: "none" };
}
