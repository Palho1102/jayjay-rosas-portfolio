/**
 * Main Application Controller
 */

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'auto';
}

document.addEventListener('DOMContentLoaded', async () => {
  // Load modular HTML components
  const containers = document.querySelectorAll('[data-include]');
  
  await Promise.all(
    Array.from(containers).map(async (el) => {
      const path = el.getAttribute('data-include');
      try {
        const response = await fetch(path);
        if (response.ok) {
          el.innerHTML = await response.text();
        } else {
          console.error(`Error loading ${path}: Status ${response.status}`);
        }
      } catch (err) {
        console.error(`Fetch exception for ${path}:`, err);
      }
    })
  );

  // Initialize unified Marquee & Selection system
  initUnifiedCertifications();

  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Setup UI listeners
  initNavigation();
  initStickyNavbar();

  // Safe anchor navigation
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }
});

/**
 * =========================================================================
 * FLUID LERP-DRIVEN MARQUEE & MANUAL INTERACTION ENGINE
 * - Automatic right-to-left scrolling
 * - 3-second pause on card or button click (debounced)
 * - Immediate open of certificate PDF modal on View clicks
 * - Wheel and touch interaction support
 * =========================================================================
 */
function initUnifiedCertifications() {
  const viewport = document.getElementById('cert-carousel-viewport');
  const track = document.getElementById('cert-carousel-track');
  if (!viewport || !track || typeof CERTIFICATES_DATA === 'undefined') return;

  const colorStyles = {
    blue: {
      borderTop: 'border-t-accent-blue',
      badgeBg: 'bg-accent-blueBg',
      badgeText: 'text-accent-blue',
      iconBg: 'bg-blue-50',
      iconText: 'text-accent-blue'
    },
    indigo: {
      borderTop: 'border-t-accent-indigo',
      badgeBg: 'bg-accent-indigoBg',
      badgeText: 'text-accent-indigo',
      iconBg: 'bg-indigo-50',
      iconText: 'text-accent-indigo'
    },
    violet: {
      borderTop: 'border-t-accent-violet',
      badgeBg: 'bg-accent-violetBg',
      badgeText: 'text-accent-violet',
      iconBg: 'bg-purple-50',
      iconText: 'text-accent-violet'
    }
  };

  const createCardHtml = (cert) => {
    const style = colorStyles[cert.accent] || colorStyles.blue;
    return `
      <div 
        data-cert-id="${cert.id}"
        role="button"
        tabindex="0"
        class="cert-card w-[260px] sm:w-[290px] shrink-0 bg-white p-4 rounded-lg border border-surface-border shadow-card border-t-2 ${style.borderTop} flex flex-col justify-between cursor-pointer group transition-colors select-none"
        aria-label="Inspect ${cert.title} details"
      >
        <div class="space-y-2 pointer-events-none">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${style.badgeBg} ${style.badgeText}">
              ${cert.category}
            </span>
            <div class="w-6 h-6 rounded ${style.iconBg} ${style.iconText} flex items-center justify-center">
              <i data-lucide="award" class="w-3.5 h-3.5"></i>
            </div>
          </div>

          <h3 class="text-sm font-bold text-typography-primary leading-snug group-hover:text-accent-blue transition-colors line-clamp-2">
            ${cert.title}
          </h3>
          <p class="text-xs text-typography-muted">${cert.issuer}</p>
        </div>

        <div class="pt-2.5 mt-2 border-t border-surface-border flex items-center justify-between text-xs">
          <span class="font-mono text-typography-muted text-[11px] pointer-events-none">${cert.date}</span>
          <button 
            type="button"
            data-action="view-modal"
            data-cert-id="${cert.id}"
            class="px-2 py-1 rounded bg-accent-blueBg border border-blue-200 text-accent-blue font-semibold text-[11px] hover:bg-blue-100 flex items-center gap-1 transition-colors cursor-pointer"
          >
            View <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
          </button>
        </div>
      </div>
    `;
  };

  // Render 3 duplicate sets for continuous infinite wrap
  const cardsHtml = CERTIFICATES_DATA.map(createCardHtml).join('');
  track.innerHTML = cardsHtml + cardsHtml + cardsHtml;

  if (window.lucide) {
    lucide.createIcons();
  }

  // Set default selection
  selectCertificate(CERTIFICATES_DATA[0].id);

  // Position & Interpolation State
  let currentX = 0;
  let targetX = 0;
  let singleSetWidth = 0;
  
  // Interaction and pause flags
  let isWheelActive = false;
  let isPointerDown = false;
  let isModalOpen = false;
  let isPausedForDelay = false;
  let hasDragged = false;
  
  let startPointerX = 0;
  let startTargetX = 0;
  let wheelReleaseTimer = null;
  let pointerReleaseTimer = null;
  let pauseTimer = null;

  const autoSpeed = 0.75;
  const lerpFactor = 0.16;

  function updateMeasurements() {
    singleSetWidth = track.scrollWidth / 3;
    if (currentX === 0 && singleSetWidth > 0) {
      currentX = -singleSetWidth;
      targetX = currentX;
    }
  }

  function wrapBounds() {
    if (singleSetWidth <= 0) return;
    if (Math.abs(targetX) >= singleSetWidth * 2) {
      targetX += singleSetWidth;
      currentX += singleSetWidth;
    } else if (targetX >= 0) {
      targetX -= singleSetWidth;
      currentX -= singleSetWidth;
    }
  }

  // Master Render Loop
  function render() {
    const isManualActive = isWheelActive || isPointerDown;
    const isStationary = isModalOpen || isPausedForDelay;

    if (!isManualActive && !isStationary) {
      targetX -= autoSpeed;
      currentX = targetX;
      wrapBounds();
    } else if (isWheelActive) {
      const diff = targetX - currentX;
      if (Math.abs(diff) > 0.1) {
        currentX += diff * lerpFactor;
      } else {
        currentX = targetX;
      }
      wrapBounds();
    } else if (isPointerDown) {
      currentX = targetX;
      wrapBounds();
    }

    track.style.transform = `translate3d(${currentX}px, 0, 0)`;
    requestAnimationFrame(render);
  }

  // 3-second marquee pause controller
  function pauseMarquee(durationMs = 3000) {
    isPausedForDelay = true;
    targetX = currentX;

    if (pauseTimer) {
      clearTimeout(pauseTimer);
    }

    pauseTimer = setTimeout(() => {
      isPausedForDelay = false;
      targetX = currentX; // Synchronize target upon resuming
    }, durationMs);
  }

  // External controller hooks
  window.CertMarqueeEngine = {
    setModalActive: (open) => {
      isModalOpen = open;
      if (!open) {
        targetX = currentX;
      }
    },
    step: (direction) => {
      isWheelActive = true;
      pauseMarquee(3000);
      const stepDist = 320;
      targetX += direction === 'left' ? stepDist : -stepDist;
      
      if (wheelReleaseTimer) clearTimeout(wheelReleaseTimer);
      wheelReleaseTimer = setTimeout(() => {
        isWheelActive = false;
        targetX = currentX;
      }, 250);
    },
    pause: pauseMarquee
  };

  // --- MOUSE WHEEL ---
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    e.stopPropagation();

    isWheelActive = true;
    let delta = 0;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      delta = e.deltaX;
    } else {
      const lineMultiplier = e.deltaMode === 1 ? 24 : 1;
      delta = e.deltaY * lineMultiplier;
    }

    const clampedDelta = Math.max(Math.min(delta, 120), -120);
    targetX -= clampedDelta * 1.1;

    if (wheelReleaseTimer) clearTimeout(wheelReleaseTimer);
    wheelReleaseTimer = setTimeout(() => {
      isWheelActive = false;
      targetX = currentX;
    }, 180);
  }, { passive: false });

  // --- MOUSE DRAG ---
  viewport.addEventListener('mousedown', (e) => {
    isPointerDown = true;
    hasDragged = false;
    startPointerX = e.pageX;
    startTargetX = targetX;
    if (pointerReleaseTimer) clearTimeout(pointerReleaseTimer);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isPointerDown || isModalOpen) return;
    const deltaX = e.pageX - startPointerX;

    if (Math.abs(deltaX) > 4) {
      hasDragged = true;
      targetX = startTargetX + deltaX;
      currentX = targetX;
      wrapBounds();
    }
  });

  window.addEventListener('mouseup', () => {
    if (isPointerDown) {
      if (pointerReleaseTimer) clearTimeout(pointerReleaseTimer);
      pointerReleaseTimer = setTimeout(() => {
        isPointerDown = false;
        targetX = currentX;
      }, 100);
    }
  });

  // --- TOUCH EVENTS ---
  viewport.addEventListener('touchstart', (e) => {
    isPointerDown = true;
    hasDragged = false;
    startPointerX = e.touches[0].pageX;
    startTargetX = targetX;
    if (pointerReleaseTimer) clearTimeout(pointerReleaseTimer);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isPointerDown || isModalOpen || !e.touches || e.touches.length === 0) return;
    const deltaX = e.touches[0].pageX - startPointerX;

    if (Math.abs(deltaX) > 5) {
      hasDragged = true;
      targetX = startTargetX + deltaX;
      currentX = targetX;
      wrapBounds();
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (isPointerDown) {
      if (pointerReleaseTimer) clearTimeout(pointerReleaseTimer);
      pointerReleaseTimer = setTimeout(() => {
        isPointerDown = false;
        targetX = currentX;
      }, 100);
    }
  });

  // --- CLICK ROUTING & DELEGATION ---
  track.addEventListener('click', (e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // 1. Click on card's "View" button
    const viewBtn = e.target.closest('[data-action="view-modal"]');
    if (viewBtn) {
      e.preventDefault();
      e.stopPropagation();
      const certId = viewBtn.getAttribute('data-cert-id');

      // Pause marquee for 3 seconds immediately without blocking modal
      pauseMarquee(3000);

      if (certId && typeof openCertificateViewer === 'function') {
        selectCertificate(certId);
        openCertificateViewer(certId);
      }
      return;
    }

    // 2. Click on card itself (selects certificate and pauses marquee for 2 seconds)
    const card = e.target.closest('.cert-card');
    if (card) {
      const certId = card.getAttribute('data-cert-id');
      if (certId) {
        pauseMarquee(2000);
        selectCertificate(certId);
      }
    }
  });

  requestAnimationFrame(() => {
    updateMeasurements();
    render();
  });
}

