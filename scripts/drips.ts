// Runs each heading's paint drips once, the first time it scrolls into view.
// Under reduced motion the CSS draws the drips at full length and this does nothing.
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const headings = document.querySelectorAll<HTMLElement>(".drip-heading");

if (!reduce && "IntersectionObserver" in window) {
  const seen = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        seen.unobserve(entry.target);
      }
    },
    { threshold: 0.6 },
  );
  headings.forEach((h) => seen.observe(h));
} else if (!reduce) {
  headings.forEach((h) => h.classList.add("is-visible"));
}
