document.addEventListener("DOMContentLoaded", function () {
  const menu = document.querySelector(".mobile-menu");
  const openBtn = document.querySelector(".menu-toggle");
  const closeBtn = document.querySelector(".close-menu");

  openBtn.addEventListener("click", () => {
    menu.classList.add("active");
  });

  closeBtn.addEventListener("click", () => {
    menu.classList.remove("active");
  });

  // Close menu when clicking outside of it
  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target) && !openBtn.contains(event.target)) {
      menu.classList.remove("active");
    }
  });
});