// Scroll reveals, the kind-words crossfade and the hero video's manners.
// Without this script everything simply shows: the hiding CSS only applies
// when scripting is on, and this script reveals each block as it scrolls
// into view.

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Reveal each .reveal / .reveal-scale block once, as it enters the screen.
const blocks = Array.from(document.querySelectorAll<HTMLElement>(".reveal, .reveal-scale"));
if (reduce || !("IntersectionObserver" in window)) {
  blocks.forEach((el) => el.classList.add("revealed"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
  );
  blocks.forEach((el) => observer.observe(el));
}

// Kind words: when there is more than one, fade from one to the next every
// few seconds. Paused while the pointer or focus is on them; all quotes
// stay in the page for screen readers, only their opacity changes.
const quotes = document.querySelector<HTMLElement>("[data-quotes]");
const slides = quotes ? Array.from(quotes.querySelectorAll<HTMLElement>(".quote-slide")) : [];
if (quotes && slides.length > 1 && !reduce) {
  quotes.classList.add("is-cycling");
  let current = 0;
  let paused = false;
  slides[0].classList.add("is-active");
  quotes.addEventListener("pointerenter", () => (paused = true));
  quotes.addEventListener("pointerleave", () => (paused = false));
  quotes.addEventListener("focusin", () => (paused = true));
  quotes.addEventListener("focusout", () => (paused = false));
  window.setInterval(() => {
    if (paused || document.hidden) return;
    slides[current].classList.remove("is-active");
    current = (current + 1) % slides.length;
    slides[current].classList.add("is-active");
  }, 7000);
}

// The hero video is decoration: stop it for visitors who ask for less
// motion (the CSS shows the still photo instead).
const video = document.querySelector<HTMLVideoElement>(".hero-video");
if (video && reduce) {
  video.pause();
  video.removeAttribute("autoplay");
}
