// Two jobs for the glass-layer artwork:
// 1. Pause every copy's loops while it is off screen.
// 2. In "How it works", lift the layer that matches the step being read.
//    Only on wide screens, where the stack stays in view beside the steps,
//    and never when the visitor asks for less motion. Otherwise every layer
//    stays lit, which is also what visitors without script see.

const arts = document.querySelectorAll<HTMLElement>(".art");

if ("IntersectionObserver" in window) {
  const visibility = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      entry.target.classList.toggle("is-paused", !entry.isIntersecting);
    }
  });
  arts.forEach((art) => visibility.observe(art));
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const wide = window.matchMedia("(min-width: 56.0625rem)");
const stepsArt = document.querySelector<HTMLElement>(".art--steps");
const steps = Array.from(document.querySelectorAll<HTMLElement>("[data-step]"));

function setActive(n: string | null): void {
  if (!stepsArt) return;
  stepsArt.classList.toggle("has-active", n !== null);
  for (const slab of stepsArt.querySelectorAll<HTMLElement>("[data-slab]")) {
    slab.classList.toggle("is-active", slab.dataset.slab === n);
  }
  for (const step of steps) {
    step.classList.toggle("is-active", step.dataset.step === n);
  }
}

if (stepsArt && steps.length > 0 && "IntersectionObserver" in window) {
  let current: string | null = null;

  const reading = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.target instanceof HTMLElement) {
          current = entry.target.dataset.step ?? null;
        }
      }
      if (wide.matches && !reduceMotion.matches) setActive(current);
    },
    // A step counts as being read while it crosses the middle of the screen.
    { rootMargin: "-45% 0px -45% 0px" },
  );
  steps.forEach((step) => reading.observe(step));

  const update = (): void => setActive(wide.matches && !reduceMotion.matches ? current : null);
  wide.addEventListener("change", update);
  reduceMotion.addEventListener("change", update);
}
