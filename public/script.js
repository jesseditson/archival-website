// Toggle Mobile Navigation Menu
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('nav-active');
    hamburger.classList.toggle('toggle');
});

// Smooth Scrolling for Anchor Links
const links = document.querySelectorAll('.nav-links a');

for (const link of links) {
    link.addEventListener('click', clickHandler);
}

function clickHandler(e) {
    e.preventDefault();
    const href = this.getAttribute('href');

    document.querySelector(href).scrollIntoView({
        behavior: 'smooth'
    });

    // Close mobile menu after clicking
    if (navLinks.classList.contains('nav-active')) {
        navLinks.classList.remove('nav-active');
        hamburger.classList.remove('toggle');
    }
}