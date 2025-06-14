function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.testimonial-track').forEach(track => {
    // collect and shuffle original items
    const items = Array.from(track.children);
    shuffle(items);
    const originalHTML = items.map(item => item.outerHTML).join('');
    track.innerHTML = originalHTML;
    // duplicate until wide enough
    const marquee = track.parentElement;
    const containerWidth = marquee.clientWidth;
    while (track.scrollWidth < 2 * containerWidth) {
      track.innerHTML += originalHTML;
    }
  });
});