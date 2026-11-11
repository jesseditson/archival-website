// The opening sequence, played once on load: the header from left to right,
// each headline line rising out of its own mask, the subline, the buttons
// (the main one settling from a touch larger), the numbers one by one, the
// two glass cards, then the customer names. Afterward the page is still.

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
// If this module arrived after entrance-init.ts gave up waiting, the page is
// already showing; replaying the sequence then would hide it again.
const pending = root.classList.contains("enter-pending");

const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

function visible(selector: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => el.getClientRects().length > 0,
  );
}

function play(el: HTMLElement, keyframes: Keyframe[], delay: number, duration: number): void {
  el.animate(keyframes, { delay: delay * 1000, duration: duration * 1000, easing: ease, fill: "backwards" });
}

const rise = (distance: string): Keyframe[] => [
  { opacity: 0, transform: `translateY(${distance})` },
  { opacity: 1, transform: "none" },
];

if (pending && !reduceMotion && typeof Element.prototype.animate === "function") {
  let t = 0;

  visible(".site-header [data-enter], .site-nav a").forEach((el, i) => {
    play(el, rise("-0.5rem"), 0.05 + i * 0.06, 0.8);
  });

  const lines = visible(".headline-line > span");
  t = 0.2;
  lines.forEach((el, i) => {
    play(el, [{ transform: "translateY(105%)" }, { transform: "none" }], t + i * 0.12, 1.1);
  });
  t += lines.length * 0.12 + 0.35;

  visible('[data-enter="sub"]').forEach((el) => play(el, rise("1rem"), t, 0.9));
  t += 0.2;

  visible('[data-enter="cta"]').forEach((el, i) => {
    const frames: Keyframe[] = el.hasAttribute("data-enter-primary")
      ? [
          { opacity: 0, transform: "translateY(0.75rem) scale(1.015)" },
          { opacity: 1, transform: "translateY(0) scale(1.015)", offset: 0.6 },
          { opacity: 1, transform: "none" },
        ]
      : rise("0.75rem");
    play(el, frames, t + i * 0.08, 1);
  });
  t += 0.3;

  visible('[data-enter="stat"]').forEach((el, i) => play(el, rise("0.75rem"), t + i * 0.1, 0.8));
  t += 0.2;

  visible('[data-enter="card"]').forEach((el, i) => {
    play(
      el,
      [
        { opacity: 0, transform: "translateY(1.5rem) scale(0.98)" },
        { opacity: 1, transform: "none" },
      ],
      t + i * 0.15,
      1.1,
    );
  });
  t += 0.45;

  visible('[data-enter="logo"]').forEach((el, i) => play(el, rise("0.5rem"), t + i * 0.08, 0.9));
}

root.classList.remove("enter-pending");
