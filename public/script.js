// ==================== Blog State ====================
let blogPosts = [];
let filteredPosts = []; // Currently filtered posts
let currentPostIndex = 0;
let touchStartX = 0;
let touchEndX = 0;
let iso = null; // Isotope instance
let activeFilter = 'all'; // Track current filter state

// ==================== Initialization ====================
window.onload = function() {
    formatAllDates();
    initializeBlog();
    initializePostViewer();
    initializeThemeToggle();
    initializeIsotope(); // Initialize Isotope FIRST
    initializeTagFilters();
    animateMastheadTitle();
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
        const content = card.getAttribute('data-content') || '';

        // Extract image if present
        const img = card.querySelector('.post-image img');
        const imageUrl = img ? img.src : '';

        // Extract video if present
        const video = card.querySelector('.post-video video');
        const videoUrl = video ? video.src : '';

        // Extract audio if present
        const audioContainer = card.querySelector('.post-audio');
        const audioUrl = audioContainer ? audioContainer.getAttribute('data-audio-url') : '';

        // Extract link preview data
        const linkUrl = card.getAttribute('data-link-url') || '';
        const linkTitle = card.getAttribute('data-link-title') || '';
        const linkDescription = card.getAttribute('data-link-description') || '';
        const linkImage = card.getAttribute('data-link-image') || '';

        return {
            index,
            title,
            excerpt,
            date,
            tags,
            content,
            imageUrl,
            videoUrl,
            audioUrl,
            linkUrl,
            linkTitle,
            linkDescription,
            linkImage,
            element: card
        };
    });

    // Initially, all posts are "filtered" (visible)
    filteredPosts = [...blogPosts];

    // Add click listeners to post cards
    postCards.forEach((card, index) => {
        card.addEventListener("click", function() {
            // Find the index of this post in the filtered posts array
            const postData = blogPosts[index];
            const filteredIndex = filteredPosts.findIndex(p => p.index === postData.index);
            openPostViewer(filteredIndex);
        });
    });

    // Setup intersection observer for lazy loading
    setupPostObserver(postCards);

    // Setup video play button handlers
    setupVideoPlayButtons();

    // Setup audio players
    setupAudioPlayers();
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


// ==================== Post Viewer Functions ====================
function initializePostViewer() {
    setupKeyboardNavigation();
    setupTouchNavigation();
}

function animateMastheadTitle() {
    if (typeof animate !== 'function') return;
    const masthead = document.querySelector('.masthead');
    if (!masthead) return;

    if (masthead.dataset.animationInstance) {
        const prevAnimation = window[masthead.dataset.animationInstance];
        if (prevAnimation && typeof prevAnimation.pause === 'function') {
            prevAnimation.pause();
        }
    }

    const animation = animate(masthead, {
        color: ['var(--accent-primary)', 'var(--text-primary)'],
        duration: 1600,
        delay: 300,
        easing: 'easeInOutCubic'
    });

    const animationId = `mastheadAnim_${Date.now()}`;
    window[animationId] = animation;
    masthead.dataset.animationInstance = animationId;
}

