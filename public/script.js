// ==================== Photo Gallery State ====================
let galleryImages = [];
let currentImageIndex = 0;
let touchStartX = 0;
let touchEndX = 0;

// ==================== Initialization ====================
window.onload = function() {
    initializeGallery();
    initializeLightbox();
    initializeThemeToggle();
    animateGalleryEntrance();
};

// ==================== Gallery Initialization ====================
function initializeGallery() {
    const photoItems = document.querySelectorAll(".photo-item");

    // Build gallery images array
    galleryImages = Array.from(photoItems).map((item, index) => ({
        src: item.getAttribute('data-src'),
        title: item.getAttribute('data-title') || '',
        index: index
    }));

    // Add click listeners to photo items
    photoItems.forEach((item, index) => {
        item.addEventListener("click", function() {
            openLightbox(index);
        });
    });

    // Lazy load images using Intersection Observer
    setupLazyLoading(photoItems);
}

// ==================== Lazy Loading ====================
function setupLazyLoading(photoItems) {
    const observerOptions = {
        root: null,
        rootMargin: '100px',
        threshold: 0.01
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target.querySelector('img');

                // Only load if not already loaded
                if (img && !img.complete) {
                    img.src = img.src; // Trigger load
                }

                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    photoItems.forEach(item => {
        observer.observe(item);
    });
}

// ==================== Gallery Entrance Animation ====================
function animateGalleryEntrance() {
    const photoItems = document.querySelectorAll(".photo-item");

    // Only animate if photo items exist
    if (photoItems.length === 0) return;

    // Updated for Anime.js v4: anime() → animate(), anime.stagger() → stagger()
    animate(photoItems, {
        opacity: [0, 1],
        translateY: [30, 0],
        delay: stagger(50, {start: 100}),
        duration: 400,
        ease: 'outQuad'  // Changed from 'easeOutQuad'
    });
}

// ==================== Lightbox Functions ====================
function initializeLightbox() {
    // Don't generate thumbnails until lightbox is opened (performance optimization)
    setupKeyboardNavigation();
    setupTouchNavigation();
}

function openLightbox(index) {
    currentImageIndex = index;
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const loader = document.querySelector('.lightbox-loader');

    // Show lightbox
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Generate thumbnails on first open only
    const thumbnailsContainer = document.getElementById('lightbox-thumbnails');
    if (thumbnailsContainer.children.length === 0) {
        generateThumbnails();
    }

    // Updated for v4: easing → ease
    animate('.lightbox-backdrop', {
        opacity: [0, 1],
        duration: 250,
        ease: 'outQuad'
    });

    // Show loader
    loader.classList.add('active');
    lightboxImg.style.opacity = '0';

    // Load image
    const img = new Image();
    img.onload = function() {
        lightboxImg.src = galleryImages[currentImageIndex].src;
        lightboxImg.alt = galleryImages[currentImageIndex].title;

        // Hide loader and animate image entrance
        loader.classList.remove('active');

        animate(lightboxImg, {
            opacity: [0, 1],
            scale: [0.9, 1],
            duration: 350,
            ease: 'outQuad'
        });

        updateLightboxInfo();
        updateThumbnails();
        preloadAdjacentImages();
    };

    img.src = galleryImages[currentImageIndex].src;

    // Animate controls entrance
    animateLightboxControls();
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    // Animate exit
    animate(lightboxImg, {
        opacity: 0,
        scale: 0.8,
        duration: 300,
        ease: 'inQuad'  // Changed from 'easeInQuad'
    });

    animate('.lightbox-backdrop', {
        opacity: 0,
        duration: 300,
        ease: 'inQuad',
        onComplete: function() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Expose functions globally for inline event handlers
window.closeLightbox = closeLightbox;

function navigateLightbox(direction) {
    const lightboxImg = document.getElementById('lightbox-img');
    const loader = document.querySelector('.lightbox-loader');

    // Calculate new index with wrapping
    currentImageIndex = (currentImageIndex + direction + galleryImages.length) % galleryImages.length;

    // Animate current image exit
    animate(lightboxImg, {
        opacity: 0,
        translateX: direction > 0 ? -100 : 100,
        duration: 300,
        ease: 'inQuad',
        onComplete: function() {
            // Show loader
            loader.classList.add('active');

            // Load new image
            const img = new Image();
            img.onload = function() {
                lightboxImg.src = galleryImages[currentImageIndex].src;
                lightboxImg.alt = galleryImages[currentImageIndex].title;

                // Hide loader
                loader.classList.remove('active');

                // Animate new image entrance
                animate(lightboxImg, {
                    opacity: [0, 1],
                    translateX: [direction > 0 ? 100 : -100, 0],
                    duration: 400,
                    ease: 'outQuad'
                });

                updateLightboxInfo();
                updateThumbnails();
                preloadAdjacentImages();
            };

            img.src = galleryImages[currentImageIndex].src;
        }
    });

    // Animate navigation button
    const button = direction > 0 ? '.lightbox-next' : '.lightbox-prev';
    animate(button, {
        scale: [1, 0.9, 1],
        duration: 300,
        ease: 'outElastic(1, .6)'  // Changed from 'easeOutElastic(1, .6)'
    });
}

// Expose functions globally for inline event handlers
window.navigateLightbox = navigateLightbox;

function updateLightboxInfo() {
    document.getElementById('lightbox-current').textContent = currentImageIndex + 1;
    document.getElementById('lightbox-total').textContent = galleryImages.length;
    document.getElementById('lightbox-title').textContent = galleryImages[currentImageIndex].title;

    // Animate info update
    animate('.lightbox-info', {
        scale: [0.95, 1],
        duration: 300,
        ease: 'outBack'  // Changed from 'easeOutBack'
    });
}

function preloadAdjacentImages() {
    // Preload next and previous images for smooth navigation
    const prevIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
    const nextIndex = (currentImageIndex + 1) % galleryImages.length;

    [prevIndex, nextIndex].forEach(index => {
        const img = new Image();
        img.src = galleryImages[index].src;
    });
}

// ==================== Thumbnails ====================
function generateThumbnails() {
    const thumbnailsContainer = document.getElementById('lightbox-thumbnails');
    thumbnailsContainer.innerHTML = '';

    galleryImages.forEach((image, index) => {
        const thumbnailItem = document.createElement('div');
        thumbnailItem.className = 'thumbnail-item';
        if (index === currentImageIndex) {
            thumbnailItem.classList.add('active');
        }

        const img = document.createElement('img');
        img.src = image.src;
        img.alt = image.title;
        img.loading = 'lazy';

        thumbnailItem.appendChild(img);
        thumbnailItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (index !== currentImageIndex) {
                navigateToIndex(index);
            }
        });

        thumbnailsContainer.appendChild(thumbnailItem);
    });

    // Scroll to active thumbnail immediately after generation
    setTimeout(() => {
        scrollToActiveThumbnail(false);
    }, 50);
}

function updateThumbnails() {
    const thumbnails = document.querySelectorAll('.thumbnail-item');
    thumbnails.forEach((thumb, index) => {
        thumb.classList.toggle('active', index === currentImageIndex);
    });

    // Scroll active thumbnail into view
    scrollToActiveThumbnail(true);
}

function scrollToActiveThumbnail(smooth) {
    const thumbnailsContainer = document.getElementById('lightbox-thumbnails');
    const activeThumbnail = thumbnailsContainer.querySelector('.thumbnail-item.active');

    if (activeThumbnail) {
        const containerWidth = thumbnailsContainer.offsetWidth;
        const thumbnailLeft = activeThumbnail.offsetLeft;
        const thumbnailWidth = activeThumbnail.offsetWidth;

        // Calculate scroll position to center the active thumbnail
        const scrollPosition = thumbnailLeft - (containerWidth / 2) + (thumbnailWidth / 2);

        thumbnailsContainer.scrollTo({
            left: scrollPosition,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }
}

function navigateToIndex(index) {
    const direction = index > currentImageIndex ? 1 : -1;
    currentImageIndex = index;

    const lightboxImg = document.getElementById('lightbox-img');
    const loader = document.querySelector('.lightbox-loader');

    // Animate transition
    animate(lightboxImg, {
        opacity: 0,
        scale: 0.9,
        duration: 200,
        ease: 'inQuad',
        onComplete: function() {
            loader.classList.add('active');

            const img = new Image();
            img.onload = function() {
                lightboxImg.src = galleryImages[currentImageIndex].src;
                lightboxImg.alt = galleryImages[currentImageIndex].title;

                loader.classList.remove('active');

                animate(lightboxImg, {
                    opacity: [0, 1],
                    scale: [0.9, 1],
                    duration: 300,
                    ease: 'outQuad'
                });

                updateLightboxInfo();
                updateThumbnails();
                preloadAdjacentImages();
            };

            img.src = galleryImages[currentImageIndex].src;
        }
    });
}

// ==================== Keyboard Navigation ====================
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        const lightbox = document.getElementById('lightbox');
        if (!lightbox || !lightbox.classList.contains('active')) return;

        switch(e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                navigateLightbox(-1);
                break;
            case 'ArrowRight':
                navigateLightbox(1);
                break;
        }
    });
}

// ==================== Touch Navigation ====================
function setupTouchNavigation() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
}

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe left - next image
            navigateLightbox(1);
        } else {
            // Swipe right - previous image
            navigateLightbox(-1);
        }
    }
}

