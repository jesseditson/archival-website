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
    // Calculate widths - all images are now the same size
    const containerWidth = Math.min(1128, window.innerWidth - 32); // 70.5rem max, minus padding
    const slideWidth = containerWidth + 32; // Add padding back for slide width
    
    // Simple calculation: center the current slide
    const centerOffset = (window.innerWidth - slideWidth) / 2;
    const translateX = centerOffset - (this.currentIndex * slideWidth);
    
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
