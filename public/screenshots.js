const AUTO_CYCLE_INTERVAL = 10000;

const windowPromise = new Promise((resolve) => {
  if (document.readyState === "loading") {
    // Loading hasn't finished yet
    document.addEventListener("DOMContentLoaded", () => resolve());
  } else {
    // `DOMContentLoaded` has already fired
    resolve();
  }
});

let currentPage = 0;
let currentAnimations = [];
windowPromise.then(() => {
  const pageIcons = Array.from(
    document.querySelectorAll(".screenshot-page-icon")
  );
  const screenshots = Array.from(
    document.querySelectorAll(".screenshot-container")
  );
  const showPage = (selectedPage) => {
    if (currentPage !== selectedPage) {
      currentAnimations.forEach((anim) => anim.finish());
      pageIcons.forEach((pi) => pi.classList.remove("active"));
      document
        .querySelector(`.screenshot-page-icon[data-page="${selectedPage + 1}"]`)
        .classList.add("active");
      const currentScreenshot = screenshots.at(currentPage);
      const selectedScreenshot = screenshots.at(selectedPage);
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
    }
  };
  const totalPages = pageIcons.reduce((c, el) => {
    const pageNum = Number(el.dataset.page);
    if (pageNum > c) {
      c = pageNum;
    }
    return c;
  }, 0);
  document.querySelector(".screenshots").addEventListener("click", (evt) => {
    const el = evt.target;
    // Don't auto-cycle after a user has interacted
    clearInterval(cycleInterval);
    if (el.classList.contains("screenshot-page-icon")) {
      const selectedPage = Number(el.dataset.page);
      showPage(selectedPage - 1);
    }
  });

  const cycleInterval = setInterval(() => {
    let nextPage = currentPage + 1;
    if (nextPage === totalPages) {
      nextPage = 0;
    }
    showPage(nextPage);
  }, AUTO_CYCLE_INTERVAL);
});

const animationTiming = {
  duration: 400,
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