// ==================== Fullscreen Toggle ====================
function toggleFullscreen() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    if (!document.fullscreenElement) {
        lightbox.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }

    // Animate button
    animate('.lightbox-fullscreen', {
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
        duration: 500,
        ease: 'outElastic(1, .6)'
    });
}

// Expose functions globally for inline event handlers
window.toggleFullscreen = toggleFullscreen;

// ==================== Lightbox Controls Animation ====================
function animateLightboxControls() {
    // Updated for v4: anime.stagger() → stagger()
    animate(['.lightbox-close', '.lightbox-fullscreen', '.lightbox-nav', '.lightbox-info'], {
        opacity: [0, 1],
        scale: [0.95, 1],
        delay: stagger(30, {start: 100}),
        duration: 250,
        ease: 'outQuad'
    });

    // Only fade in thumbnails wrapper - no transforms to avoid conflicts
    animate('.lightbox-thumbnails-wrapper', {
        opacity: [0, 1],
        delay: 150,
        duration: 250,
        ease: 'outQuad'
    });
}

// ==================== Theme Toggle ====================
function initializeThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');

        // Save preference
        const theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
        localStorage.setItem('theme', theme);

        // Animate toggle button with Anime.js v4
        animate(themeToggle, {
            scale: [1, 1.2, 1],
            rotate: [0, 360],
            duration: 600,
            ease: 'outElastic(1, .6)'
        });

        // Animate theme transition effect
        animate('body', {
            duration: 300,
            ease: 'inOutQuad'  // Changed from 'easeInOutQuad'
        });
    });
}

