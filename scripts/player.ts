// One audio element for the whole page. Every play button on the page
// ([data-track]) joins the queue in page order; the player bar appears the
// first time something plays. <html data-playing> lets the CSS spin the
// record while sound is coming out.

const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button[data-track]"));
const bar = document.querySelector<HTMLElement>("[data-player]");

if (buttons.length > 0 && bar) {
  const audio = new Audio();
  audio.preload = "none";

  const titleEl = bar.querySelector<HTMLElement>("[data-player-title]")!;
  const toggle = bar.querySelector<HTMLButtonElement>("[data-player-toggle]")!;
  const prev = bar.querySelector<HTMLButtonElement>("[data-player-prev]")!;
  const next = bar.querySelector<HTMLButtonElement>("[data-player-next]")!;
  const seek = bar.querySelector<HTMLInputElement>("[data-player-seek]")!;
  const currentEl = bar.querySelector<HTMLElement>("[data-player-current]")!;
  const totalEl = bar.querySelector<HTMLElement>("[data-player-total]")!;
  const playAll = document.querySelector<HTMLButtonElement>("[data-play-all]");

  let index = -1;
  let seeking = false;

  const clock = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const rowOf = (button: HTMLButtonElement): HTMLElement | null => button.closest<HTMLElement>("[data-row]");

  const render = (): void => {
    const playing = !audio.paused && !audio.ended;
    document.documentElement.toggleAttribute("data-playing", playing);
    buttons.forEach((button, i) => {
      const current = i === index;
      const on = current && playing;
      const title = button.dataset.title ?? "";
      button.setAttribute("aria-pressed", on ? "true" : "false");
      button.setAttribute("aria-label", `${on ? "Pause" : "Play"} ${title}`);
      button.classList.toggle("is-playing", on);
      rowOf(button)?.classList.toggle("is-current", current);
    });
    toggle.setAttribute("aria-label", playing ? "Pause" : "Play");
    toggle.classList.toggle("is-playing", playing);
    prev.disabled = index <= 0;
    next.disabled = index < 0 || index >= buttons.length - 1;
  };

  const progress = (): void => {
    const total = audio.duration;
    const fraction = Number.isFinite(total) && total > 0 ? audio.currentTime / total : 0;
    if (!seeking) seek.value = String(Math.round(fraction * 1000));
    currentEl.textContent = clock(audio.currentTime);
    totalEl.textContent = clock(total);
    const button = buttons[index];
    const row = button ? rowOf(button) : null;
    row?.style.setProperty("--progress", fraction.toFixed(4));
    bar.style.setProperty("--progress", fraction.toFixed(4));
  };

  const load = (i: number): void => {
    const button = buttons[i];
    if (!button?.dataset.src) return;
    const old = buttons[index];
    if (old) rowOf(old)?.style.removeProperty("--progress");
    index = i;
    audio.src = button.dataset.src;
    titleEl.textContent = button.dataset.title ?? "";
    bar.hidden = false;
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: button.dataset.title ?? "" });
    }
  };

  const play = (i: number): void => {
    if (i !== index) load(i);
    void audio.play().catch(() => render());
  };

  buttons.forEach((button, i) => {
    button.addEventListener("click", () => {
      if (i === index && !audio.paused) audio.pause();
      else play(i);
    });
  });

  playAll?.addEventListener("click", () => play(index >= 0 ? index : 0));
  toggle.addEventListener("click", () => (audio.paused ? play(Math.max(index, 0)) : audio.pause()));
  prev.addEventListener("click", () => index > 0 && play(index - 1));
  next.addEventListener("click", () => index < buttons.length - 1 && play(index + 1));

  seek.addEventListener("input", () => {
    seeking = true;
    if (Number.isFinite(audio.duration)) currentEl.textContent = clock((Number(seek.value) / 1000) * audio.duration);
  });
  seek.addEventListener("change", () => {
    if (Number.isFinite(audio.duration)) audio.currentTime = (Number(seek.value) / 1000) * audio.duration;
    seeking = false;
  });

  audio.addEventListener("play", render);
  audio.addEventListener("pause", render);
  audio.addEventListener("timeupdate", progress);
  audio.addEventListener("loadedmetadata", progress);
  audio.addEventListener("ended", () => {
    if (index < buttons.length - 1) play(index + 1);
    else render();
  });

  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("previoustrack", () => index > 0 && play(index - 1));
    navigator.mediaSession.setActionHandler("nexttrack", () => index < buttons.length - 1 && play(index + 1));
  }

  render();
}
