// Runs before first paint on the home page (a blocking classic script, so
// no imports or exports). It hides the opening screen's parts until
// entrance.ts animates them in. If that never happens, the parts come back
// on their own after 2.5 seconds. Visitors who ask for less motion are left
// alone.
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const root = document.documentElement;
  root.classList.add("enter-pending");
  window.setTimeout(() => root.classList.remove("enter-pending"), 2500);
}
