const target = document.getElementById('scroll-animate-target');
const triggerPoint = 800;

function updateVisibility() {
  if (!target) return;

  if (window.scrollY > triggerPoint) {
    target.classList.add('visible');
  } else {
    target.classList.remove('visible');
  }
}

window.addEventListener('scroll', updateVisibility);
window.addEventListener('load', updateVisibility);

const navToggle = document.querySelector('.mobile-nav-toggle');
const mobileNav = document.getElementById('mobile-nav');

navToggle.addEventListener('click', () => {
  mobileNav.classList.toggle('nav-open');
  const isExpanded = mobileNav.classList.contains('nav-open');
  navToggle.setAttribute('aria-expanded', isExpanded);
});

mobileNav.addEventListener('click', (e) => {
  if (e.target.classList.contains('nav-item')) {
    mobileNav.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});