function openPostViewer(index) {
    currentPostIndex = index;
    const viewer = document.getElementById('post-viewer');
    const viewerContent = document.getElementById('viewer-content');
    const post = filteredPosts[currentPostIndex];

    // Show viewer
    viewer.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Animate backdrop entrance with blur
    animate('.viewer-backdrop', {
        opacity: [0, 1],
        duration: 300,
        ease: 'outCubic'
    });

    // Build post content HTML
    const postHTML = buildPostHTML(post);
    viewerContent.innerHTML = postHTML;

    // Enhance markdown extras (task lists, code blocks)
    enhanceTaskLists(viewerContent);
    // Fix code block content and highlight with Prism
    fixCodeBlocks(viewerContent);

    // Setup video play buttons
    setupVideoPlayButtonsInViewer();

    // Setup audio players
    setupAudioPlayersInViewer();

    // Scroll viewer to top
    viewer.scrollTop = 0;

    // Animate content entrance
    animate(viewerContent, {
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 400,
        ease: 'outCubic'
    });

    // Animate controls entrance with stagger
    animateViewerControls();

    // Update counter (without animation on initial load)
    updateViewerInfo(false);

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

    // Optional video
    if (post.videoUrl) {
        html += `
            <div class="viewer-post-video">
                <video src="${post.videoUrl}" preload="metadata" playsinline>
                    Your browser does not support the video tag.
                </video>
                <button class="video-play-overlay" aria-label="Play video">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="rgba(255, 255, 255, 0.9)" />
                        <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
                    </svg>
                </button>
            </div>
        `;
    }

    // Optional audio
    if (post.audioUrl) {
        html += `
            <div class="viewer-post-audio" data-audio-url="${post.audioUrl}">
                <canvas class="audio-waveform"></canvas>
                <div class="audio-controls">
                    <button class="audio-play-btn" aria-label="Play audio">
                        <svg class="play-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M8 5v14l11-7z" fill="currentColor"/>
                        </svg>
                        <svg class="pause-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" style="display: none;">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor"/>
                        </svg>
                    </button>
                    <span class="audio-time">0:00</span>
                    <span class="audio-duration">0:00</span>
                </div>
            </div>
        `;
    }

    // Full content (simple markdown rendering)
    html += `<div class="viewer-post-content">`;
    if (post.content) {
        const decodedContent = decodeHtmlEntities(post.content);
        if (hasHtmlContent(decodedContent)) {
            html += decodedContent;
        } else {
            html += renderMarkdown(decodedContent);
        }
    } else {
        html += `<p>${post.excerpt}</p>`;
    }
    html += `</div>`;

    // Link preview card if link data exists
    if (post.linkUrl && post.linkTitle) {
        html += `
            <a href="${post.linkUrl}" target="_blank" rel="noopener noreferrer" class="link-preview-card">
                ${post.linkImage ? `<div class="link-preview-image" style="background-image: url('${post.linkImage}')"></div>` : ''}
                <div class="link-preview-content">
                    <div class="link-preview-title">${post.linkTitle}</div>
                    ${post.linkDescription ? `<div class="link-preview-description">${post.linkDescription}</div>` : ''}
                    <div class="link-preview-url">${new URL(post.linkUrl).hostname}</div>
                </div>
            </a>
        `;
    }

    return html;
}

