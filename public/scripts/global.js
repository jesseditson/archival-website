document.addEventListener("DOMContentLoaded", function () {
  // Mobile menu
  const menu = document.querySelector(".mobile-menu");
  const openBtn = document.querySelector(".menu-toggle");
  const closeBtn = document.querySelector(".close-menu");

  function setMenuOpen(open) {
    menu.classList.toggle("active", open);
    openBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  openBtn.addEventListener("click", () => setMenuOpen(true));
  closeBtn.addEventListener("click", () => setMenuOpen(false));

  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target) && !openBtn.contains(event.target)) {
      setMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("active")) {
      setMenuOpen(false);
      openBtn.focus();
    }
  });

  // SPA navigation
  function updateActiveNav(path) {
    var map = { "/": "latest", "/releases": "releases", "/tour": "tour", "/about": "about" };
    var active = map[path] || "";
    document.querySelectorAll(".nav-link, .mobile-nav-link").forEach(function (link) {
      var href = link.getAttribute("href");
      if (map[href] === active) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  function navigateTo(url, pushState) {
    fetch(url).then(function (res) { return res.text(); }).then(function (html) {
      // Parse fetched page from same-origin server-rendered templates
      var doc = new DOMParser().parseFromString(html, "text/html");
      var newContent = doc.querySelector(".page-content");
      var newTitle = doc.querySelector("title");
      var pageContent = document.querySelector(".page-content");
      if (newContent && pageContent) {
        pageContent.replaceWith(newContent);
      }
      if (newTitle) {
        document.title = newTitle.textContent;
      }
      var path = new URL(url, location.origin).pathname;
      updateActiveNav(path);
      if (pushState) {
        history.pushState(null, "", path);
      }
      menu.classList.remove("active");
      window.scrollTo(0, 0);
    });
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest("a");
    if (!link) return;
    var href = link.getAttribute("href");
    if (!href || href === "#" || href.startsWith("http") || href.startsWith("mailto:")) return;
    e.preventDefault();
    navigateTo(href, true);
  });

  window.addEventListener("popstate", function () {
    navigateTo(location.pathname, false);
  });

  // Audio player
  var tracks = window.__tracks || [];
  if (tracks.length === 0) return;

  var playPauseBtn = document.querySelector(".play-pause");
  var nowPlayingLabel = document.querySelector(".now-playing-label");
  var nowPlayingItem = document.querySelector(".now-playing-item");
  var volumeBtn = document.querySelector(".volume");
  var volumeFlyout = document.querySelector(".volume-flyout");
  var volumeSlider = document.querySelector(".volume-slider");
  var progressBar = document.querySelector(".player-progress");

  var currentIndex = Math.floor(Math.random() * tracks.length);
  var audio = new Audio();
  audio.preload = "auto";
  audio.volume = volumeSlider.value / 100;

  function loadTrack(index) {
    currentIndex = index;
    nowPlayingItem.textContent = tracks[currentIndex].title;
    audio.src = tracks[currentIndex].url;
    audio.load();
    progressBar.style.width = "0%";
  }

  // Drive the label and play/pause classes off the audio element's
  // own state events so they stay in sync regardless of cause
  // (button click, track ended, etc.).
  audio.addEventListener("play", function () {
    nowPlayingLabel.textContent = "Now Playing:";
    nowPlayingItem.classList.remove("hidden");
    playPauseBtn.classList.remove("paused");
  });
  audio.addEventListener("pause", function () {
    nowPlayingLabel.textContent = "Press Play";
    nowPlayingItem.classList.add("hidden");
    playPauseBtn.classList.add("paused");
  });

  audio.addEventListener("timeupdate", function () {
    if (audio.duration) {
      progressBar.style.width = (audio.currentTime / audio.duration * 100) + "%";
    }
  });

  audio.addEventListener("ended", function () {
    var nextIndex = (currentIndex + 1) % tracks.length;
    loadTrack(nextIndex);
    audio.play();
  });

  // Initial state: load the first track but stay paused — no autoplay.
  loadTrack(currentIndex);
  nowPlayingLabel.textContent = "Press Play";
  nowPlayingItem.classList.add("hidden");
  playPauseBtn.classList.add("paused");

  playPauseBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  volumeBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    volumeFlyout.classList.toggle("active");
  });

  document.addEventListener("click", function (e) {
    if (!volumeFlyout.contains(e.target) && !volumeBtn.contains(e.target)) {
      volumeFlyout.classList.remove("active");
    }
  });

  volumeSlider.addEventListener("input", function (e) {
    audio.volume = e.target.value / 100;
  });
});
