// ==================== Blog State ====================
let blogPosts = [];
let currentPostIndex = 0;
let touchStartX = 0;
let touchEndX = 0;

// ==================== Initialization ====================
window.onload = function() {
    formatAllDates();
    initializeBlog();
    initializePostViewer();
    initializeThemeToggle();
    initializeTagFilters();
    animateBlogEntrance();
};

// ==================== Blog Initialization ====================
function initializeBlog() {
    const postCards = document.querySelectorAll(".post-card");

    // Build blog posts array with all data
    blogPosts = Array.from(postCards).map((card, index) => {
        const title = card.querySelector('.post-title')?.textContent || '';
        const excerpt = card.querySelector('.post-excerpt')?.textContent || '';
        const date = card.querySelector('.post-date')?.textContent || '';
        const tags = card.getAttribute('data-tags') || '';

        // Extract image if present
        const img = card.querySelector('.post-image img');
        const imageUrl = img ? img.src : '';

        return {
            index,
            title,
            excerpt,
            date,
            tags,
            imageUrl
        };
    });

    // Add click listeners to post cards
    postCards.forEach((card, index) => {
        card.addEventListener("click", function() {
            openPostViewer(index);
        });
    });

    // Setup intersection observer for lazy loading
    setupPostObserver(postCards);
}

