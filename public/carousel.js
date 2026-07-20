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

    // Wheel/trackpad swipe accumulator
    this.wheelDeltaX = 0;
    this.wheelLocked = false;
    this.wheelTrailing = false;
    this.wheelPeak = 0;
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.updateCarousel();

    // Slide widths depend on each image's natural aspect ratio, which isn't
    // known until the image loads. Recompute centering as they arrive.
    this.slides.forEach((slide) => {
      const img = slide.querySelector('img');
      if (img && !img.complete) {
        img.addEventListener('load', () => this.updateCarousel());
        img.addEventListener('error', () => this.updateCarousel());
      }
    });

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
    // Only handle horizontal swipes; let vertical scroll work normally.
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

    e.preventDefault();

    const absX = Math.abs(e.deltaX);

    // Any wheel event refreshes the settle timer; when the stream (including
    // the OS momentum tail) finally goes quiet, everything resets so the next
    // gesture starts clean. (The original trailing-debounce fired ~50ms after
    // the LAST event, so the carousel stayed frozen mid-swipe and only jumped
    // once the gesture ended.)
    clearTimeout(this.wheelSettleTimeout);
    this.wheelSettleTimeout = setTimeout(() => {
      this.wheelLocked = false;
      this.wheelTrailing = false;
      this.wheelDeltaX = 0;
      this.wheelPeak = 0;
    }, 120);

    // After a slide change we lock to swallow the momentum tail, whose
    // magnitude only ever decays. Track the gesture peak; once we've clearly
    // trailed off (well below the peak) and then the magnitude climbs again,
    // the user has started a fresh flick — re-arm immediately. This is what
    // lets two quick flicks advance two slides even while the first flick's
    // tail is still lingering, without a hard single flick advancing two.
    if (this.wheelLocked) {
      this.wheelPeak = Math.max(this.wheelPeak, absX);
      if (absX < this.wheelPeak * 0.4) {
        this.wheelTrailing = true;
      }
      if (this.wheelTrailing && absX > this.wheelPeak * 0.6) {
        this.wheelLocked = false;
        this.wheelTrailing = false;
        this.wheelPeak = 0;
        this.wheelDeltaX = 0;
      } else {
        return;
      }
    }

    this.wheelDeltaX += e.deltaX;

    if (Math.abs(this.wheelDeltaX) > this.threshold) {
      if (this.wheelDeltaX > 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
      this.wheelDeltaX = 0;
      this.wheelLocked = true;
      this.wheelTrailing = false;
      this.wheelPeak = absX;
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
    const currentSlide = this.slides[this.currentIndex];
    if (!currentSlide) return;

    // Slides can each be a different width (screenshots keep their native
    // aspect ratio), so measure the active slide's real layout position rather
    // than assuming a uniform slide width. offsetLeft/offsetWidth ignore the
    // track's transform, giving us the untransformed layout position; shifting
    // the track by this amount centers the active slide in the viewport.
    const viewportWidth = window.innerWidth;
    const slideCenter = currentSlide.offsetLeft + currentSlide.offsetWidth / 2;
    const translateX = viewportWidth / 2 - slideCenter;

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