// ==================== Performance: Debounce Resize ====================
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Re-calculate layout if needed
        console.log('Window resized');
    }, 250);
});

// ==================== Accessibility: Focus Management ====================
document.addEventListener('DOMContentLoaded', () => {
    // Ensure proper focus management for keyboard users
    const lightbox = document.getElementById('lightbox');

    if (lightbox) {
        lightbox.addEventListener('transitionend', () => {
            if (lightbox.classList.contains('active')) {
                document.getElementById('lightbox-img').focus();
            }
        });
    }

    // Initialize About & Contact page features
    initializeAboutPage();
    initializeContactPage();
    setupScrollAnimations();
});

// ==================== About Page Animations ====================
function initializeAboutPage() {
    // Animate image stack with parallax effect
    const stackItems = document.querySelectorAll('.stack-item');
    if (stackItems.length > 0) {
        animate('.stack-item-1', {
            translateY: [100, 0],
            opacity: [0, 1],
            rotate: [-5, 0],
            duration: 1000,
            ease: 'outCubic',  // Changed from 'easeOutCubic'
            delay: 200
        });

        animate('.stack-item-2', {
            translateY: [120, 0],
            opacity: [0, 0.8],
            rotate: [5, 0],
            duration: 1000,
            ease: 'outCubic',
            delay: 400
        });

        animate('.stack-item-3', {
            translateY: [140, 0],
            opacity: [0, 0.6],
            rotate: [-8, 0],
            duration: 1000,
            ease: 'outCubic',
            delay: 600
        });
    }

    // Animate expertise cards on scroll
    const expertiseCards = document.querySelectorAll('.expertise-card');
    if (expertiseCards.length > 0) {
        const expertiseObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting && !entry.target.classList.contains('card-animated')) {
                    entry.target.classList.add('card-animated');
                    animate(entry.target, {
                        translateY: [50, 0],
                        opacity: [0, 1],
                        duration: 600,
                        ease: 'outCubic',
                        delay: index * 100
                    });
                }
            });
        }, {threshold: 0.2});

        expertiseCards.forEach(card => expertiseObserver.observe(card));
    }

    // Animate timeline items
    const timelineItems = document.querySelectorAll('.timeline-item');
    if (timelineItems.length > 0) {
        const timelineObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting && !entry.target.classList.contains('timeline-animated')) {
                    entry.target.classList.add('timeline-animated');

                    // Marker pulse
                    animate(entry.target.querySelector('.timeline-marker'), {
                        scale: [0, 1],
                        duration: 400,
                        ease: 'outElastic(1, .8)'
                    });

                    // Content slide in
                    animate(entry.target.querySelector('.timeline-content'), {
                        translateX: [-30, 0],
                        opacity: [0, 1],
                        duration: 600,
                        ease: 'outCubic',
                        delay: 200
                    });
                }
            });
        }, {threshold: 0.3});

        timelineItems.forEach(item => timelineObserver.observe(item));
    }

    // Animate featured logos
    const logoItems = document.querySelectorAll('.logo-item');
    if (logoItems.length > 0) {
        const logosObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('logo-animated')) {
                    const items = Array.from(entry.target.parentElement.children);
                    items.forEach((item, i) => {
                        item.classList.add('logo-animated');
                        animate(item, {
                            opacity: [0, 1],
                            translateY: [20, 0],
                            delay: i * 100,
                            duration: 500,
                            ease: 'outQuad'
                        });
                    });
                }
            });
        }, {threshold: 0.2});

        if (logoItems[0]) {
            logosObserver.observe(logoItems[0]);
        }
    }
}

