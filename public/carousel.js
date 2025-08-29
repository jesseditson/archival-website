class ImageCarousel {
  constructor(carouselElement) {
    this.carousel = carouselElement;
    this.track = this.carousel.querySelector('.carousel-track');
    this.slides = this.carousel.querySelectorAll('.carousel-slide');
    this.currentIndex = 0;
    this.totalSlides = this.slides.length;
    
    // Touch/swipe variables
    this.startX = 0;
    this.currentX = 0;
    this.isDragging = false;
    this.threshold = 50;
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.updateCarousel();
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.updateCarousel();
    });
  }
  
  setupEventListeners() {
    // Click events for slides
    this.slides.forEach((slide, index) => {
      slide.addEventListener('click', (e) => {
        e.preventDefault();
        if (index !== this.currentIndex) {
          this.goToSlide(index);
        }
      });
    });
    
    // Touch events for mobile swiping
    this.carousel.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.carousel.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.carousel.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    
    // Mouse wheel events for trackpad
    this.carousel.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    
    // Keyboard navigation
    this.carousel.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.carousel.setAttribute('tabindex', '0');
  }
  
  handleTouchStart(e) {
    this.startX = e.touches[0].clientX;
    this.isDragging = true;
  }
  
  handleTouchMove(e) {
    if (!this.isDragging) return;
    
    this.currentX = e.touches[0].clientX;
    const diffX = this.startX - this.currentX;
    
    if (Math.abs(diffX) > 10) {
      e.preventDefault();
    }
  }
  
  handleTouchEnd(e) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    const diffX = this.startX - this.currentX;
    
    if (Math.abs(diffX) > this.threshold) {
      if (diffX > 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    }
  }
  
  handleWheel(e) {
    // Only handle horizontal scrolling, let vertical scroll work normally
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      
      // Debounce wheel events
      if (this.wheelTimeout) {
        clearTimeout(this.wheelTimeout);
      }
      
      this.wheelTimeout = setTimeout(() => {
        if (e.deltaX > 10) {
          this.nextSlide();
        } else if (e.deltaX < -10) {
          this.prevSlide();
        }
      }, 50);
    }
  }
  
  handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.prevSlide();
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.nextSlide();
        break;
    }
  }
  
  goToSlide(index) {
    if (index >= 0 && index < this.totalSlides) {
      this.currentIndex = index;
      this.updateCarousel();
    }
  }
  
  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.totalSlides;
    this.updateCarousel();
  }
  
  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.totalSlides) % this.totalSlides;
    this.updateCarousel();
  }
  
  updateCarousel() {
    // Get the actual image width from CSS calculation
    const viewportWidth = window.innerWidth;
    
    // Calculate image width and slide spacing based on viewport
    let imageWidth, slideSpacing;
    
    if (viewportWidth <= 600) {
      // Mobile: Show significant portions of adjacent slides with proper spacing
      imageWidth = viewportWidth * 0.7; // 70% of viewport for main image
      slideSpacing = viewportWidth * 0.04; // 4vw total spacing (2vw padding on each side)
    } else if (viewportWidth <= 900) {
      // Small tablet: Show some adjacent slides
      imageWidth = Math.min(600, viewportWidth * 0.8);
      slideSpacing = 24;
    } else if (viewportWidth <= 1200) {
      // Large tablet: Standard spacing
      imageWidth = Math.min(960, viewportWidth - 32);
      slideSpacing = 32;
    } else {
      // Desktop: Full size
      imageWidth = Math.min(1128, viewportWidth - 32);
      slideSpacing = 32;
    }
    
    // Calculate slide width including spacing
    const slideWidth = imageWidth + slideSpacing;
    
    // Center the current slide with bounds checking
    const trackWidth = this.totalSlides * slideWidth;
    
    // Calculate center offset to align with page content
    let centerOffset;
    if (viewportWidth <= 600) {
      // On mobile, simply center the image in the viewport
      centerOffset = (viewportWidth - imageWidth) / 2;
    } else {
      // On larger screens, align with the main container
      const containerMaxWidth = Math.min(1128, viewportWidth - 32); // 70.5rem max, minus padding
      const containerOffset = (viewportWidth - containerMaxWidth) / 2;
      centerOffset = containerOffset + (containerMaxWidth - imageWidth) / 2;
    }
    
    // Calculate the ideal position to center the current slide
    let translateX = centerOffset - (this.currentIndex * slideWidth);
    
    // Apply bounds checking to prevent over-scrolling
    const maxTranslateX = centerOffset; // Don't scroll past the first slide
    const minTranslateX = centerOffset - ((this.totalSlides - 1) * slideWidth); // Position last slide centered
    
    // Only apply bounds if we have enough slides to warrant it
    if (trackWidth > viewportWidth) {
      translateX = Math.max(minTranslateX, Math.min(maxTranslateX, translateX));
    }
    
    this.track.style.transform = `translateX(${translateX}px)`;
    
    // Update active states
    this.slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === this.currentIndex);
    });
  }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const carouselElement = document.getElementById('imageCarousel');
  if (carouselElement) {
    new ImageCarousel(carouselElement);
  }
});