function closePostViewer() {
    const viewer = document.getElementById('post-viewer');
    const viewerContent = document.getElementById('viewer-content');

    // Animate exit
    animate(viewerContent, {
        opacity: 0,
        translateY: 30,
        duration: 300,
        ease: 'inCubic'
    });

    animate('.viewer-backdrop', {
        opacity: 0,
        duration: 300,
        ease: 'inCubic',
        onComplete: function() {
            viewer.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Expose globally for onclick handlers
window.closePostViewer = closePostViewer;

function navigatePostViewer(direction) {
    const viewer = document.getElementById('post-viewer');
    const viewerContent = document.getElementById('viewer-content');

    // Calculate new index with wrapping based on filtered posts
    currentPostIndex = (currentPostIndex + direction + filteredPosts.length) % filteredPosts.length;

    // Animate current content exit
    animate(viewerContent, {
        opacity: 0,
        translateX: direction > 0 ? -40 : 40,
        duration: 250,
        ease: 'inCubic',
        onComplete: function() {
            // Update content from filtered posts
            const post = filteredPosts[currentPostIndex];
            viewerContent.innerHTML = buildPostHTML(post);

            // Enhance markdown extras (task lists, code blocks)
            enhanceTaskLists(viewerContent);
            // Fix code block content and highlight with Prism
            fixCodeBlocks(viewerContent);

            // Setup video play buttons
            setupVideoPlayButtonsInViewer();

            // Setup audio players
            setupAudioPlayersInViewer();

            // Scroll viewer to top
            viewer.scrollTop = 0;

            // Animate new content entrance
            animate(viewerContent, {
                opacity: [0, 1],
                translateX: [direction > 0 ? 40 : -40, 0],
                duration: 350,
                ease: 'outCubic'
            });

            updateViewerInfo();
            preloadAdjacentPosts();
        }
    });
}

// Expose globally
window.navigatePostViewer = navigatePostViewer;

function updateViewerInfo(shouldAnimate = true) {
    document.getElementById('viewer-current').textContent = currentPostIndex + 1;
    document.getElementById('viewer-total').textContent = filteredPosts.length;

    // Only animate when navigating between posts, not on initial load
    if (shouldAnimate) {
        animate('.viewer-counter', {
            scale: [0.9, 1.05, 1],
            duration: 400,
            ease: 'outBack'
        });
    }
}

function preloadAdjacentPosts() {
    // Preload images and videos from adjacent posts for smooth navigation (based on filtered posts)
    const prevIndex = (currentPostIndex - 1 + filteredPosts.length) % filteredPosts.length;
    const nextIndex = (currentPostIndex + 1) % filteredPosts.length;

    [prevIndex, nextIndex].forEach(index => {
        const post = filteredPosts[index];
        if (post.imageUrl) {
            const img = new Image();
            img.src = post.imageUrl;
        }
        if (post.videoUrl) {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = post.videoUrl;
        }
    });
}

function animateViewerControls() {
    // Only animate the close button
    animate('.viewer-close', {
        opacity: [0, 1],
        scale: [0.8, 1],
        rotate: [-90, 0],
        duration: 400,
        ease: 'outCubic'
    });

    // No animation for .viewer-nav and .viewer-info - they just appear immediately
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

        const masthead = document.querySelector('.masthead');
        if (masthead) {
            masthead.style.color = '';
            if (masthead.dataset.animationInstance) {
                const prevAnimation = window[masthead.dataset.animationInstance];
                if (prevAnimation && typeof prevAnimation.pause === 'function') {
                    prevAnimation.pause();
                }
                delete window[masthead.dataset.animationInstance];
                delete masthead.dataset.animationInstance;
            }
            // Restart animation gently in new theme
            requestAnimationFrame(() => animateMastheadTitle());
        }
    });
}

// ==================== Isotope Initialization ====================
function initializeIsotope() {
    const grid = document.querySelector('#blog-grid');

    // Initialize Isotope with masonry layout
    iso = new Isotope(grid, {
        itemSelector: '.post-card',
        layoutMode: 'masonry',
        percentPosition: true,
        transitionDuration: '0.4s',
        hiddenStyle: {
            opacity: 0,
            transform: 'scale(0.85)'
        },
        visibleStyle: {
            opacity: 1,
            transform: 'scale(1)'
        },
        masonry: {
            columnWidth: '.post-card',
            gutter: 24
        }
    });

    // Use imagesLoaded to ensure layout recalculates as images load
    const imgLoad = imagesLoaded(grid);
    let initialLoadComplete = false;

    imgLoad.on('progress', function() {
        // Only layout during initial load, not on subsequent filters
        if (!initialLoadComplete) {
            iso.layout();
        }
    });

    // Show grid once all images are loaded
    imgLoad.on('always', function() {
        iso.layout();
        grid.classList.add('isotope-ready');
        initialLoadComplete = true;
    });
}

// ==================== Tag Filtering ====================
function initializeTagFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedTag = btn.getAttribute('data-tag');
            activeFilter = selectedTag;

            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Animate button
            animate(btn, {
                scale: [1, 0.95, 1],
                duration: 300,
                ease: 'outQuad'
            });

            // Update filtered posts array
            if (selectedTag === 'all') {
                filteredPosts = [...blogPosts];
            } else {
                filteredPosts = blogPosts.filter(post => {
                    const postTags = post.tags.split(',').map(t => t.trim());
                    return postTags.includes(selectedTag);
                });
            }

            // Filter using Isotope
            if (iso) {
                const filterValue = selectedTag === 'all' ? '*' : `.tag-${selectedTag}`;

                // Temporarily disable transitions to prevent jitter
                iso.options.transitionDuration = 0;
                iso.arrange({
                    filter: filterValue,
                    transitionDuration: 0
                });

                // Re-enable transitions after a brief delay
                setTimeout(() => {
                    iso.options.transitionDuration = '0.4s';
                }, 50);
            }
        });
    });
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

// ==================== Code Block Fixing ====================
function fixCodeBlocks(container) {
    // Find all code blocks with stored content
    const codeBlocks = container.querySelectorAll('pre code[data-code-id]');

    codeBlocks.forEach(codeBlock => {
        const codeId = codeBlock.getAttribute('data-code-id');

        if (window.codeBlockStore && window.codeBlockStore[codeId]) {
            // Set the code as textContent to preserve all whitespace and newlines
            codeBlock.textContent = window.codeBlockStore[codeId];

            // Clean up the stored code
            delete window.codeBlockStore[codeId];

            // Remove the data attribute
            codeBlock.removeAttribute('data-code-id');
        }
    });

    // Now highlight with Prism
    if (window.Prism) {
        Prism.highlightAllUnder(container);
    }
}