// ==================== Lazy Loading with Intersection Observer ====================
function setupPostObserver(postCards) {
    const observerOptions = {
        root: null,
        rootMargin: '100px',
        threshold: 0.01
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Animate individual post card entrance
                animate(entry.target, {
                    opacity: [0, 1],
                    translateY: [40, 0],
                    scale: [0.95, 1],
                    duration: 600,
                    ease: 'outCubic'
                });

                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    postCards.forEach(card => {
        observer.observe(card);
    });
}

// ==================== Blog Grid Entrance Animation ====================
function animateBlogEntrance() {
    const postCards = document.querySelectorAll(".post-card");

    if (postCards.length === 0) return;

    // Animate header first
    animate('.masthead', {
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 800,
        ease: 'outCubic'
    });

    // Stagger animation for initial visible posts using Anime.js 4.2.2
    animate(Array.from(postCards).slice(0, 6), {
        opacity: [0, 1],
        translateY: [40, 0],
        scale: [0.95, 1],
        delay: stagger(80, {start: 400}),
        duration: 600,
        ease: 'outCubic'
    });
}

// ==================== Post Viewer Functions ====================
function initializePostViewer() {
    setupKeyboardNavigation();
    setupTouchNavigation();
}

function openPostViewer(index) {
    currentPostIndex = index;
    const viewer = document.getElementById('post-viewer');
    const viewerContent = document.getElementById('viewer-content');
    const post = blogPosts[currentPostIndex];

    // Show viewer
    viewer.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Animate backdrop entrance with blur
    animate('.viewer-backdrop', {
        opacity: [0, 1],
        duration: 400,
        ease: 'outQuad'
    });

    // Build post content HTML
    const postHTML = buildPostHTML(post);
    viewerContent.innerHTML = postHTML;

    // Animate content entrance with spring physics (Anime.js 4.2.2 feature)
    animate(viewerContent, {
        opacity: [0, 1],
        scale: [0.9, 1],
        translateY: [60, 0],
        duration: 600,
        ease: 'spring(1, 80, 10, 0)' // Spring physics: mass, stiffness, damping, velocity
    });

    // Animate controls entrance with stagger
    animateViewerControls();

    // Update counter
    updateViewerInfo();

    // Preload adjacent posts for smooth navigation
    preloadAdjacentPosts();
}

function buildPostHTML(post) {
    let html = `<h1 class="viewer-post-title">${post.title}</h1>`;

    // Meta information
    html += `<div class="viewer-post-meta">`;
    if (post.date) {
        html += `<time class="viewer-post-date">${post.date}</time>`;
    }
    if (post.tags) {
        const tagList = post.tags.split(', ');
        html += `<div class="viewer-post-tags">`;
        tagList.forEach(tag => {
            html += `<span class="tag">${tag.trim()}</span>`;
        });
        html += `</div>`;
    }
    html += `</div>`;

    // Optional image
    if (post.imageUrl) {
        html += `<div class="viewer-post-image"><img src="${post.imageUrl}" alt="${post.title}"></div>`;
    }

    // Excerpt as content preview (in real implementation, you'd fetch full markdown content)
    html += `<div class="viewer-post-content">`;
    html += `<p>${post.excerpt}</p>`;
    html += `</div>`;

    return html;
}

function closePostViewer() {
    const viewer = document.getElementById('post-viewer');
    const viewerContent = document.getElementById('viewer-content');

    // Animate exit with spring
    animate(viewerContent, {
        opacity: 0,
        scale: 0.85,
        translateY: 40,
        duration: 400,
        ease: 'inQuad'
    });

    animate('.viewer-backdrop', {
        opacity: 0,
        duration: 400,
        ease: 'inQuad',
        onComplete: function() {
            viewer.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Expose globally for onclick handlers
window.closePostViewer = closePostViewer;

function navigatePostViewer(direction) {
    const viewerContent = document.getElementById('viewer-content');

    // Calculate new index with wrapping
    currentPostIndex = (currentPostIndex + direction + blogPosts.length) % blogPosts.length;

    // Animate current content exit with rotation
    animate(viewerContent, {
        opacity: 0,
        translateX: direction > 0 ? -60 : 60,
        rotateY: direction > 0 ? -15 : 15,
        duration: 350,
        ease: 'inQuad',
        onComplete: function() {
            // Update content
            const post = blogPosts[currentPostIndex];
            viewerContent.innerHTML = buildPostHTML(post);

            // Animate new content entrance with opposite rotation
            animate(viewerContent, {
                opacity: [0, 1],
                translateX: [direction > 0 ? 60 : -60, 0],
                rotateY: [direction > 0 ? 15 : -15, 0],
                duration: 500,
                ease: 'outCubic'
            });

            updateViewerInfo();
            preloadAdjacentPosts();
        }
    });

    // Animate navigation button with elastic bounce
    const button = direction > 0 ? '.viewer-next' : '.viewer-prev';
    animate(button, {
        scale: [1, 0.85, 1.1, 1],
        duration: 500,
        ease: 'outElastic(1, .6)'
    });
}

// Expose globally
window.navigatePostViewer = navigatePostViewer;

function updateViewerInfo() {
    document.getElementById('viewer-current').textContent = currentPostIndex + 1;
    document.getElementById('viewer-total').textContent = blogPosts.length;

    // Animate info update with bounce
    animate('.viewer-counter', {
        scale: [0.9, 1.05, 1],
        duration: 400,
        ease: 'outBack'
    });
}

function preloadAdjacentPosts() {
    // Preload images from adjacent posts for smooth navigation
    const prevIndex = (currentPostIndex - 1 + blogPosts.length) % blogPosts.length;
    const nextIndex = (currentPostIndex + 1) % blogPosts.length;

    [prevIndex, nextIndex].forEach(index => {
        const post = blogPosts[index];
        if (post.imageUrl) {
            const img = new Image();
            img.src = post.imageUrl;
        }
    });
}

function animateViewerControls() {
    // Stagger animation for controls with different delays
    const timeline = createTimeline({
        ease: 'outCubic'
    });

    timeline
        .add('.viewer-close', {
            opacity: [0, 1],
            scale: [0.8, 1],
            rotate: [-90, 0],
            duration: 400
        })
        .add('.viewer-nav', {
            opacity: [0, 1],
            scale: [0.8, 1],
            duration: 400
        }, '-=300')
        .add('.viewer-info', {
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 400
        }, '-=300');
}

// ==================== Keyboard Navigation ====================
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        const viewer = document.getElementById('post-viewer');
        if (!viewer || !viewer.classList.contains('active')) return;

        switch(e.key) {
            case 'Escape':
                closePostViewer();
                break;
            case 'ArrowLeft':
                navigatePostViewer(-1);
                break;
            case 'ArrowRight':
                navigatePostViewer(1);
                break;
        }
    });
}

// ==================== Touch Navigation ====================
function setupTouchNavigation() {
    const viewer = document.getElementById('post-viewer');
    if (!viewer) return;

    viewer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    viewer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
}

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe left - next post
            navigatePostViewer(1);
        } else {
            // Swipe right - previous post
            navigatePostViewer(-1);
        }
    }
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

        // Animate toggle button with elastic rotation
        animate(themeToggle, {
            scale: [1, 1.3, 1],
            rotate: [0, 360],
            duration: 700,
            ease: 'outElastic(1, .5)'
        });

        // Subtle page transition animation
        animate('.container', {
            opacity: [0.7, 1],
            duration: 300,
            ease: 'inOutQuad'
        });
    });
}

// ==================== Tag Filtering ====================
function initializeTagFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const postCards = document.querySelectorAll('.post-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedTag = btn.getAttribute('data-tag');

            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Animate button
            animate(btn, {
                scale: [1, 0.95, 1],
                duration: 300,
                ease: 'outQuad'
            });

            // Filter posts with animation
            filterPosts(selectedTag, postCards);
        });
    });
}

