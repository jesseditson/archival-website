// ==================== Blog State ====================
const state = window.blogState;
let iso = null; // Isotope instance
let touchStartX = 0;
let touchEndX = 0;
let filteredPosts = []; // Currently filtered posts
let currentPostIndex = -1;
let activeFilter = 'all'; // Track current filter state

// ==================== Initialization ====================
window.onload = function() {
    initializeServiceWorker();
    initializeIsotope(); // Initialize Isotope FIRST
    formatAllDates();
    initializeBlog();
    initializePostViewer();
    initializeThemeToggle();
    initializeTagFilters();
    animateMastheadTitle();
};

// ==================== Settings ====================
async function getSettings() {
    const cache = await caches.open("settings");
    const r = await cache.match("/settings");
    if (r && r.ok) {
        return await r.json();
    } else {
        return {}
    }
}
async function writeSettings(settings) {
    const cache = await caches.open("settings");
    await cache.put("/settings", new Response(JSON.stringify(settings), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    }))
}

// ==================== Service Worker ====================
function initializeServiceWorker() {
    const toggle = document.querySelector(".notify-toggle");
    if ('serviceWorker' in navigator && caches) {
        navigator.serviceWorker
            .register('/service-worker.js')
            .then((registration) => {
                console.log(`ServiceWorker registration successful with scope: ${registration.scope}`);
                return registration.update();
            })
            .then((registration) => {
                console.log(`ServiceWorker updated`);
            })
            .catch((err) => console.error('ServiceWorker registration failed: ', err));
        
        getSettings().then(settings => {
            toggle.classList.toggle("enabled", Notification.permission === "granted" && !!settings.notifications);

            toggle.addEventListener("click", () => {
                if (Notification.permission !== "granted") {
                    Notification.requestPermission(function (status) {
                        console.log('Notification permission status:', status);
                        if (status === "granted") {
                            settings.notifications = true;
                            writeSettings(settings);
                            const options = {
                                body: "Thanks for subscribing! We'll send you notifications when this blog is updated.",
                                icon: '/icon.png',
                                vibrate: [100, 50, 100],
                                data: {
                                dateOfArrival: Date.now(),
                                primaryKey: 1,
                                },
                                actions: [
                                {
                                    action: 'close',
                                    title: 'Close notification',
                                    icon: 'images/xmark.png',
                                },
                                ],
                            };

                            navigator.serviceWorker.getRegistration().then(registration => {
                                registration.showNotification('Notification without Push API', options);
                            });
                        }
                    });
                } else {
                    settings.notifications = !settings.notifications;
                    writeSettings(settings);
                    toggle.classList.toggle("enabled", Notification.permission === "granted" && !!settings.notifications);
                }
            });
        })
        .catch((err) => console.error('Failed reading settings: ', err));;
    } else {
        toggle.style.display = "none";
    }
}

// ==================== Blog Initialization ====================
function initializeBlog() {
    // initialize our tag, which will also update filteredPosts
    const initialTag = new URL(window.location.href).searchParams.get("tag") || "all";
    selectTag(initialTag);

    // Update the current index
    currentPostIndex = filteredPosts.findIndex(p => p.path === state.initialPostPath);
    updateViewerInfo();

    // Add click listeners to post cards
    const postCards = document.querySelectorAll(".post-card");
    postCards.forEach((card, index) => {
        card.addEventListener("click", function() {
            // Find the index of this post in the filtered posts array
            const postData = state.blogPosts[index];
            const filteredIndex = filteredPosts.findIndex(p => p.index === postData.index);
            openPostViewer(filteredIndex);
        });
    });

    // Add Link Previews
    addLinkPreviews();

    // Setup intersection observer for lazy loading
    setupPostObserver(postCards);

    // Setup video play button handlers
    setupVideoPlayButtons();

    // Setup audio players
    setupAudioPlayers();
}

