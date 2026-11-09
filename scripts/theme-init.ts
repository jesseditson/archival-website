// Loaded as a blocking classic script in <head>, before the stylesheet, so a
// theme the visitor picked earlier applies before the first paint. No
// import/export: this file is not a module.
try {
  const saved = localStorage.getItem("cafe-theme");
  if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
} catch {
  // Storage blocked: follow the device setting.
}