// ==================== Contact Page Animations ====================
function initializeContactPage() {
    // Form input animations
    const formInputs = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');
    formInputs.forEach(input => {
        input.addEventListener('focus', (e) => {
            animate(e.target, {
                scale: [1, 1.02, 1],
                duration: 300,
                ease: 'outQuad'
            });
        });
    });

    // FAQ accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const wasActive = item.classList.contains('active');

            // Close all other FAQs
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current FAQ
            item.classList.toggle('active');

            // Animate icon rotation
            animate(question.querySelector('.faq-icon'), {
                rotate: wasActive ? 0 : 45,
                duration: 300,
                ease: 'outQuad'
            });

            // Animate answer
            if (!wasActive) {
                animate(item.querySelector('.faq-answer'), {
                    opacity: [0, 1],
                    translateY: [-10, 0],
                    duration: 400,
                    ease: 'outQuad'
                });
            }
        });
    });

    // Social links hover animation
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('mouseenter', (e) => {
            animate(e.currentTarget.querySelector('.social-icon'), {
                rotate: [0, 360],
                duration: 600,
                ease: 'outElastic(1, .6)'
            });
        });
    });

    // Contact form submission animation
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('.submit-btn');

            // Success animation
            animate(submitBtn, {
                scale: [1, 0.95, 1.05, 1],
                backgroundColor: ['#00d4aa', '#00ffcc', '#00d4aa'],
                duration: 800,
                ease: 'outElastic(1, .6)',
                onComplete: () => {
                    // Show success message (you can customize this)
                    submitBtn.innerHTML = '<span>✓ Message Sent!</span>';
                    setTimeout(() => {
                        submitBtn.innerHTML = '<span class="btn-text">Send Message</span><span class="btn-icon">→</span>';
                        contactForm.reset();
                    }, 3000);
                }
            });
        });
    }

    // Availability indicator pulse
    const statusIndicator = document.querySelector('.status-indicator');
    if (statusIndicator) {
        animate(statusIndicator, {
            scale: [1, 1.3, 1],
            duration: 2000,
            ease: 'inOutQuad',  // Changed from 'easeInOutQuad'
            loop: true  // In v4, loop: true means infinite
        });
    }
}

// ==================== Scroll Animations ====================
function setupScrollAnimations() {
    const animateElements = document.querySelectorAll('.animate-on-scroll');

    // Only set up observer if elements exist
    if (animateElements.length === 0) return;

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                entry.target.classList.add('animated');

                animate(entry.target, {
                    opacity: [0, 1],
                    translateY: [30, 0],
                    duration: 800,
                    ease: 'outCubic'
                });
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animateElements.forEach(el => scrollObserver.observe(el));
}
