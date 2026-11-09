// The light/dark toggle. Without a saved choice the page follows the device
// setting; a click flips the theme and remembers it.
const root = document.documentElement;
const button = document.querySelector<HTMLButtonElement>(".theme-toggle");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
const SIGN = { light: "#173a2c", dark: "#e9c46a" } as const;

type Theme = "light" | "dark";

function effective(): Theme {
  const set = root.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return prefersDark.matches ? "dark" : "light";
}

function sync(): void {
  if (button) button.setAttribute("aria-pressed", String(effective() === "dark"));
}

function setThemeColor(theme: Theme): void {
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.content = SIGN[theme];
  document.head.append(meta);
}

if (button) {
  button.hidden = false;
  sync();
  button.addEventListener("click", () => {
    const next: Theme = effective() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("cafe-theme", next);
    } catch {
      // Storage blocked: the choice lasts for this page view.
    }
    setThemeColor(next);
    sync();
  });
  prefersDark.addEventListener("change", sync);
  if (root.dataset.theme === "light" || root.dataset.theme === "dark") setThemeColor(root.dataset.theme);
}

// Color transitions only after the first paint, so loading never animates.
requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("theme-ready")));
