// The small-screen menu is a <details> element, so it opens without script.
// This adds what <details> lacks: Escape, a click outside, or choosing a
// link closes it, and focus returns to the button after Escape.

const menu = document.querySelector<HTMLDetailsElement>("details.menu");

if (menu) {
  const button = menu.querySelector<HTMLElement>("summary");

  const close = (returnFocus: boolean): void => {
    if (!menu.open) return;
    menu.open = false;
    if (returnFocus) button?.focus();
  };

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close(true);
  });

  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !menu.contains(event.target)) close(false);
  });

  menu.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest(".menu-panel a")) close(false);
  });
}
