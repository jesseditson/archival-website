// Applies a visitor's saved color theme before the first paint. Loaded as a
// blocking classic script in <head>, so it has no imports or exports.
// theme-toggle.ts writes the choice; the key must match there.
(() => {
  try {
    const saved = localStorage.getItem("byline-scheme");
    if (saved === "light" || saved === "dark" || saved === "auto") {
      document.documentElement.dataset.scheme = saved;
    }
  } catch {
    // Storage is blocked: keep the owner's default scheme.
  }
})();
