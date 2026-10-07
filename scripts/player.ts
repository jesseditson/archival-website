// Audio Player Functionality
interface Episode {
  url: string;
  title: string;
}

declare global {
  interface Window {
    podcastPlayer: PodcastPlayer;
  }
}

class PodcastPlayer {
  audioElement: HTMLAudioElement;
  playPauseBtn: HTMLButtonElement;
  currentEpisodeSpan: HTMLSpanElement;
  playIcon: SVGSVGElement;
  pauseIcon: SVGSVGElement;
  volumeBtn: HTMLButtonElement;
  volumeSliderContainer: HTMLDivElement;
  volumeSlider: HTMLInputElement;
  volumeIcon: SVGSVGElement;
  volumeMuteIcon: SVGSVGElement;
  skipBackBtn: HTMLButtonElement;
  skipForwardBtn: HTMLButtonElement;
  progressBar: HTMLDivElement;
  progressFill: HTMLDivElement;
  progressHandle: HTMLDivElement;
  currentTimeSpan: HTMLSpanElement;
  totalTimeSpan: HTMLSpanElement;
  currentEpisode: Episode | null;
  isPlaying: boolean;
  isMuted: boolean;
  previousVolume: number;
  isSeeking: boolean;

  constructor() {
    this.audioElement = document.getElementById('audioElement') as HTMLAudioElement;
    this.playPauseBtn = document.getElementById('playPauseBtn') as HTMLButtonElement;
    this.currentEpisodeSpan = document.getElementById('currentEpisode') as HTMLSpanElement;
    this.playIcon = this.playPauseBtn.querySelector('.play-icon') as SVGSVGElement;
    this.pauseIcon = this.playPauseBtn.querySelector('.pause-icon') as SVGSVGElement;

    // Volume controls
    this.volumeBtn = document.getElementById('volumeBtn') as HTMLButtonElement;
    this.volumeSliderContainer = document.getElementById('volumeSliderContainer') as HTMLDivElement;
    this.volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
    this.volumeIcon = this.volumeBtn.querySelector('.volume-icon') as SVGSVGElement;
    this.volumeMuteIcon = this.volumeBtn.querySelector('.volume-mute-icon') as SVGSVGElement;

    // Skip controls
    this.skipBackBtn = document.getElementById('skipBackBtn') as HTMLButtonElement;
    this.skipForwardBtn = document.getElementById('skipForwardBtn') as HTMLButtonElement;

    // Progress controls
    this.progressBar = document.getElementById('progressBar') as HTMLDivElement;
    this.progressFill = document.getElementById('progressFill') as HTMLDivElement;
    this.progressHandle = document.getElementById('progressHandle') as HTMLDivElement;
    this.currentTimeSpan = document.getElementById('currentTime') as HTMLSpanElement;
    this.totalTimeSpan = document.getElementById('totalTime') as HTMLSpanElement;

    this.currentEpisode = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.previousVolume = 100;
    this.isSeeking = false;

    this.init();
  }

