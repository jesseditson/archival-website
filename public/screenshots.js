const AUTO_CYCLE_INTERVAL = 10000;

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const animationTiming = {
  duration: prefersReducedMotion ? 0 : 400,
  iterations: 1,
  easing: "ease-in-out",
};
const hideScreenshotAnimation = [
  { clipPath: "xywh(0 0 100% 100%)", opacity: 1, transform: "scale(1)" },
  { clipPath: "xywh(0 0 0% 100%)", opacity: 0.2, transform: "scale(0.8)" },
];
const showScreenshotAnimation = [
  { clipPath: "xywh(100% 0 100% 100%)", opacity: 0.2, transform: "scale(0.8)" },
  { clipPath: "xywh(0 0 100% 100%)", opacity: 1, transform: "scale(1)" },
];

const windowPromise = new Promise((resolve) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => resolve());
  } else {
    resolve();
  }
});

windowPromise.then(() => {
  const carousel = document.querySelector(".screenshots");
  if (!carousel) {
    return;
  }
  const screenshots = Array.from(
    carousel.querySelectorAll(".screenshot-container")
  );
  // With 0 or 1 screenshots there's nothing to cycle through and no
  // page icons exist — bail out before wiring up handlers.
  if (screenshots.length < 2) {
    return;
  }
  const pageIcons = Array.from(
    carousel.querySelectorAll(".screenshot-page-icon")
  );

  let currentPage = 0;
  let currentAnimations = [];

  const showPage = (selectedPage) => {
    if (currentPage === selectedPage) {
      return;
    }
    currentAnimations.forEach((anim) => anim.finish());
    pageIcons.forEach((pi) => pi.classList.remove("active"));
    const targetIcon = carousel.querySelector(
      `.screenshot-page-icon[data-page="${selectedPage + 1}"]`
    );
    if (targetIcon) {
      targetIcon.classList.add("active");
    }
    const currentScreenshot = screenshots[currentPage];
    const selectedScreenshot = screenshots[selectedPage];
    selectedScreenshot.classList.remove("hidden");
    const outAnim = currentScreenshot.animate(
      hideScreenshotAnimation,
      animationTiming
    );
    outAnim.finished.then(() => {
      currentScreenshot.classList.add("hidden");
      currentPage = selectedPage;
    });
    currentAnimations = [
      outAnim,
      selectedScreenshot.animate(showScreenshotAnimation, animationTiming),
    ];
  };

  let cycleInterval = prefersReducedMotion
    ? null
    : setInterval(() => {
        let nextPage = currentPage + 1;
        if (nextPage >= screenshots.length) {
          nextPage = 0;
        }
        showPage(nextPage);
      }, AUTO_CYCLE_INTERVAL);

  carousel.addEventListener("click", (evt) => {
    // Don't auto-cycle after a user has interacted
    if (cycleInterval !== null) {
      clearInterval(cycleInterval);
      cycleInterval = null;
    }
    const el = evt.target;
    if (el.classList.contains("screenshot-page-icon")) {
      const selectedPage = Number(el.dataset.page);
      showPage(selectedPage - 1);
    }
  });
});
