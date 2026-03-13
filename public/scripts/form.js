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
      const serviceSelect = document.getElementById('contact-service');
      if (serviceSelect) {
        const options = Array.from(serviceSelect.options);
        const matchingOption = options.find(option =>
          option.value === serviceName || option.textContent.trim() === serviceName
        );

        if (matchingOption) {
          serviceSelect.value = matchingOption.value;
        }
      }

      // Scroll to the booking section quickly
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        const targetPosition = contactSection.getBoundingClientRect().top + window.pageYOffset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 400; // milliseconds (faster scroll)
        let start = null;

        function animation(currentTime) {
          if (start === null) start = currentTime;
          const timeElapsed = currentTime - start;
          const run = ease(timeElapsed, startPosition, distance, duration);
          window.scrollTo(0, run);
          if (timeElapsed < duration) {
            requestAnimationFrame(animation);
          } else {
            const nameInput = document.getElementById('contact-name');
            if (nameInput) nameInput.focus();
          }
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

// Focus the name field when navigating to #contact via any anchor link
document.querySelectorAll('a[href="#contact"], a[href="/#contact"]').forEach(link => {
  link.addEventListener('click', () => {
    setTimeout(() => {
      const nameInput = document.getElementById('contact-name');
      if (nameInput) nameInput.focus();
    }, 50);
  });
});

// Auto-select service in booking form based on URL parameter (for page loads with hash)
document.addEventListener('DOMContentLoaded', () => {
  // Check both hash and search params for service parameter
  let serviceParam = null;
  let submitParam = null;
  let errorMessage = null;

  // Check if service is in the hash (e.g., #contact?service=ServiceName)
  if (window.location.hash.includes('?')) {
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
    serviceParam = hashParams.get('service');
  }

  // Fallback to regular query params
  if (!serviceParam) {
    const urlParams = new URLSearchParams(window.location.search);
    serviceParam = urlParams.get('service');
    submitParam = urlParams.get('submitStatus');
    errorMessage = urlParams.get('error');
  }

  // Focus the name field when arriving at the page with #contact in the URL
  if (window.location.hash.startsWith('#contact')) {
    setTimeout(() => {
      const nameInput = document.getElementById('contact-name');
      if (nameInput) nameInput.focus();
    }, 100);
  }

  if (serviceParam) {
    const serviceSelect = document.getElementById('contact-service');

    if (serviceSelect) {
      // Find and select the matching option
      const options = Array.from(serviceSelect.options);
      const matchingOption = options.find(option =>
        option.value === serviceParam || option.textContent.trim() === serviceParam
      );

      if (matchingOption) {
        serviceSelect.value = matchingOption.value;
      }
    }
  }

  if (submitParam) {
    const contactElement = document.querySelector("#contact");
    const completeElement = document.querySelector("#contact-complete");
    const errorElement = document.querySelector("#contact-complete-error");
    if (errorMessage) {
      const messageElement = document.querySelector("#contact-complete-message");
      errorElement.innerText = errorMessage;
      errorElement.style.removeProperty("display");
      messageElement.style.setProperty("display", "none");
    }
    completeElement.style.removeProperty("display");
    contactElement.style.setProperty("display", "none");
  }
});
