// Audio Player Functionality
class PodcastPlayer {
  constructor() {
    this.audioElement = document.getElementById('audioElement');
    this.playPauseBtn = document.getElementById('playPauseBtn');
    this.currentEpisodeSpan = document.getElementById('currentEpisode');
    this.playIcon = this.playPauseBtn.querySelector('.play-icon');
    this.pauseIcon = this.playPauseBtn.querySelector('.pause-icon');
    
    this.currentEpisode = null;
    this.isPlaying = false;
    
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
  const nav = document.querySelector('.main-nav');
  
  if (window.innerWidth <= 768) {
    // On mobile, position player below navigation
    if (nav && audioPlayer) {
      nav.appendChild(audioPlayer);
      audioPlayer.style.position = 'relative';
      audioPlayer.style.top = 'auto';
      audioPlayer.style.right = 'auto';
      audioPlayer.style.margin = '20px auto';
      audioPlayer.style.maxWidth = '90%';
    }
  } else {
    // On desktop, keep fixed positioning
    if (audioPlayer) {
      document.body.appendChild(audioPlayer);
      audioPlayer.style.position = 'fixed';
      audioPlayer.style.top = '20px';
      audioPlayer.style.right = '20px';
      audioPlayer.style.margin = '0';
      audioPlayer.style.maxWidth = 'none';
    }
  }
}

// Handle window resize
window.addEventListener('resize', handleResponsivePlayer);
window.addEventListener('load', handleResponsivePlayer);
