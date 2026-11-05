// Lava-lamp blobs: each blob drifts to a random spot, size and shape inside
// its container, then picks another, so no two blobs move in step and the
// pattern never repeats. Static blobs stay in their CSS positions when
// scripts are off or the visitor prefers reduced motion.
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const rand = (min: number, max: number): number => min + Math.random() * (max - min);

function radius(): string {
  const r = (): string => `${Math.round(rand(30, 70))}%`;
  return `${r()} ${r()} ${r()} ${r()} / ${r()} ${r()} ${r()} ${r()}`;
}

interface Pose {
  x: number;
  y: number;
  scale: number;
  rotate: number;
  radius: string;
}

function pose(blob: HTMLElement): Pose {
  const box = blob.parentElement?.getBoundingClientRect();
  const w = box?.width ?? 0;
  const h = box?.height ?? 0;
  const own = blob.getBoundingClientRect();
  // Blobs may poke past the top and sides, but stay clear of the bottom edge,
  // where the banner fades into the wall and a clipped blob would show a flat cut.
  return {
    x: rand(-own.width * 0.4, Math.max(w - own.width * 0.6, 0)) - blob.offsetLeft,
    y: rand(-own.height * 0.4, Math.max(h - own.height * 1.15, 0)) - blob.offsetTop,
    scale: rand(0.75, 1.3),
    rotate: rand(-40, 40),
    radius: radius(),
  };
}

function frame(p: Pose): Keyframe {
  return {
    transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rotate}deg) scale(${p.scale})`,
    borderRadius: p.radius,
  };
}

function drift(blob: HTMLElement, from: Pose): void {
  const to = pose(blob);
  const move = blob.animate([frame(from), frame(to)], {
    duration: rand(9000, 17000),
    easing: "ease-in-out",
    fill: "forwards",
  });
  move.onfinish = () => drift(blob, to);
}

if (!reduce) {
  document.querySelectorAll<HTMLElement>(".lava .blob").forEach((blob) => {
    blob.classList.add("is-drifting");
    drift(blob, { x: 0, y: 0, scale: 1, rotate: 0, radius: getComputedStyle(blob).borderRadius });
  });
}
