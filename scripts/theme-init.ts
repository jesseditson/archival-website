// Loaded as a blocking classic script in <head>, so a saved light theme is applied before first paint.
if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.add('light-theme');
}
