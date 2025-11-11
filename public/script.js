// ============================================
// Navigation & Mobile Menu
// ============================================
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const navbar = document.querySelector('.navbar');

// Toggle Mobile Navigation Menu
hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('nav-active');
    hamburger.classList.toggle('toggle');
    document.body.style.overflow = navLinks.classList.contains('nav-active') ? 'hidden' : '';
});

// Smooth Scrolling for Anchor Links
const links = document.querySelectorAll('.nav-links a');

for (const link of links) {
    link.addEventListener('click', clickHandler);
}

function clickHandler(e) {
  const href = this.getAttribute('href');

  // Only prevent default if href starts with '#', indicating an anchor link
  if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
          target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
          });
      }

      // Close mobile menu after clicking
      if (navLinks.classList.contains('nav-active')) {
          navLinks.classList.remove('nav-active');
          hamburger.classList.remove('toggle');
          document.body.style.overflow = '';
      }
  }
}

// ============================================
// Navbar Scroll Effect
// ============================================
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Add scrolled class for glass effect
    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});


// ============================================
// Mouse Tracking for Project Cards
// ============================================
const projectItems = document.querySelectorAll('.project-item');

projectItems.forEach(item => {
    item.addEventListener('mousemove', (e) => {
        const rect = item.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        item.style.setProperty('--mouse-x', `${x}%`);
        item.style.setProperty('--mouse-y', `${y}%`);
    });
});

// ============================================
// Cursor Follow Effect (Desktop Only)
// ============================================
if (window.innerWidth > 768) {
    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    document.body.appendChild(cursor);

    const cursorDot = document.createElement('div');
    cursorDot.classList.add('custom-cursor-dot');
    document.body.appendChild(cursorDot);

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let dotX = 0, dotY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        dotX = e.clientX;
        dotY = e.clientY;

        cursorDot.style.left = dotX + 'px';
        cursorDot.style.top = dotY + 'px';
    });

    function animateCursor() {
        const speed = 0.15;

        cursorX += (mouseX - cursorX) * speed;
        cursorY += (mouseY - cursorY) * speed;

        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';

        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Add hover effects for interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .cta, .email-link, .resume-button');

    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
            cursorDot.classList.add('hover');
        });

        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
            cursorDot.classList.remove('hover');
        });
    });

    // Add CSS for custom cursor
    const style = document.createElement('style');
    style.textContent = `
        * {
            cursor: none !important;
        }

        .custom-cursor {
            width: 40px;
            height: 40px;
            border: 2px solid rgba(99, 102, 241, 0.4);
            border-radius: 50%;
            position: fixed;
            pointer-events: none;
            z-index: 10000;
            transform: translate(-50%, -50%);
            transition: width 0.3s ease, height 0.3s ease, border-color 0.3s ease;
            mix-blend-mode: difference;
        }

        .custom-cursor.hover {
            width: 60px;
            height: 60px;
            border-color: rgba(236, 72, 153, 0.6);
        }

        .custom-cursor-dot {
            width: 6px;
            height: 6px;
            background: rgba(99, 102, 241, 0.8);
            border-radius: 50%;
            position: fixed;
            pointer-events: none;
            z-index: 10001;
            transform: translate(-50%, -50%);
            transition: width 0.3s ease, height 0.3s ease, background 0.3s ease;
        }

        .custom-cursor-dot.hover {
            width: 8px;
            height: 8px;
            background: rgba(236, 72, 153, 0.9);
        }
    `;
    document.head.appendChild(style);
}


// ============================================
// Year Auto-Update in Footer
// ============================================
window.addEventListener('load', () => {
    const footer = document.querySelector('footer p');
    if (footer) {
        footer.textContent = footer.textContent.replace('2024', new Date().getFullYear());
    }
});


// ============================================
// Section & Hero Animations (CSS-driven)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('animations-enabled');
    animateHero();
    setupSectionObserver();
    setupProjectReveal();
});

function animateHero() {
    const hero = document.querySelector('#hero');
    if (!hero) {
        return;
    }

    hero.classList.remove('hero-ready');
    requestAnimationFrame(() => {
        hero.classList.add('hero-ready');
    });
}

function setupSectionObserver() {
    const sections = document.querySelectorAll('section:not(#hero)');
    if (!sections.length) {
        return;
    }

    const revealSection = (section) => {
        if (section.classList.contains('in-view')) {
            return;
        }

        section.classList.add('in-view');
        const revealItems = section.querySelectorAll('.section-title, p, .content, .projects, .experience, .email-link');
        revealItems.forEach((el, index) => {
            el.style.transitionDelay = `${Math.min(index * 0.08, 0.6)}s`;
        });
    };

    if (!('IntersectionObserver' in window)) {
        sections.forEach(revealSection);
        return;
    }

    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -80px 0px'
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            }

            const section = entry.target;
            revealSection(section);
            observer.unobserve(section);
        });
    }, observerOptions);

    sections.forEach(section => sectionObserver.observe(section));

    // Fallback in case observer fails to fire (e.g., tab restored)
    setTimeout(() => {
        sections.forEach(section => {
            if (!section.classList.contains('in-view')) {
                revealSection(section);
                sectionObserver.unobserve(section);
            }
        });
    }, 1200);
}

function setupProjectReveal() {
    if (!projectItems.length) {
        return;
    }

    const revealProject = (project) => {
        project.classList.add('project-visible');
    };

    if (!('IntersectionObserver' in window)) {
        projectItems.forEach(revealProject);
        return;
    }

    const projectObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            }

            revealProject(entry.target);
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.2 });

    projectItems.forEach((project, index) => {
        project.style.transitionDelay = `${index * 0.05}s`;
        projectObserver.observe(project);
    });

    setTimeout(() => {
        projectItems.forEach(project => {
            if (!project.classList.contains('project-visible')) {
                revealProject(project);
                projectObserver.unobserve(project);
            }
        });
    }, 1200);
}
