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