function enhanceTaskLists(container) {
    if (!container) return;

    const listItems = container.querySelectorAll('li');

    listItems.forEach(li => {
        if (li.dataset.taskProcessed) return;
        const match = li.textContent.trim().match(/^\[(x|X|\s)\]\s+(.*)$/s);
        if (!match) return;

        const isChecked = match[1].toLowerCase() === 'x';
        const contentHtml = li.innerHTML.replace(/^\s*\[(x|X|\s)\]\s*/i, '');

        li.classList.add('task-item');
        li.dataset.taskProcessed = 'true';

        const parentList = li.closest('ul');
        if (parentList) {
            parentList.classList.add('task-list');
        }

        li.innerHTML = `
            <label class="task-item-label">
                <input type="checkbox" ${isChecked ? 'checked' : ''} disabled>
                <span>${contentHtml}</span>
            </label>
        `;
    });
}

function decodeHtmlEntities(str) {
    if (!str) return '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
}

function hasHtmlContent(str) {
    if (!str) return false;
    return /<\s*(?:p|h[1-6]|ul|ol|li|blockquote|pre|code|table|thead|tbody|tr|td|th|img|hr|br|figure|figcaption)/i.test(str);
}

// ==================== Utility: Parse Markdown-style Content ====================
function parseSimpleMarkdown(text) {
    // Enhanced markdown parsing with more formatting options
    return text
        // Bold + Italic combined (must come before individual)
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        // Bold
        .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
        // Strikethrough
        .replace(/~~(.*?)~~/g, '<del>$1</del>')
        // Highlight
        .replace(/==(.*?)==/g, '<mark>$1</mark>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        // Subscript
        .replace(/~([^~\s]+?)~/g, '<sub>$1</sub>')
        // Superscript
        .replace(/\^([^^\\s]+?)\^/g, '<sup>$1</sup>');
}

function renderMarkdown(markdown) {
    if (!markdown) return '';

    let html = '';
    const lines = markdown.split('\n');
    let inList = false;
    let inOrderedList = false;
    let inParagraph = false;
    let inCodeBlock = false;
    let codeBlockContent = '';
    let codeLanguage = '';
    let listDepth = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Code blocks
        if (line.trim().startsWith('```')) {
            if (!inCodeBlock) {
                if (inParagraph) { html += '</p>'; inParagraph = false; }
                if (inList) { html += '</ul>'; inList = false; }
                if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
                inCodeBlock = true;
                codeBlockContent = '';
                // Extract language identifier (e.g., ```javascript)
                codeLanguage = line.trim().substring(3).trim();
            } else {
                // Trim trailing newline
                const trimmedCode = codeBlockContent.replace(/\n$/, '');

                // Use Prism language class if specified, otherwise use generic
                const langClass = codeLanguage ? `language-${codeLanguage}` : 'language-none';

                // Use a special marker that we'll replace later with the actual code
                const codeId = `CODE_BLOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                html += `<pre><code class="${langClass}" data-code-id="${codeId}"></code></pre>`;

                // Store the code content for later insertion
                if (!window.codeBlockStore) window.codeBlockStore = {};
                window.codeBlockStore[codeId] = trimmedCode;

                inCodeBlock = false;
                codeBlockContent = '';
                codeLanguage = '';
            }
            continue;
        }

        if (inCodeBlock) {
            codeBlockContent += line + '\n';
            continue;
        }

        // Skip empty lines
        if (line.trim() === '') {
            if (inParagraph) {
                html += '</p>';
                inParagraph = false;
            }
            if (inList) {
                html += '</ul>';
                inList = false;
                listDepth = 0;
            }
            if (inOrderedList) {
                html += '</ol>';
                inOrderedList = false;
            }
            continue;
        }

        // Horizontal rule
        if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
            if (inParagraph) { html += '</p>'; inParagraph = false; }
            if (inList) { html += '</ul>'; inList = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            html += '<hr>';
            continue;
        }

        // Headers (#### ### ## #)
        if (line.startsWith('#### ')) {
            if (inParagraph) { html += '</p>'; inParagraph = false; }
            if (inList) { html += '</ul>'; inList = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            html += `<h4>${parseSimpleMarkdown(line.substring(5))}</h4>`;
        }
        else if (line.startsWith('### ')) {
            if (inParagraph) { html += '</p>'; inParagraph = false; }
            if (inList) { html += '</ul>'; inList = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            html += `<h3>${parseSimpleMarkdown(line.substring(4))}</h3>`;
        }
        else if (line.startsWith('## ')) {
            if (inParagraph) { html += '</p>'; inParagraph = false; }
            if (inList) { html += '</ul>'; inList = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            html += `<h2>${parseSimpleMarkdown(line.substring(3))}</h2>`;
        }
        else if (line.startsWith('# ')) {
            if (inParagraph) { html += '</p>'; inParagraph = false; }
            if (inList) { html += '</ul>'; inList = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            html += `<h1>${parseSimpleMarkdown(line.substring(2))}</h1>`;
        }
        // Blockquotes
        else if (line.startsWith('> ')) {
            if (inParagraph) { html += '</p>'; inParagraph = false; }
            if (inList) { html += '</ul>'; inList = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            let quoteContent = line.substring(2);
            // Collect multi-line quotes
            while (i + 1 < lines.length && lines[i + 1].startsWith('> ')) {
                i++;
                quoteContent += '<br>' + lines[i].substring(2);
            }
            html += `<blockquote>${parseSimpleMarkdown(quoteContent)}</blockquote>`;
        }
        // Ordered list items
        else if (line.match(/^\d+\.\s/)) {
            if (inParagraph) { html += '</p>'; inParagraph = false; }
            if (inList) { html += '</ul>'; inList = false; }
            if (!inOrderedList) {
                html += '<ol>';
                inOrderedList = true;
            }
            const content = line.replace(/^\d+\.\s/, '');
            html += `<li>${parseSimpleMarkdown(content)}</li>`;
        }
        // Unordered list items (with nesting support)
        else if (line.match(/^(\s*)[-*+]\s/)) {
            if (inParagraph) { html += '</p>'; inParagraph = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }

            const spaces = line.match(/^(\s*)/)[1].length;
            const currentDepth = Math.floor(spaces / 2);
            const content = line.replace(/^(\s*)[-*+]\s/, '');

            if (!inList) {
                html += '<ul>';
                inList = true;
                listDepth = currentDepth;
            }

            html += `<li class="depth-${currentDepth}">${parseSimpleMarkdown(content)}</li>`;
        }
        // Task lists
        else if (line.match(/^(\s*)- \[([ x])\]\s/)) {
            if (inParagraph) { html += '</p>'; inParagraph = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            if (!inList) {
                html += '<ul class="task-list">';
                inList = true;
            }
            const checked = line.includes('[x]');
            const content = line.replace(/^(\s*)- \[([ x])\]\s/, '');
            html += `<li class="task-item"><input type="checkbox" ${checked ? 'checked' : ''} disabled> ${parseSimpleMarkdown(content)}</li>`;
        }
        // Regular paragraph
        else {
            if (inList) { html += '</ul>'; inList = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            if (!inParagraph) {
                html += '<p>';
                inParagraph = true;
            }
            html += parseSimpleMarkdown(line) + ' ';
        }
    }

    // Close any open tags
    if (inParagraph) html += '</p>';
    if (inList) html += '</ul>';
    if (inOrderedList) html += '</ol>';
    if (inCodeBlock) html += `<pre><code>${codeBlockContent}</code></pre>`;

    return html;
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

// ==================== Video Controls ====================
function setupVideoPlayButtons() {
    // Setup play button handlers for all videos on the page
    const videoContainers = document.querySelectorAll('.post-video, .viewer-post-video');

    videoContainers.forEach(container => {
        const video = container.querySelector('video');
        const playButton = container.querySelector('.video-play-overlay');

        if (!video || !playButton) return;

        // Play button click handler
        playButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent opening the post viewer
            playVideo(container, video);
        });

        // When video ends, show play button again
        video.addEventListener('ended', () => {
            container.classList.remove('playing');
            video.removeAttribute('controls');
        });

        // If user pauses, keep controls but consider showing overlay again after a delay
        video.addEventListener('pause', () => {
            if (video.currentTime === 0 || video.ended) {
                container.classList.remove('playing');
                video.removeAttribute('controls');
            }
        });
    });
}

function playVideo(container, video) {
    container.classList.add('playing');
    video.setAttribute('controls', 'controls');
    video.play();
}

// Re-setup video handlers when content changes (like in post viewer)
function setupVideoPlayButtonsInViewer() {
    // Wait a tick for DOM to update
    setTimeout(() => {
        setupVideoPlayButtons();
    }, 0);
}

// ==================== Audio Player with Waveform ====================
const audioPlayers = new Map(); // Store audio player instances

class AudioPlayer {
    constructor(container) {
        this.container = container;
        this.audioUrl = container.getAttribute('data-audio-url');
        this.canvas = container.querySelector('.audio-waveform');
        this.ctx = this.canvas.getContext('2d');
        this.playBtn = container.querySelector('.audio-play-btn');
        this.playIcon = container.querySelector('.play-icon');
        this.pauseIcon = container.querySelector('.pause-icon');
        this.timeDisplay = container.querySelector('.audio-time');
        this.durationDisplay = container.querySelector('.audio-duration');

        this.audio = new Audio(this.audioUrl);
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.waveformData = null;
        this.isPlaying = false;
        this.isLoaded = false;

        this.init();
    }

    async init() {
        // Setup canvas size
        this.resizeCanvas();

        // Load and analyze audio
        await this.loadAudio();

        // Setup event listeners
        this.setupEventListeners();

        // Draw initial waveform
        this.drawWaveform(0);
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    async loadAudio() {
        try {
            // Fetch audio file
            const response = await fetch(this.audioUrl);
            const arrayBuffer = await response.arrayBuffer();

            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Decode audio data
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // Extract waveform data
            this.waveformData = this.extractWaveformData(audioBuffer);

            // Update duration display
            this.durationDisplay.textContent = this.formatTime(this.audio.duration || audioBuffer.duration);

            this.isLoaded = true;
        } catch (error) {
            console.error('Error loading audio:', error);
        }
    }

    extractWaveformData(audioBuffer) {
        const rawData = audioBuffer.getChannelData(0); // Get first channel
        const samples = 500; // Number of samples for waveform
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData = [];

        for (let i = 0; i < samples; i++) {
            let blockStart = blockSize * i;
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
                sum += Math.abs(rawData[blockStart + j]);
            }
            filteredData.push(sum / blockSize);
        }

        // Normalize data
        const max = Math.max(...filteredData);
        return filteredData.map(n => n / max);
    }

    drawWaveform(progress = 0) {
        if (!this.waveformData) return;

        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        const progressX = width * progress;

        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);

        // Get colors from CSS variables
        const styles = getComputedStyle(document.body);
        const accentColor = styles.getPropertyValue('--accent-primary').trim();
        const mutedColor = styles.getPropertyValue('--text-muted').trim();

        const barWidth = width / this.waveformData.length;
        const centerY = height / 2;

        this.waveformData.forEach((value, index) => {
            const barHeight = value * (height * 0.8);
            const x = index * barWidth;

            // Determine color based on progress
            this.ctx.fillStyle = x < progressX ? accentColor : mutedColor;

            // Draw bar (centered vertically)
            this.ctx.fillRect(
                x,
                centerY - barHeight / 2,
                barWidth * 0.8,
                barHeight
            );
        });

        // Draw progress line
        if (progress > 0) {
            this.ctx.strokeStyle = accentColor;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(progressX, 0);
            this.ctx.lineTo(progressX, height);
            this.ctx.stroke();
        }
    }

    setupEventListeners() {
        // Play/pause button
        this.playBtn.addEventListener('click', () => this.togglePlay());

        // Canvas click for scrubbing
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleEnded());
        this.audio.addEventListener('loadedmetadata', () => {
            this.durationDisplay.textContent = this.formatTime(this.audio.duration);
        });
    }

    async togglePlay() {
        if (!this.isLoaded) return;

        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
            this.playIcon.style.display = 'block';
            this.pauseIcon.style.display = 'none';
        } else {
            // Resume audio context if suspended (browser autoplay policy)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.audio.play();
            this.isPlaying = true;
            this.playIcon.style.display = 'none';
            this.pauseIcon.style.display = 'block';
        }
    }

    handleCanvasClick(e) {
        if (!this.isLoaded) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const progress = x / rect.width;

        this.audio.currentTime = progress * this.audio.duration;
        this.drawWaveform(progress);
    }

    updateProgress() {
        const progress = this.audio.currentTime / this.audio.duration;
        this.drawWaveform(progress);
        this.timeDisplay.textContent = this.formatTime(this.audio.currentTime);
    }

    handleEnded() {
        this.isPlaying = false;
        this.playIcon.style.display = 'block';
        this.pauseIcon.style.display = 'none';
        this.audio.currentTime = 0;
        this.drawWaveform(0);
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    destroy() {
        this.audio.pause();
        this.audio.src = '';
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

function setupAudioPlayers() {
    const audioContainers = document.querySelectorAll('.post-audio, .viewer-post-audio');

    audioContainers.forEach(container => {
        // Skip if already initialized
        if (audioPlayers.has(container)) return;

        const player = new AudioPlayer(container);
        audioPlayers.set(container, player);
    });
}

function setupAudioPlayersInViewer() {
    // Wait a tick for DOM to update
    setTimeout(() => {
        setupAudioPlayers();
    }, 0);
}
