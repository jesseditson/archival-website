(function() {
  const BATCH = 9;
  const grid = document.querySelector('.story-grid');
  if (!grid) return;
  const cards = grid.querySelectorAll('.story-card');
  if (cards.length <= BATCH) return;

  let shown = BATCH;
  for (let i = shown; i < cards.length; i++) {
    cards[i].classList.add('story-card--hidden');
  }

  const sentinel = document.getElementById('load-more-sentinel') as HTMLElement;
  sentinel.classList.add('load-more-sentinel--active');

  const observer = new IntersectionObserver(function(entries) {
    if (!entries[0].isIntersecting) return;
    const end = Math.min(shown + BATCH, cards.length);
    for (let i = shown; i < end; i++) {
      cards[i].classList.remove('story-card--hidden');
    }
    shown = end;
    if (shown >= cards.length) {
      sentinel.classList.remove('load-more-sentinel--active');
      observer.disconnect();
    }
  }, { rootMargin: '400px' });

  observer.observe(sentinel);
})();
