document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("myVideo") as HTMLVideoElement | null;
  const container = document.querySelector(
    ".video-container"
  ) as HTMLDivElement | null;
  const masthead = document.querySelector(".masthead") as HTMLDivElement | null;
  // Bail out cleanly when the page has no <video> (e.g. user hasn't
  // uploaded one yet, or on the 404 page where the layout is loaded
  // but no video element exists).
  if (!video || !container || !masthead) return;

  // Respect the user's motion preference — the bias-lighting effect
  // re-paints a blurred radial gradient every frame from the video's
  // average color. That's exactly the kind of background animation
  // motion-sensitive users opt out of.
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReducedMotion) return;

  const canvas = document.createElement("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  video.addEventListener("play", () => {
    const updateBiasLighting = () => {
      if (video.paused || video.ended) {
        masthead.style.setProperty("color", "rgba(255, 255, 255, 1)");
        return;
      }

      // Set canvas size to match the video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame onto the canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get the pixel data from the center of the video frame
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const length = frame.data.length;
      let r = 0,
        g = 0,
        b = 0;

      for (let i = 0; i < length; i += 4) {
        r += frame.data[i];
        g += frame.data[i + 1];
        b += frame.data[i + 2];
      }

      // Calculate average color
      r = Math.floor(r / (length / 4));
      g = Math.floor(g / (length / 4));
      b = Math.floor(b / (length / 4));

      // Update the bias lighting color
      container.style.setProperty(
        "--bias-lighting-color",
        `rgba(${r}, ${g}, ${b}, 0.5)`
      );

      // Update masthead color if bright enough
      if (r + g + b > 42) {
        masthead.style.setProperty("color", `rgba(${r}, ${g}, ${b}, 1)`);
      } else {
        masthead.style.setProperty("color", "rgba(14, 14, 14, 1)");
      }

      const beforeElement = document.querySelector(
        "#video-section::before"
      ) as HTMLElement;
      if (beforeElement) {
        beforeElement.style.background = `radial-gradient(circle, rgba(${r}, ${g}, ${b}, 0.5) 0%, rgba(0, 0, 0, 0) 70%)`;
      }

      requestAnimationFrame(updateBiasLighting);
    };

    updateBiasLighting();
  });
});

if (DEV) {
  console.log("Dev Mode enabled");
  // ESBuild watch
  new EventSource("/esbuild").addEventListener("change", () =>
    location.reload()
  );
}
