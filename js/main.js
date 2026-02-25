/**
 * main.js
 * -------
 * Vanilla JavaScript for a single-page scrollable academic seminar presentation.
 * Handles: progress bar, scroll-to-top, reveal animations, nav dots,
 *          lightbox, KaTeX rendering, and smooth scrolling.
 *
 * No frameworks or libraries required (KaTeX loaded separately via CDN).
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. Reading Progress Bar
     - Fixed bar at the top of the page whose width reflects scroll progress.
     - Uses requestAnimationFrame to debounce scroll updates.
     ========================================================================== */

  const progressBar = document.querySelector('.progress-bar');
  let ticking = false;

  function updateProgressBar() {
    if (!progressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateProgressBar);
      ticking = true;
    }
  }, { passive: true });

  // Set initial state on load
  updateProgressBar();


  /* ==========================================================================
     2. Scroll-to-Top Button
     - Appears after scrolling past 600px.
     - Smooth-scrolls to the top of the page on click.
     ========================================================================== */

  const scrollTopBtn = document.querySelector('.scroll-top');

  function toggleScrollTopButton() {
    if (!scrollTopBtn) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 600) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  }

  // Re-use the same scroll listener pattern with rAF (shares the ticking guard
  // only for the progress bar; this one is lightweight enough to run directly).
  window.addEventListener('scroll', toggleScrollTopButton, { passive: true });

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Set initial state
  toggleScrollTopButton();


  /* ==========================================================================
     3. Scroll Reveal Animations (IntersectionObserver)
     - Elements with class `.reveal` animate in once when they enter the viewport.
     - After revealing, the element is unobserved (one-time animation).
     ========================================================================== */

  const revealElements = document.querySelectorAll('.reveal');

  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach((el) => revealObserver.observe(el));
  }


  /* ==========================================================================
     4. Nav Dots Active State Tracking
     - Sidebar navigation dots that highlight based on the currently visible
       section. Uses IntersectionObserver on each section.
     ========================================================================== */

  const navDots = document.querySelectorAll('.nav-dot');
  const sections = document.querySelectorAll('section[id]');

  if (navDots.length > 0 && sections.length > 0) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navDots.forEach((dot) => {
            // Match dot to section via href or data-target attribute
            const dotTarget = dot.getAttribute('data-target') ||
                              dot.getAttribute('href');
            if (dotTarget === '#' + id) {
              dot.classList.add('active');
            } else {
              dot.classList.remove('active');
            }
          });
        }
      });
    }, {
      threshold: 0.3
    });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  // Nav dot click -> smooth scroll to corresponding section
  navDots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = dot.getAttribute('data-target') ||
                       dot.getAttribute('href');
      if (!targetId) return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });


  /* ==========================================================================
     5. Nav Dot Tooltips
     - Each `.nav-dot` may carry a `data-label` attribute.
     - CSS handles the tooltip display; JS ensures the attribute is present
       and accessible (no additional logic needed beyond what CSS provides).
     - If any dot is missing its data-label, we set a sensible fallback.
     ========================================================================== */

  navDots.forEach((dot, index) => {
    if (!dot.hasAttribute('data-label') || dot.getAttribute('data-label') === '') {
      const targetId = dot.getAttribute('data-target') ||
                       dot.getAttribute('href') || '';
      const fallbackLabel = targetId.replace('#', '').replace('sec', 'Section ') || ('Section ' + (index + 1));
      dot.setAttribute('data-label', fallbackLabel);
    }
  });


  /* ==========================================================================
     6. Image Lightbox
     - Clicking a `.lightbox-trigger` image opens a full-screen overlay.
     - Close via overlay click, close button, or Escape key.
     ========================================================================== */

  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = lightbox ? lightbox.querySelector('.lightbox-content img') : null;
  const lightboxClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;
  const lightboxTriggers = document.querySelectorAll('.lightbox-trigger');

  /**
   * Open the lightbox with the given image source.
   * @param {string} src - The image URL to display.
   */
  function openLightbox(src) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.setAttribute('src', src);
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /** Close the lightbox and restore page scrolling. */
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Open on trigger click
  lightboxTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const src = trigger.getAttribute('src') ||
                  trigger.getAttribute('data-src') || '';
      if (src) {
        openLightbox(src);
      }
    });
  });

  // Close on overlay click (but not on the image itself)
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      // Only close if the click landed on the overlay background,
      // not on the lightbox image or its container.
      if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
        closeLightbox();
      }
    });
  }

  // Close button
  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });


  /* ==========================================================================
     7. KaTeX Auto-Render
     - If the KaTeX auto-render extension is available (loaded from CDN),
       render all LaTeX delimiters in the page body.
     ========================================================================== */

  try {
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ]
      });
    }
  } catch (err) {
    console.warn('KaTeX auto-render failed:', err);
  }


  /* ==========================================================================
     8. Table of Contents Smooth Scroll
     - Links inside `.toc` scroll smoothly to their targets.
     ========================================================================== */

  const tocLinks = document.querySelectorAll('.toc a');

  tocLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });


  /* ==========================================================================
     9. Smooth Scroll for All Anchor Links
     - Any anchor whose href starts with "#" will smooth-scroll to its target.
     - This is a global handler that also covers TOC links, but the TOC handler
       above runs first for specificity if both match.
     ========================================================================== */

  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

});
