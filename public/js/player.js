// Audio Player Functionality
class PodcastPlayer {
  constructor() {
    this.audioElement = document.getElementById('audioElement');
    this.playPauseBtn = document.getElementById('playPauseBtn');
    this.currentEpisodeSpan = document.getElementById('currentEpisode');
    this.playIcon = this.playPauseBtn.querySelector('.play-icon');
    this.pauseIcon = this.playPauseBtn.querySelector('.pause-icon');

    // Volume controls
    this.volumeBtn = document.getElementById('volumeBtn');
    this.volumeSliderContainer = document.getElementById('volumeSliderContainer');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.volumeIcon = this.volumeBtn.querySelector('.volume-icon');
    this.volumeMuteIcon = this.volumeBtn.querySelector('.volume-mute-icon');

    // Skip controls
    this.skipBackBtn = document.getElementById('skipBackBtn');
    this.skipForwardBtn = document.getElementById('skipForwardBtn');

    this.currentEpisode = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.previousVolume = 100;

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
      const volume = e.target.value / 100;
      this.audioElement.volume = volume;
      this.updateVolumeIcon(volume);
      if (volume > 0 && this.isMuted) {
        this.isMuted = false;
      }
    });

    // Close volume slider when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.volumeSliderContainer.contains(e.target) &&
          !this.volumeBtn.contains(e.target) &&
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
  }

  toggleVolumeSlider() {
    if (this.volumeSliderContainer.style.display === 'none') {
      this.volumeSliderContainer.style.display = 'block';
    } else {
      this.volumeSliderContainer.style.display = 'none';
    }
  }

  updateVolumeIcon(volume) {
    if (volume === 0) {
      this.volumeIcon.style.display = 'none';
      this.volumeMuteIcon.style.display = 'block';
    } else {
      this.volumeIcon.style.display = 'block';
      this.volumeMuteIcon.style.display = 'none';
    }
  }

  skip(seconds) {
    if (this.audioElement.src) {
      const newTime = this.audioElement.currentTime + seconds;
      this.audioElement.currentTime = Math.max(0, Math.min(newTime, this.audioElement.duration || 0));
    }
  }

  loadEpisode(audioUrl, episodeTitle) {
    this.currentEpisode = {
      url: audioUrl,
      title: episodeTitle
    };
    
    this.audioElement.src = audioUrl;
    this.currentEpisodeSpan.textContent = episodeTitle;
    
    // Update the "Now Playing" text in the player
    const nowPlayingSpan = document.querySelector('.now-playing');
    nowPlayingSpan.textContent = 'Now Playing:';
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

// Global function to play episodes (called from HTML)
function playEpisode(audioUrl, episodeTitle) {
  if (window.podcastPlayer) {
    window.podcastPlayer.loadEpisode(audioUrl, episodeTitle);
    window.podcastPlayer.play();
  }
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.podcastPlayer = new PodcastPlayer();
  
  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Add loading states for episode cards
  const episodeCards = document.querySelectorAll('.episode-card');
  episodeCards.forEach(card => {
    const playButton = card.querySelector('.play-button');
    if (playButton) {
      playButton.addEventListener('click', function() {
        // Add a brief loading state
        this.style.opacity = '0.7';
        setTimeout(() => {
          this.style.opacity = '1';
        }, 200);
      });
    }
  });
  
  // Handle browse all episodes button
  const browseButton = document.querySelector('.browse-button');
  if (browseButton) {
    browseButton.addEventListener('click', function() {
      // For now, just scroll to top - you can implement navigation later
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
  
  // Add intersection observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  // Observe episode cards for animations
  document.querySelectorAll('.episode-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
  });
});

// Handle responsive audio player positioning
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
