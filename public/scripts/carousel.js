function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Collect unique testimonials from the marquee tracks before duplication
  const allTestimonials = [];
  const seen = new Set();
  document.querySelectorAll('.testimonial-marquee .testimonial-item').forEach(item => {
    const key = item.textContent.trim();
    if (!seen.has(key)) {
      seen.add(key);
      allTestimonials.push(item.innerHTML);
    }
  });

  // Desktop: marquee setup
  document.querySelectorAll('.testimonial-track').forEach(track => {
    const items = Array.from(track.children);
    shuffle(items);
    const originalHTML = items.map(item => item.outerHTML).join('');
    track.innerHTML = originalHTML;
    const marquee = track.parentElement;
    const containerWidth = marquee.clientWidth;
    while (track.scrollWidth < 2 * containerWidth) {
      track.innerHTML += originalHTML;
    }
  });

  // Mobile: crossfade between random testimonials
  const mobileContainer = document.querySelector('.testimonial-mobile-fade');
  if (!mobileContainer || allTestimonials.length < 2) return;

  const mobileSlots = mobileContainer.querySelectorAll('.testimonial-mobile-slot');
  if (mobileSlots.length < 2) return;

  // Each slot has two stacked .testimonial-item elements: [front, back]
  // front is visible, back is hidden (fade-out). To crossfade, we swap roles.
  const slotState = Array.from(mobileSlots).map(slot => {
    const items = slot.querySelectorAll('.testimonial-item');
    return { front: items[0], back: items[1], currentIndex: -1 };
  });

  // Track which testimonial indices are currently visible
  const shownIndices = new Set();

  function pickRandom(exclude) {
    const available = allTestimonials
      .map((_, i) => i)
      .filter(i => !exclude.has(i));
    if (available.length === 0) {
      return Math.floor(Math.random() * allTestimonials.length);
    }
    return available[Math.floor(Math.random() * available.length)];
  }

  // Measure the tallest testimonial and lock slot heights to prevent layout shift
  const measureSlot = mobileSlots[0];
  const measureItem = slotState[0].front;
  let maxHeight = 0;
  for (const html of allTestimonials) {
    measureItem.innerHTML = html;
    maxHeight = Math.max(maxHeight, measureSlot.offsetHeight);
  }
  mobileSlots.forEach(slot => { slot.style.minHeight = maxHeight + 'px'; });

  // Initialize with 2 random testimonials
  shuffle(allTestimonials);
  slotState[0].front.innerHTML = allTestimonials[0];
  slotState[0].currentIndex = 0;
  slotState[1].front.innerHTML = allTestimonials[1];
  slotState[1].currentIndex = 1;
  shownIndices.add(0);
  shownIndices.add(1);

  // Cycle: every 4 seconds, crossfade one random slot
  let lastSlotIndex = -1;
  setInterval(() => {
    let slotIndex;
    do {
      slotIndex = Math.floor(Math.random() * 2);
    } while (slotIndex === lastSlotIndex);
    lastSlotIndex = slotIndex;

    const state = slotState[slotIndex];
    const newIndex = pickRandom(shownIndices);

    // Load new content into the hidden back layer
    state.back.innerHTML = allTestimonials[newIndex];

    // Crossfade: fade out front, fade in back
    state.front.classList.add('fade-out');
    state.back.classList.remove('fade-out');

    // After transition, swap front/back references and update tracking
    setTimeout(() => {
      shownIndices.delete(state.currentIndex);
      shownIndices.add(newIndex);
      state.currentIndex = newIndex;

      // Swap roles: what was back is now front
      const temp = state.front;
      state.front = state.back;
      state.back = temp;
    }, 600);
  }, 4000);
});