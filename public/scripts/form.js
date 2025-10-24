// Handle service book button clicks
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('service-cta')) {
    e.preventDefault();

    // Extract service name from the href
    const href = e.target.getAttribute('href');
    const match = href.match(/service=([^&]+)/);

    if (match) {
      const serviceName = decodeURIComponent(match[1]);

      // Select the service in the dropdown
      const sessionSelect = document.querySelector('select[name="session"]');
      if (sessionSelect) {
        const options = Array.from(sessionSelect.options);
        const matchingOption = options.find(option =>
          option.value === serviceName || option.textContent.trim() === serviceName
        );

        if (matchingOption) {
          sessionSelect.value = matchingOption.value;
        }
      }

      // Scroll to the booking section quickly
      const bookSection = document.getElementById('book');
      if (bookSection) {
        const targetPosition = bookSection.getBoundingClientRect().top + window.pageYOffset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 400; // milliseconds (faster scroll)
        let start = null;

        function animation(currentTime) {
          if (start === null) start = currentTime;
          const timeElapsed = currentTime - start;
          const run = ease(timeElapsed, startPosition, distance, duration);
          window.scrollTo(0, run);
          if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        // Easing function for smooth animation
        function ease(t, b, c, d) {
          t /= d / 2;
          if (t < 1) return c / 2 * t * t + b;
          t--;
          return -c / 2 * (t * (t - 2) - 1) + b;
        }

        requestAnimationFrame(animation);
      }
    }
  }
});

// Auto-select service in booking form based on URL parameter (for page loads with hash)
document.addEventListener('DOMContentLoaded', () => {
  // Check both hash and search params for service parameter
  let serviceParam = null;

  // Check if service is in the hash (e.g., #book?service=ServiceName)
  if (window.location.hash.includes('?')) {
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
    serviceParam = hashParams.get('service');
  }

  // Fallback to regular query params
  if (!serviceParam) {
    const urlParams = new URLSearchParams(window.location.search);
    serviceParam = urlParams.get('service');
  }

  if (serviceParam) {
    const sessionSelect = document.querySelector('select[name="session"]');

    if (sessionSelect) {
      // Find and select the matching option
      const options = Array.from(sessionSelect.options);
      const matchingOption = options.find(option =>
        option.value === serviceParam || option.textContent.trim() === serviceParam
      );

      if (matchingOption) {
        sessionSelect.value = matchingOption.value;
      }
    }
  }
});
