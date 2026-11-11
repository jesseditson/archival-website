// Two jobs for the glass-layer artwork:
// 1. Pause every copy's loops while it is off screen.
// 2. Play "How it works" as a loop: the current step opens and its layer
//    lifts, and a thin bar under the step fills while it is shown. When the
//    bar is full the next step takes over. Choosing a step moves the loop
//    there. The loop holds while the section is off screen or while the
//    visitor points at or tabs into it. Visitors who ask for less motion
//    get no automatic advance, but can still choose a step.

const arts = document.querySelectorAll<HTMLElement>(".art");

if ("IntersectionObserver" in window) {
  const visibility = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      entry.target.classList.toggle("is-paused", !entry.isIntersecting);
    }
  });
  arts.forEach((art) => visibility.observe(art));
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const section = document.querySelector<HTMLElement>(".how");
const stepsArt = section?.querySelector<HTMLElement>(".art--steps") ?? null;
const steps = section ? Array.from(section.querySelectorAll<HTMLElement>("[data-step]")) : [];

function setActive(n: number): void {
  if (!section || !stepsArt) return;
  // Steps past the sixth have no layer of their own; leave the stack lit.
  const slab = stepsArt.querySelector(`[data-slab="${n}"]`);
  stepsArt.classList.toggle("has-active", slab !== null);
  for (const layer of stepsArt.querySelectorAll<HTMLElement>("[data-slab]")) {
    layer.classList.toggle("is-active", layer === slab);
    // Layers above the active one rise with it, so the gaps above it stay
    // even and the extra room opens beneath it.
    layer.classList.toggle("is-above", slab !== null && Number(layer.dataset.slab) < n);
  }
  for (const step of steps) {
    const active = step.dataset.step === String(n);
    // Take the class off first so the progress bar starts over.
    step.classList.remove("is-active");
    if (active) {
      void step.offsetWidth;
      step.classList.add("is-active");
    }
    step.querySelector("button")?.setAttribute("aria-expanded", String(active));
  }
}

if (section && stepsArt && steps.length > 0) {
  let current = 1;
  section.classList.add("is-looping");
  if (!reduceMotion) section.classList.add("is-auto");
  setActive(current);

  for (const step of steps) {
    step.querySelector("button")?.addEventListener("click", () => {
      current = Number(step.dataset.step);
      setActive(current);
    });

    // The bar's fill animation is the timer, so holding the animation holds the loop.
    if (!reduceMotion) {
      step.querySelector<HTMLElement>(".how-step__progress")?.addEventListener("animationend", (event) => {
        // The fill (::after) ends at the same moment; only the timer counts.
        if (event.pseudoElement !== "" || !step.classList.contains("is-active")) return;
        current = (current % steps.length) + 1;
        setActive(current);
      });
    }
  }

  const holds = new Set<string>();
  const hold = (reason: string, on: boolean): void => {
    if (on) holds.add(reason);
    else holds.delete(reason);
    section.classList.toggle("is-holding", holds.size > 0);
  };

  const inner = section.querySelector<HTMLElement>(".how__inner");
  inner?.addEventListener("pointerenter", () => hold("pointer", true));
  inner?.addEventListener("pointerleave", () => hold("pointer", false));
  inner?.addEventListener("focusin", () => hold("focus", true));
  inner?.addEventListener("focusout", (event) => {
    if (!(event.relatedTarget instanceof Node && inner.contains(event.relatedTarget))) hold("focus", false);
  });

  if ("IntersectionObserver" in window) {
    hold("offscreen", true);
    new IntersectionObserver((entries) => {
      for (const entry of entries) hold("offscreen", !entry.isIntersecting);
    }, { threshold: 0.35 }).observe(section);
  }
}