function addLinkPreviews() {
    const previewCards = document.querySelectorAll(".link-preview-card");
    previewCards.forEach((card) => {
        const url = card.getAttribute("href");
        if (url) {
            const contentEl = card.querySelector(".link-preview-content");
            const linkEl = document.createElement("div");
            linkEl.classList.add("link-preview-url");
            linkEl.innerText = url;
            contentEl.appendChild(linkEl);
            fetch(`/carriers/metadata?url=${url}`).then(async (response) => {
                const metadata = await response.json();
                const {description, image, title} = metadata;
                if (image) {
                    const imageEl = document.createElement("div");
                    imageEl.classList.add("link-preview-image");
                    imageEl.style.backgroundImage = `url('${image}')`;
                    console.log(card, contentEl, imageEl)
                    card.insertBefore(imageEl, contentEl);
                }
                for (const [name, value] of Object.entries({title, description})) {
                    if (value) {
                        const fieldEl = document.createElement("div");
                        fieldEl.classList.add(`link-preview-${name}`);
                        fieldEl.innerText = value;
                        contentEl.appendChild(fieldEl);
                    }
                }
            }).catch(e => {
                console.log(`Failed loading ${url}: ${e.toString()}`);
            })
        }
    });
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

    const closeBtn = document.getElementById('viewer-close');
    const prevBtn = document.getElementById('viewer-prev');
    const nextBtn = document.getElementById('viewer-next');
    if (closeBtn) closeBtn.addEventListener('click', closePostViewer);
    if (prevBtn) prevBtn.addEventListener('click', () => navigatePostViewer(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigatePostViewer(1));
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

function renderPost(post) {
    // The content is HTML-escaped in the JSON, so we need to decode it
    const textarea = document.createElement('textarea');
    textarea.innerHTML = post.content;
    return textarea.value;
}

function openPostViewer(index) {
    currentPostIndex = index;
    const viewer = document.getElementById('post-viewer');
    const viewerContent = document.getElementById('viewer-content');

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
    viewerContent.innerHTML = renderPost(filteredPosts[index]);

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

    updateHistory();
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
            currentPostIndex = -1;
            updateHistory();
        }
    });
}


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
            viewerContent.innerHTML = renderPost(filteredPosts[currentPostIndex]);

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

            updateHistory();
        }
    });
}

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

function updateHistory() {
    let url = "/";
    if (currentPostIndex !== -1) {
        const post = filteredPosts[currentPostIndex];
        url = post.path;
    }
    if (activeFilter && activeFilter !== "all") {
        url += `?tag=${activeFilter}`;
    }
    window.history.pushState(url, "", url);
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

    // Initialize Isotope with masonry layout. The .grid-sizer element
    // (a zero-height sibling sized via CSS to match .post-card width)
    // gives Isotope a stable column-width reference even before any
    // post-card images have loaded, which fixes a class of layout bugs
    // where the first card's pre-load width caused gaps or overlaps.
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
            columnWidth: '.grid-sizer',
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

    // Additional safety: recalculate layout after a short delay
    // This handles edge cases where fonts or other resources load late
    setTimeout(() => {
        if (iso) {
            iso.layout();
        }
    }, 100);

    setTimeout(() => {
        if (iso) {
            iso.layout();
        }
    }, 500);
}

