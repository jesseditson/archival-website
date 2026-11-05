// Fills the Today card, highlights today's row, hides past special stops and
// applies a closure, all in the visitor's local time. The page is built ahead
// of time, so only the browser knows what today is. Motion lives in CSS.
import { dayOf, localISODate, todayState, upcomingSpecials } from "./schedule.js";
import type { Schedule, Upcoming, Visit } from "./schedule.js";

const DAY_NAMES: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a: string, b: string): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);
}

function when(v: Visit): string {
  if (v.start && v.end) return `${v.start} to ${v.end}`;
  if (v.start) return `From ${v.start}`;
  if (v.end) return `Until ${v.end}`;
  return "";
}

/** "Tomorrow", "Wednesday", or "Sat, Apr 17" further out. */
function dayLabel(today: string, date: string): string {
  const gap = daysBetween(today, date);
  if (gap === 1) return "Tomorrow";
  if (gap < 7) return DAY_NAMES[dayOf(date)];
  return parse(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function longDate(iso: string): string {
  return parse(iso).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function el(tag: string, cls: string, text: string): HTMLElement {
  const e = document.createElement(tag);
  e.className = cls;
  e.textContent = text;
  return e;
}

function directions(v: Visit): HTMLElement | null {
  if (!v.maps) return null;
  const a = el("a", "button button-light today-directions", "Get directions") as HTMLAnchorElement;
  a.href = v.maps;
  return a;
}

function visitItem(v: Visit, whenText: string): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "today-item";
  if (whenText) li.append(el("p", "today-when", whenText));
  li.append(el("p", "today-place", v.place));
  if (v.note) li.append(el("p", "today-note", v.note));
  const link = directions(v);
  if (link) li.append(link);
  return li;
}

function nextItem(today: string, next: Upcoming | null): HTMLLIElement | null {
  if (!next) return null;
  const time = when(next.visit);
  return visitItem(next.visit, `Next stop: ${dayLabel(today, next.date)}${time ? `, ${time}` : ""}`);
}

function run(): void {
  const dataEl = document.getElementById("schedule-data");
  const card = document.getElementById("today");
  if (!dataEl || !card) return;
  const schedule = JSON.parse(dataEl.textContent ?? "{}") as Schedule;
  const today = localISODate(new Date());
  const state = todayState(schedule, today);
  const closed = schedule.closedUntil !== "" && today <= schedule.closedUntil;

  // Week table and closure notice.
  const week = document.getElementById("week");
  week?.querySelector(`tr[data-day="${dayOf(today)}"]`)?.classList.add("is-today");
  if (closed) week?.classList.add("is-closed");
  week?.querySelectorAll<HTMLElement>(".closure").forEach((c) => {
    if (!closed) c.hidden = true;
  });

  // Special stops: drop past dates, and the section once none are left.
  const keep = new Set(upcomingSpecials(schedule, today).map((s) => s.date));
  document.querySelectorAll<HTMLElement>(".special").forEach((li) => {
    if (!keep.has(li.dataset.date ?? "")) li.remove();
  });
  document.querySelectorAll<HTMLElement>(".specials").forEach((sec) => {
    if (!sec.querySelector(".special")) sec.remove();
  });

  // Today card.
  document.querySelectorAll<HTMLElement>(".today-fallback").forEach((f) => (f.hidden = true));
  if (state.kind === "empty") return;
  const label = card.querySelector(".today-label");
  const list = card.querySelector(".today-list");
  if (!label || !list) return;
  list.replaceChildren();
  if (state.kind === "open") {
    label.textContent = "Today";
    for (const v of state.visits) list.append(visitItem(v, when(v)));
  } else if (state.kind === "off") {
    label.textContent = "Off today";
    const n = nextItem(today, state.next);
    if (n) list.append(n);
  } else {
    label.textContent = `Closed until ${longDate(state.until)}`;
    if (state.note) list.append(el("li", "today-item today-closed-note", state.note));
    const n = nextItem(today, state.next);
    if (n) list.append(n);
  }
  card.classList.add(`is-${state.kind}`);
  card.hidden = false;
}

run();
