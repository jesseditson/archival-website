document.addEventListener("DOMContentLoaded", function () {
  // Mobile menu
  const menu = document.querySelector(".mobile-menu");
  const openBtn = document.querySelector(".menu-toggle");
  const closeBtn = document.querySelector(".close-menu");

  openBtn.addEventListener("click", () => {
    menu.classList.add("active");
  });

  closeBtn.addEventListener("click", () => {
    menu.classList.remove("active");
  });

  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target) && !openBtn.contains(event.target)) {
      menu.classList.remove("active");
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

  audio.addEventListener("timeupdate", function () {
    if (audio.duration) {
      progressBar.style.width = (audio.currentTime / audio.duration * 100) + "%";
    }
  });

  function playNext() {
    var nextIndex = (currentIndex + 1) % tracks.length;
    loadTrack(nextIndex);
    audio.play();
    playPauseBtn.classList.remove("paused");
  }

  audio.addEventListener("ended", playNext);

  var hasStarted = false;

  function startPlayback() {
    if (hasStarted) return;
    hasStarted = true;
    audio.play().catch(function () {});
    playPauseBtn.classList.remove("paused");
  }

  loadTrack(currentIndex);
  playPauseBtn.classList.add("paused");

  audio.play().then(function () {
    hasStarted = true;
    playPauseBtn.classList.remove("paused");
  }).catch(function () {
    document.addEventListener("click", startPlayback, { once: true });
    document.addEventListener("keydown", startPlayback, { once: true });
  });

  playPauseBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (!hasStarted) {
      startPlayback();
      return;
    }
    if (audio.paused) {
      audio.play();
      playPauseBtn.classList.remove("paused");
    } else {
      audio.pause();
      playPauseBtn.classList.add("paused");
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