// ==================== Tag Filtering ====================
function selectTag(selectedTag) {
    activeFilter = selectedTag;

    const filterBtns = document.querySelectorAll('.filter-btn');

    // Update active state
    filterBtns.forEach(b => {
        const isSelected = b.dataset.tag === selectedTag;
        b.classList.toggle('active', isSelected);
        if (isSelected) {
            // Animate button
            animate(b, {
                scale: [1, 0.95, 1],
                duration: 300,
                ease: 'outQuad'
            });
        }
    });

    // Update filtered posts array
    if (selectedTag === 'all') {
        filteredPosts = [...state.blogPosts];
    } else {
        filteredPosts = state.blogPosts.filter(post => {
            const postTags = post.tags.map(t => t.trim());
            return postTags.includes(selectedTag);
        });
    }

    // Filter using Isotope. Slugify the selected tag so filter values
    // match the .tag-* class names emitted by the template (which
    // downcase + replace spaces with dashes).
    const tagSlug = selectedTag.toLowerCase().replace(/\s+/g, '-');
    const filterValue = selectedTag === 'all' ? '*' : `.tag-${tagSlug}`;

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
function initializeTagFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedTag = btn.getAttribute('data-tag');
            selectTag(selectedTag);
            updateHistory();
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
        // Recalculate Isotope layout on resize
        if (iso) {
            // Temporarily disable transitions for smoother resize
            const originalDuration = iso.options.transitionDuration;
            iso.options.transitionDuration = 0;

            iso.layout();

            // Re-enable transitions after layout completes
            requestAnimationFrame(() => {
                if (iso) {
                    iso.options.transitionDuration = originalDuration;
                }
            });
        }
    }, 150);
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
    constructor(container, existingPlayer = null) {
        this.container = container;
        this.audioUrl = container.getAttribute('data-audio-url');
        this.canvas = container.querySelector('.audio-waveform');
        this.playBtn = container.querySelector('.audio-play-btn');
        this.playIcon = container.querySelector('.play-icon');
        this.pauseIcon = container.querySelector('.pause-icon');
        this.timeDisplay = container.querySelector('.audio-time');
        this.durationDisplay = container.querySelector('.audio-duration');

        this.ctx = this.canvas.getContext('2d');

        // If we have an existing player with the same audio URL, reuse it
        if (existingPlayer && existingPlayer.audioUrl === this.audioUrl) {
            this.audio = existingPlayer.audio;
            this.audioContext = existingPlayer.audioContext;
            this.waveformData = existingPlayer.waveformData;
            this.isPlaying = existingPlayer.isPlaying;
            this.isLoaded = existingPlayer.isLoaded;
            this.isLoading = existingPlayer.isLoading;

            // Sync UI state
            this.syncUIState();
            this.setupEventListeners();

            // If already loaded, draw the waveform
            if (this.isLoaded) {
                this.resizeCanvas();
                this.drawWaveform(this.audio.currentTime / this.audio.duration);
            }
        } else {
            this.audio = new Audio(this.audioUrl);
            this.audioContext = null;
            this.analyser = null;
            this.source = null;
            this.waveformData = null;
            this.isPlaying = false;
            this.isLoaded = false;
            this.isLoading = false;

            this.init();
        }
    }

    syncUIState() {
        // Sync play/pause button state
        if (this.isPlaying) {
            this.playIcon.style.display = 'none';
            this.pauseIcon.style.display = 'block';
        } else {
            this.playIcon.style.display = 'block';
            this.pauseIcon.style.display = 'none';
        }

        // Sync time displays
        this.timeDisplay.textContent = this.formatTime(this.audio.currentTime);
        this.durationDisplay.textContent = this.formatTime(this.audio.duration);
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
            // Show loading state
            this.isLoading = true;

            // Create loading UI
            this.showLoadingUI();

            // Fetch audio file
            const response = await fetch(this.audioUrl);
            const reader = response.body.getReader();

            let receivedLength = 0;
            const chunks = [];

            // Download
            while(true) {
                const {done, value} = await reader.read();

                if (done) break;

                chunks.push(value);
                receivedLength += value.length;
            }

            // Combine chunks
            const chunksAll = new Uint8Array(receivedLength);
            let position = 0;
            for(let chunk of chunks) {
                chunksAll.set(chunk, position);
                position += chunk.length;
            }
            const arrayBuffer = chunksAll.buffer;

            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Decode audio data
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // Extract waveform progressively
            this.waveformData = await this.extractWaveformDataProgressive(audioBuffer);

            // Update duration display
            this.durationDisplay.textContent = this.formatTime(this.audio.duration || audioBuffer.duration);

            this.isLoading = false;
            this.isLoaded = true;

            // Remove loading UI
            this.removeLoadingUI();

            // Draw final waveform
            this.drawWaveform(0);
        } catch (error) {
            console.error('Error loading audio:', error);
            this.isLoading = false;
            this.removeLoadingUI();
        }
    }

    showLoadingUI() {
        // Create loading container
        const loadingContainer = document.createElement('div');
        loadingContainer.className = 'audio-loading';
        loadingContainer.dataset.audioLoading = 'true';

        // Create text
        const loadingText = document.createElement('div');
        loadingText.className = 'audio-loading-text';
        loadingText.textContent = 'Loading Audio...';

        // Create bars container
        const barsContainer = document.createElement('div');
        barsContainer.className = 'audio-loading-bars';

        // Create 5 animated bars
        for (let i = 0; i < 5; i++) {
            const bar = document.createElement('div');
            bar.className = 'audio-loading-bar';
            barsContainer.appendChild(bar);
        }

        loadingContainer.appendChild(loadingText);
        loadingContainer.appendChild(barsContainer);

        // Wrap canvas in a positioned container if not already wrapped
        if (!this.canvas.parentElement.classList.contains('audio-waveform-container')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'audio-waveform-container';
            this.canvas.parentElement.insertBefore(wrapper, this.canvas);
            wrapper.appendChild(this.canvas);
        }

        // Add loading UI to the wrapper
        this.canvas.style.opacity = '0.3';
        this.canvas.parentElement.appendChild(loadingContainer);
    }

    removeLoadingUI() {
        const loadingContainer = this.canvas.parentElement.querySelector('[data-audio-loading="true"]');
        if (loadingContainer) {
            loadingContainer.remove();
        }
        this.canvas.style.opacity = '1';
    }


    async extractWaveformDataProgressive(audioBuffer) {
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

            // Draw progressively every 10 samples
            if (i % 10 === 0 || i === samples - 1) {
                const progress = 0.8 + (i / samples) * 0.2;
                this.drawLoadingProgress(progress, filteredData.slice());
                // Yield to UI thread
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        // Normalize data
        const max = Math.max(...filteredData);
        return filteredData.map(n => n / max);
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

    drawLoadingState() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;

        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);

        // Draw placeholder bars
        const styles = getComputedStyle(document.body);
        const mutedColor = styles.getPropertyValue('--text-muted').trim();
        this.ctx.fillStyle = mutedColor;
        this.ctx.globalAlpha = 0.2;

        const barCount = 500;
        const barWidth = width / barCount;
        const centerY = height / 2;

        for (let i = 0; i < barCount; i++) {
            const x = i * barWidth;
            const barHeight = height * 0.3; // Placeholder height
            this.ctx.fillRect(
                x,
                centerY - barHeight / 2,
                barWidth * 0.8,
                barHeight
            );
        }
        this.ctx.globalAlpha = 1;
    }

    drawLoadingProgress(progress, partialWaveformData = null) {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;

        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);

        // Get colors from CSS variables
        const styles = getComputedStyle(document.body);
        const accentColor = styles.getPropertyValue('--accent-primary').trim();
        const mutedColor = styles.getPropertyValue('--text-muted').trim();

        const centerY = height / 2;

        if (partialWaveformData && partialWaveformData.length > 0) {
            // Draw the waveform we have so far
            const max = Math.max(...partialWaveformData);
            const normalizedData = partialWaveformData.map(n => n / max);
            const barWidth = width / 500; // Total expected samples

            normalizedData.forEach((value, index) => {
                const barHeight = value * (height * 0.8);
                const x = index * barWidth;

                this.ctx.fillStyle = accentColor;
                this.ctx.fillRect(
                    x,
                    centerY - barHeight / 2,
                    barWidth * 0.8,
                    barHeight
                );
            });

            // Draw placeholder for remaining bars
            this.ctx.fillStyle = mutedColor;
            this.ctx.globalAlpha = 0.2;
            for (let i = normalizedData.length; i < 500; i++) {
                const x = i * barWidth;
                const barHeight = height * 0.3;
                this.ctx.fillRect(
                    x,
                    centerY - barHeight / 2,
                    barWidth * 0.8,
                    barHeight
                );
            }
            this.ctx.globalAlpha = 1;
        } else {
            // Show download progress bar
            const progressWidth = width * progress;

            // Background
            this.ctx.fillStyle = mutedColor;
            this.ctx.globalAlpha = 0.2;
            this.ctx.fillRect(0, centerY - 2, width, 4);
            this.ctx.globalAlpha = 1;

            // Progress
            this.ctx.fillStyle = accentColor;
            this.ctx.fillRect(0, centerY - 2, progressWidth, 4);
        }
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
        // Play/pause button - stop propagation to prevent opening viewer
        this.playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePlay();
        });

        // Canvas click for scrubbing - stop propagation to prevent opening viewer
        this.canvas.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleCanvasClick(e);
        });

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

    // Clean up any players whose containers are no longer in the DOM
    const containersToRemove = [];
    audioPlayers.forEach((_player, container) => {
        if (!document.body.contains(container)) {
            containersToRemove.push(container);
        }
    });
    containersToRemove.forEach(container => audioPlayers.delete(container));

    audioContainers.forEach(container => {
        // Skip if already initialized
        if (audioPlayers.has(container)) return;

        const audioUrl = container.getAttribute('data-audio-url');

        // Check if there's an existing player with the same URL (from grid view)
        let existingPlayer = null;
        for (const [existingContainer, player] of audioPlayers.entries()) {
            if (player.audioUrl === audioUrl && existingContainer !== container) {
                existingPlayer = player;
                break;
            }
        }

        const player = new AudioPlayer(container, existingPlayer);
        audioPlayers.set(container, player);
    });
}

function setupAudioPlayersInViewer() {
    // Wait for DOM to update and elements to be fully rendered
    setTimeout(() => {
        setupAudioPlayers();
    }, 100);
}