/**
 * Select a certificate to showcase in the details inspector panel
 */
function selectCertificate(certId) {
  if (typeof CERTIFICATES_DATA === 'undefined') return;

  const cert = CERTIFICATES_DATA.find((c) => c.id === certId);
  if (!cert) return;

  const titleEl = document.getElementById('detailTitle');
  const issuerEl = document.getElementById('detailIssuer');
  const dateEl = document.getElementById('detailDate');
  const categoryEl = document.getElementById('detailCategory');
  const descEl = document.getElementById('detailDescription');
  const viewBtn = document.getElementById('detailViewBtn');

  if (titleEl) titleEl.textContent = cert.title;
  if (issuerEl) issuerEl.textContent = cert.issuer;
  if (dateEl) dateEl.textContent = cert.date;
  if (categoryEl) categoryEl.textContent = cert.category;
  if (descEl) descEl.textContent = cert.description;

  // Bind the featured View Certificate button
  if (viewBtn) {
    viewBtn.onclick = (e) => {
      e.preventDefault();
      if (window.CertMarqueeEngine && typeof window.CertMarqueeEngine.pause === 'function') {
        window.CertMarqueeEngine.pause(3000);
      }
      if (typeof openCertificateViewer === 'function') {
        openCertificateViewer(cert.id);
      }
    };
  }

  // Update card active highlights across marquee copies
  document.querySelectorAll('.cert-card').forEach((card) => {
    if (card.getAttribute('data-cert-id') === cert.id) {
      card.classList.add('border-accent-blue', 'ring-1', 'ring-blue-300');
    } else {
      card.classList.remove('border-accent-blue', 'ring-1', 'ring-blue-300');
    }
  });
}

/**
 * Step carousel manually with Left / Right buttons
 */
function stepMarquee(direction) {
  if (window.CertMarqueeEngine) {
    window.CertMarqueeEngine.step(direction);
  }
}

/**
 * Mobile Navigation Drawer Toggle
 */
function initNavigation() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');

  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => {
      const isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', !isOpen);
      menu.classList.toggle('hidden');
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.add('hidden');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

/**
 * Sticky Navbar Elevation
 */
function initStickyNavbar() {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 15) {
        navbar.classList.add('shadow-sm');
      } else {
        navbar.classList.remove('shadow-sm');
      }
    });
  }
}

/**
 * Contact Form Handler
 */
function handleContactSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('submitBtn');
  const successNotice = document.getElementById('formSuccess');

  if (!submitBtn || !successNotice) return;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Sending...';
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5"></i> Message Sent';
    if (window.lucide) lucide.createIcons();
    successNotice.classList.remove('hidden');
    document.getElementById('contactForm').reset();

    setTimeout(() => {
      submitBtn.innerHTML = '<i data-lucide="send" class="w-3.5 h-3.5"></i> Send Message';
      if (window.lucide) lucide.createIcons();
      successNotice.classList.add('hidden');
    }, 4000);
  }, 800);
}