  init() {
    // Play/Pause button event listener
    this.playPauseBtn.addEventListener('click', () => {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    });

    // Skip buttons event listeners
    this.skipBackBtn.addEventListener('click', () => {
      this.skip(-15);
    });

    this.skipForwardBtn.addEventListener('click', () => {
      this.skip(30);
    });

    // Volume button event listener
    this.volumeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleVolumeSlider();
    });

    // Volume slider event listener
    this.volumeSlider.addEventListener('input', (e) => {
      const volume = Number((e.target as HTMLInputElement).value) / 100;
      this.audioElement.volume = volume;
      this.updateVolumeIcon(volume);
      if (volume > 0 && this.isMuted) {
        this.isMuted = false;
      }
    });

    // Close volume slider when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.volumeSliderContainer.contains(e.target as Node) &&
          !this.volumeBtn.contains(e.target as Node) &&
          this.volumeSliderContainer.style.display === 'block') {
        this.volumeSliderContainer.style.display = 'none';
      }
    });

    // Audio element event listeners
    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;
      this.updatePlayButton();
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updatePlayButton();
    });

    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
      this.updatePlayButton();
    });

    this.audioElement.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      this.isPlaying = false;
      this.updatePlayButton();
    });

    // Set initial volume
    this.audioElement.volume = 1;

    // Progress bar event listeners
    this.progressBar.addEventListener('click', (e) => {
      this.seek(e);
    });

    this.progressBar.addEventListener('mousedown', (e) => {
      this.isSeeking = true;
      this.seek(e);
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isSeeking) {
        this.seek(e);
      }
    });

    document.addEventListener('mouseup', () => {
      this.isSeeking = false;
    });

    // Time update listener
    this.audioElement.addEventListener('timeupdate', () => {
      this.updateProgress();
    });

    // Duration loaded listener
    this.audioElement.addEventListener('loadedmetadata', () => {
      this.updateTotalTime();
    });
  }

  seek(e: MouseEvent) {
    if (!this.audioElement.duration) return;

    const rect = this.progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = percent * this.audioElement.duration;

    this.audioElement.currentTime = time;
    this.updateProgress();
  }

  updateProgress() {
    if (!this.audioElement.duration) return;

    const percent = (this.audioElement.currentTime / this.audioElement.duration) * 100;
    this.progressFill.style.width = `${percent}%`;
    this.progressHandle.style.left = `${percent}%`;

    this.currentTimeSpan.textContent = this.formatTime(this.audioElement.currentTime);
  }

  updateTotalTime() {
    this.totalTimeSpan.textContent = this.formatTime(this.audioElement.duration);
  }

  formatTime(seconds: number) {
    if (!seconds || isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  toggleVolumeSlider() {
    if (this.volumeSliderContainer.style.display === 'none') {
      this.volumeSliderContainer.style.display = 'block';
    } else {
      this.volumeSliderContainer.style.display = 'none';
    }
  }

  updateVolumeIcon(volume: number) {
    if (volume === 0) {
      this.volumeIcon.style.display = 'none';
      this.volumeMuteIcon.style.display = 'block';
    } else {
      this.volumeIcon.style.display = 'block';
      this.volumeMuteIcon.style.display = 'none';
    }
  }

  skip(seconds: number) {
    if (this.audioElement.src) {
      const newTime = this.audioElement.currentTime + seconds;
      this.audioElement.currentTime = Math.max(0, Math.min(newTime, this.audioElement.duration || 0));
    }
  }

  loadEpisode(audioUrl: string, episodeTitle: string) {
    this.currentEpisode = {
      url: audioUrl,
      title: episodeTitle
    };

    this.audioElement.src = audioUrl;
    this.currentEpisodeSpan.textContent = episodeTitle;

    // Update the "Now Playing" text in the player
    const nowPlayingSpan = document.querySelector('.now-playing');
    if (nowPlayingSpan) {
      nowPlayingSpan.textContent = 'Now Playing:';
    }
  }

  play() {
    if (this.currentEpisode) {
      this.audioElement.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  }

  pause() {
    this.audioElement.pause();
  }

  updatePlayButton() {
    if (this.isPlaying) {
      this.playIcon.style.display = 'none';
      this.pauseIcon.style.display = 'block';
    } else {
      this.playIcon.style.display = 'block';
      this.pauseIcon.style.display = 'none';
    }
  }
}

// ----- Top-level helpers -----

function formatDuration(seconds: number) {
  if (!seconds || !isFinite(seconds) || seconds < 0) return '0:00';

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${minutes}:${pad(secs)}`;
}

function probeDurations() {
  const spans = document.querySelectorAll<HTMLSpanElement>('span.episode-duration[data-duration-src]');
  spans.forEach((span) => {
    if (span.dataset.probed === 'true') return;
    span.dataset.probed = 'true';

    const src = span.dataset.durationSrc;
    if (!src) return;

    const audio = new Audio();
    audio.preload = 'metadata';

    audio.addEventListener('loadedmetadata', () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        span.textContent = formatDuration(audio.duration);
      }
    });

    audio.addEventListener('error', () => {
      // Leave the TOML-supplied value in place
    });

    audio.src = src;
  });
}

let _episodeCardObserver: IntersectionObserver | null = null;

function ensureEpisodeCardObserver() {
  if (_episodeCardObserver) return _episodeCardObserver;

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  _episodeCardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        (entry.target as HTMLElement).style.opacity = '1';
        (entry.target as HTMLElement).style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  return _episodeCardObserver;
}

function attachEpisodeCardAnimations() {
  const observer = ensureEpisodeCardObserver();
  document.querySelectorAll<HTMLElement>('.episode-card:not([data-animated])').forEach((card) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    card.setAttribute('data-animated', 'true');
    observer.observe(card);
  });
}

function runPageEnhancements() {
  probeDurations();
  attachEpisodeCardAnimations();
}

// ----- Play delegation -----

function attachPlayDelegation() {
  document.addEventListener('click', (e) => {
    const trigger = (e.target as Element).closest<HTMLElement>('[data-audio-url]');
    if (!trigger) return;

    const url = trigger.dataset.audioUrl;
    const title = trigger.dataset.episodeTitle;

    if (!url || !title) return;

    e.preventDefault();

    if (window.podcastPlayer) {
      window.podcastPlayer.loadEpisode(url, title);
      window.podcastPlayer.play();
    }
  });

  // Brief loading-state dim on .play-button click (delegated so it survives SPA nav)
  document.addEventListener('click', (e) => {
    const playButton = (e.target as Element).closest<HTMLElement>('.play-button');
    if (!playButton) return;
    playButton.style.opacity = '0.7';
    setTimeout(() => {
      playButton.style.opacity = '1';
    }, 200);
  });

  // Smooth scrolling for in-page anchor links
  document.addEventListener('click', (e) => {
    const anchor = (e.target as Element).closest('a[href^="#"]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
}

// ----- SPA navigation -----

const NAV_ROUTES = [
  { path: '/', name: 'home' },
  { path: '/episodes/', name: 'episodes' },
  { path: '/about/', name: 'about' }
];

function updateActiveNav(path: string) {
  const navLinks = document.querySelectorAll('.main-nav .nav-link');
  if (!navLinks.length) return;

  // Find matching top-level route. Episode detail pages match nothing.
  const match = NAV_ROUTES.find((route) => route.path === path);

  navLinks.forEach((link) => {
    const linkPath = link.getAttribute('href');
    if (match && linkPath === match.path) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

async function navigateTo(url: string, pushState: boolean) {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    console.error('SPA navigation fetch failed:', err);
    window.location.href = url;
    return;
  }

  if (!response.ok) {
    window.location.href = url;
    return;
  }

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const newContent = doc.querySelector('.page-content');
  const currentContent = document.querySelector('.page-content');

  if (!newContent || !currentContent) {
    // Fallback: full navigation
    window.location.href = url;
    return;
  }

  currentContent.replaceWith(newContent);

  // Update document title
  const newTitle = doc.querySelector('title');
  if (newTitle) {
    document.title = newTitle.textContent;
  }

  const targetPath = new URL(url, location.origin).pathname;

  if (pushState) {
    history.pushState(null, '', targetPath);
  }

  window.scrollTo(0, 0);

  runPageEnhancements();
  updateActiveNav(targetPath);
}

function setupSpaNavigation() {
  document.addEventListener('click', (e) => {
    const link = (e.target as Element).closest('a');
    if (!link) return;

    // Allow modifier-key clicks (open in new tab, etc.) and non-primary buttons
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.button !== undefined && e.button !== 0) return;

    if (link.target && link.target !== '' && link.target !== '_self') return;

    const href = link.getAttribute('href');
    if (!href) return;
    if (href === '' || href === '#') return;
    if (href.startsWith('http://') || href.startsWith('https://')) return;
    if (href.startsWith('mailto:')) return;

    e.preventDefault();
    navigateTo(href, true);
  });

  window.addEventListener('popstate', () => {
    navigateTo(location.pathname, false);
  });

  // Initial active nav state
  updateActiveNav(location.pathname);
}

// ----- Bootstrap -----

document.addEventListener('DOMContentLoaded', () => {
  window.podcastPlayer = new PodcastPlayer();
  attachPlayDelegation();
  setupSpaNavigation();
  runPageEnhancements();
});

// ----- Responsive audio player positioning -----

function handleResponsivePlayer() {
  const audioPlayer = document.getElementById('audio-player');

  if (window.innerWidth <= 768) {
    // On mobile, keep fixed positioning at bottom
    if (audioPlayer) {
      audioPlayer.style.position = 'fixed';
      audioPlayer.style.top = 'auto';
      audioPlayer.style.bottom = '10px';
      audioPlayer.style.right = '10px';
      audioPlayer.style.left = '10px';
      audioPlayer.style.margin = '0';
      audioPlayer.style.maxWidth = 'none';
    }
  } else {
    // On desktop, keep fixed positioning at top right
    if (audioPlayer) {
      audioPlayer.style.position = 'fixed';
      audioPlayer.style.top = '20px';
      audioPlayer.style.bottom = 'auto';
      audioPlayer.style.right = '20px';
      audioPlayer.style.left = 'auto';
      audioPlayer.style.margin = '0';
      audioPlayer.style.maxWidth = 'none';
    }
  }
}

// Handle window resize
window.addEventListener('resize', handleResponsivePlayer);
window.addEventListener('load', handleResponsivePlayer);
