// The light, dark and system switch in the header. The owner's color_scheme
// is the default; a visitor's choice is kept in localStorage and applied
// before paint by theme-init.ts.

type Scheme = "light" | "dark" | "auto";

const STORAGE_KEY = "byline-scheme";
const BAR_COLOR = { light: "#ffffff", dark: "#15171a" } as const;

const root = document.documentElement;
const group = document.querySelector<HTMLElement>(".scheme-toggle");
const buttons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-scheme-choice]"),
);
const bars = Array.from(
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'),
);

function isScheme(value: unknown): value is Scheme {
  return value === "light" || value === "dark" || value === "auto";
}

function apply(scheme: Scheme): void {
  root.dataset.scheme = scheme;
  for (const bar of bars) {
    const forDark = bar.media.includes("dark");
    if (scheme === "auto") {
      bar.content = forDark ? BAR_COLOR.dark : BAR_COLOR.light;
    } else {
      bar.content = BAR_COLOR[scheme];
    }
  }
  for (const button of buttons) {
    const pressed = button.dataset.schemeChoice === scheme;
    button.setAttribute("aria-pressed", String(pressed));
  }
}

function save(scheme: Scheme): void {
  try {
    localStorage.setItem(STORAGE_KEY, scheme);
  } catch {
    // Storage is blocked: the choice lasts for this page only.
  }
}

if (group) {
  const current = root.dataset.scheme;
  const initial: Scheme = isScheme(current) ? current : "auto";
  // Sync the buttons and browser bar color, but keep the owner's server-set
  // bar colors when nothing was chosen and the default is in effect.
  if (initial !== root.dataset.defaultScheme) apply(initial);
  else {
    for (const button of buttons) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.schemeChoice === initial),
      );
    }
  }

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const choice = button.dataset.schemeChoice;
      if (!isScheme(choice)) return;
      apply(choice);
      save(choice);
    });
  }

  // Keep other open tabs of the site in step.
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY && isScheme(event.newValue)) {
      apply(event.newValue);
    }
  });

  group.hidden = false;
}
