const navToggle = document.getElementById('nav-toggle') as HTMLInputElement | null;
const navLabel = document.querySelector('label[for="nav-toggle"].nav-toggle');
if (navToggle && navLabel) {
  navLabel.setAttribute('role', 'button');
  navLabel.setAttribute('aria-expanded', 'false');
  navLabel.setAttribute('aria-controls', 'site-nav');
  navToggle.addEventListener('change', function () {
    navLabel.setAttribute('aria-expanded', navToggle.checked ? 'true' : 'false');
  });
}
