const toggle = document.getElementById('theme-toggle') as HTMLElement;
const root = document.documentElement;
const stored = localStorage.getItem('theme');
if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  root.setAttribute('data-theme', 'dark');
}
toggle.addEventListener('click', function() {
  const isDark = root.getAttribute('data-theme') === 'dark';
  if (isDark) {
    root.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  } else {
    root.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }
});