function filterPosts(tag, postCards) {
    const cardsArray = Array.from(postCards);

    // Determine which cards should be visible and which should be hidden
    const visibleCards = cardsArray.filter(card => {
        if (tag === 'all') return true;

        const cardTags = card.getAttribute('data-tags');
        if (!cardTags) return false;

        const tagList = cardTags.split(',').map(t => t.trim());
        return tagList.includes(tag);
    });

    const hiddenCards = cardsArray.filter(card => !visibleCards.includes(card));

    // Cards that are currently hidden but need to be shown
    const cardsToShow = visibleCards.filter(card => card.style.display === 'none');

    // Cards that are currently visible but need to be hidden
    const cardsToHide = hiddenCards.filter(card => card.style.display !== 'none');

    // Fade out cards that need to be hidden
    if (cardsToHide.length > 0) {
        animate(cardsToHide, {
            opacity: 0,
            scale: 0.9,
            duration: 300,
            ease: 'outQuad',
            onComplete: () => {
                cardsToHide.forEach(card => {
                    card.style.display = 'none';
                });
            }
        });
    }

    // Show and fade in cards that need to be shown
    if (cardsToShow.length > 0) {
        // First set display and initial state
        cardsToShow.forEach(card => {
            card.style.display = 'flex';
            card.style.opacity = '0';
        });

        // Then animate them in with stagger
        animate(cardsToShow, {
            opacity: [0, 1],
            scale: [0.9, 1],
            delay: stagger(60, {start: 150}),
            duration: 400,
            ease: 'outCubic'
        });
    }
}

// ==================== Scroll-Triggered Animations ====================
function setupScrollAnimations() {
    const animateElements = document.querySelectorAll('.animate-on-scroll');

    if (animateElements.length === 0) return;

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                entry.target.classList.add('animated');

                // Varied animations based on element type
                const animationType = entry.target.getAttribute('data-animation') || 'fadeUp';

                switch(animationType) {
                    case 'fadeUp':
                        animate(entry.target, {
                            opacity: [0, 1],
                            translateY: [40, 0],
                            duration: 800,
                            ease: 'outCubic'
                        });
                        break;
                    case 'fadeIn':
                        animate(entry.target, {
                            opacity: [0, 1],
                            duration: 800,
                            ease: 'outQuad'
                        });
                        break;
                    case 'scaleIn':
                        animate(entry.target, {
                            opacity: [0, 1],
                            scale: [0.8, 1],
                            duration: 800,
                            ease: 'outCubic'
                        });
                        break;
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animateElements.forEach(el => scrollObserver.observe(el));
}

// ==================== Performance: Debounce Resize ====================
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Recalculate layouts if needed
        console.log('Window resized');
    }, 250);
});

// ==================== Accessibility: Focus Management ====================
document.addEventListener('DOMContentLoaded', () => {
    const viewer = document.getElementById('post-viewer');

    if (viewer) {
        viewer.addEventListener('transitionend', () => {
            if (viewer.classList.contains('active')) {
                const viewerContent = document.getElementById('viewer-content');
                if (viewerContent) {
                    viewerContent.focus();
                }
            }
        });
    }

    setupScrollAnimations();
});

// ==================== Advanced Anime.js 4.2.2 Features ====================

// Hover animations for post cards using morphing
document.addEventListener('DOMContentLoaded', () => {
    const postCards = document.querySelectorAll('.post-card');

    postCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // Subtle scale with spring physics
            animate(card, {
                scale: 1.02,
                duration: 500,
                ease: 'spring(1, 100, 10, 0)'
            });
        });

        card.addEventListener('mouseleave', () => {
            animate(card, {
                scale: 1,
                duration: 500,
                ease: 'spring(1, 100, 10, 0)'
            });
        });
    });

});

// ==================== Utility: Parse Markdown-style Content ====================
function parseSimpleMarkdown(text) {
    // Simple markdown parsing for bold, italic, links
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

// ==================== Date Formatting ====================
function formatDate(dateString) {
    // Parse date in YYYY-MM-DD format
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;

    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
    const day = parseInt(parts[2]);

    const date = new Date(year, month, day);

    // Format as "November 1, 2025"
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatAllDates() {
    // Format all dates on the page
    const dateElements = document.querySelectorAll('.post-date, .viewer-post-date');
    dateElements.forEach(el => {
        const originalDate = el.textContent.trim();
        el.textContent = formatDate(originalDate);
    });
}
