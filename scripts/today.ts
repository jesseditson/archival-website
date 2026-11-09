// Fills the open badge, highlights today's hours and drops a closure notice
// once it is over, all in the visitor's local time. The page is built ahead
// of time, so only the browser knows what time it is now.
import { addDays, badgeState, closureNoticeVisible, dayOf, localISODate } from "./hours.js";
import type { Badge, CafeData } from "./hours.js";

const WEEKDAY: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function badgeText(b: Badge, today: string): string {
  switch (b.kind) {
    case "open":
      return `Open now, until ${b.until}`;
    case "opens-later":
      return `Opens today at ${b.at}`;
    case "closed-today":
      return "Closed today";
    case "closed-now": {
      const when =
        b.nextDate === addDays(today, 1)
          ? "tomorrow"
          : b.nextDate === addDays(today, 7)
            ? `next ${WEEKDAY[dayOf(b.nextDate)]}`
            : WEEKDAY[dayOf(b.nextDate)];
      return `Closed now, opens ${when} at ${b.at}`;
    }
    case "none":
      return "";
  }
}

function update(data: CafeData): void {
  const now = new Date();
  const today = localISODate(now);

  const badge = document.getElementById("badge");
  if (badge) {
    const b = badgeState(data, now);
    const text = badgeText(b, today);
    badge.textContent = text;
    badge.hidden = text === "";
    badge.dataset.kind = b.kind;
  }

  const day = dayOf(today);
  document.querySelectorAll<HTMLElement>(".hours li[data-day]").forEach((li) => {
    const isToday = li.dataset.day === day;
    li.classList.toggle("is-today", isToday);
    if (isToday) li.setAttribute("aria-current", "date");
    else li.removeAttribute("aria-current");
    const mark = li.querySelector(".hours-today");
    if (isToday && !mark) {
      const span = document.createElement("span");
      span.className = "hours-today";
      span.textContent = "Today";
      li.querySelector(".hours-day")?.append(" ", span);
    } else if (!isToday && mark) {
      mark.remove();
    }
  });

  if (!closureNoticeVisible(data, today)) document.querySelectorAll(".closure").forEach((c) => c.remove());
}

const el = document.getElementById("cafe-data");
if (el) {
  const data = JSON.parse(el.textContent ?? "{}") as CafeData;
  update(data);
  window.setInterval(() => update(data), 60_000);
}
