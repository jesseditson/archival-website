// Turns each audio card's native <audio controls> into the styled player:
// a play button, the title, elapsed and total time, and a seek bar. Without
// this script the native controls stay visible and still work.

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const rest = String(whole % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function setUp(card: HTMLElement): void {
  const audio = card.querySelector("audio");
  const ui = card.querySelector<HTMLElement>(".audio-ui");
  const play = card.querySelector<HTMLButtonElement>(".audio-play");
  const seek = card.querySelector<HTMLInputElement>(".audio-seek");
  const current = card.querySelector<HTMLElement>("[data-audio-current]");
  const total = card.querySelector<HTMLElement>("[data-audio-duration]");
  if (!audio || !ui || !play || !seek || !current || !total) return;

  let dragging = false;

  const showProgress = (percent: number): void => {
    seek.value = String(percent);
    seek.style.setProperty("--progress", `${percent}%`);
  };

  const sync = (): void => {
    const duration = audio.duration;
    total.textContent = formatTime(duration);
    current.textContent = formatTime(audio.currentTime);
    seek.setAttribute(
      "aria-valuetext",
      `${formatTime(audio.currentTime)} of ${formatTime(duration)}`,
    );
    if (!dragging && Number.isFinite(duration) && duration > 0) {
      showProgress((audio.currentTime / duration) * 100);
    }
  };

  const syncPlaying = (): void => {
    const playing = !audio.paused;
    card.classList.toggle("is-playing", playing);
    play.setAttribute("aria-label", playing ? "Pause" : "Play");
  };

  play.addEventListener("click", () => {
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  });

  seek.addEventListener("input", () => {
    dragging = true;
    const percent = Number(seek.value);
    showProgress(percent);
    if (Number.isFinite(audio.duration)) {
      audio.currentTime = (percent / 100) * audio.duration;
    }
  });

  seek.addEventListener("change", () => {
    dragging = false;
    sync();
  });

  for (const type of ["loadedmetadata", "durationchange", "timeupdate"]) {
    audio.addEventListener(type, sync);
  }
  audio.addEventListener("play", syncPlaying);
  audio.addEventListener("pause", syncPlaying);
  audio.addEventListener("ended", () => {
    syncPlaying();
    showProgress(0);
    audio.currentTime = 0;
  });

  audio.controls = false;
  audio.hidden = true;
  ui.hidden = false;
  sync();
}

for (const card of document.querySelectorAll<HTMLElement>("[data-audio-card]")) {
  setUp(card);
}
