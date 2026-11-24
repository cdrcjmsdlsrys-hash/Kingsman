// Kingsman — interactions
(() => {
  const header = document.getElementById('header');
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');

  // Header style on scroll
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Shared body scroll lock (nav menu + booking modal)
  const syncBodyScroll = () => {
    const locked = document.body.classList.contains('nav-open') || document.body.classList.contains('modal-open');
    document.body.style.overflow = locked ? 'hidden' : '';
  };

  // Mobile menu
  const setMenu = (open) => {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    syncBodyScroll();
  };
  toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('nav-open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  // Reveal on scroll (staggered within each parent)
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const siblings = [...entry.target.parentElement.children].filter((el) => el.classList.contains('reveal'));
        entry.target.style.transitionDelay = `${Math.min(siblings.indexOf(entry.target), 5) * 0.1}s`;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  // Booking forms (front-end only — connect to your backend / form service)
  const initBookingForm = (formEl, statusEl) => {
    if (!formEl || !statusEl) return;
    const minDate = new Date().toISOString().split('T')[0];
    const dateInput = formEl.querySelector('input[type="date"]');
    if (dateInput) dateInput.min = minDate;

    formEl.querySelectorAll('[required]').forEach((field) => {
      const clearInvalid = () => {
        if (field.checkValidity()) field.classList.remove('is-invalid');
      };
      field.addEventListener('input', clearInvalid);
      field.addEventListener('change', clearInvalid);
    });

    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      formEl.querySelectorAll('[required]').forEach((field) => {
        const ok = field.checkValidity();
        field.classList.toggle('is-invalid', !ok);
        if (!ok) valid = false;
      });
      if (!valid) {
        statusEl.textContent = 'Please complete the highlighted fields.';
        return;
      }
      const name = formEl.elements.namedItem('name').value.trim().split(' ')[0];
      statusEl.textContent = `Thank you, ${name}. We'll be in touch within one working day to confirm your fitting.`;
      formEl.reset();
    });
  };

  initBookingForm(document.getElementById('bookingForm'), document.getElementById('formStatus'));

  // Booking modal
  const bookingModal = document.getElementById('bookingModal');
  const bookingDialog = bookingModal?.querySelector('.booking-modal__dialog');
  const bookingModalClose = document.getElementById('bookingModalClose');
  const modalBookingForm = document.getElementById('modalBookingForm');
  const modalFormStatus = document.getElementById('modalFormStatus');
  let lastFocused = null;

  initBookingForm(modalBookingForm, modalFormStatus);

  const openBookingModal = ({ message } = {}) => {
    if (!bookingModal) return;
    lastFocused = document.activeElement;
    setMenu(false);
    if (modalFormStatus) modalFormStatus.textContent = '';
    modalBookingForm?.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    if (typeof message === 'string') {
      const msgField = modalBookingForm?.elements.namedItem('message');
      if (msgField) msgField.value = message;
    }
    bookingModal.classList.add('is-open');
    bookingModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    syncBodyScroll();
    requestAnimationFrame(() => modalBookingForm?.elements.namedItem('name')?.focus({ preventScroll: true }));
  };

  const closeBookingModal = () => {
    if (!bookingModal || !bookingModal.classList.contains('is-open')) return;
    bookingModal.classList.remove('is-open');
    bookingModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    syncBodyScroll();
    lastFocused?.focus?.();
    lastFocused = null;
  };

  document.querySelectorAll('[data-open-booking]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openBookingModal();
    });
  });
  bookingModalClose?.addEventListener('click', closeBookingModal);
  bookingModal?.addEventListener('click', (e) => {
    if (e.target === bookingModal) closeBookingModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (bookingModal?.classList.contains('is-open')) {
        closeBookingModal();
      } else {
        setMenu(false);
      }
      return;
    }
    if (e.key === 'Tab' && bookingModal?.classList.contains('is-open') && bookingDialog) {
      const focusables = [...bookingDialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === bookingDialog)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // 3D floating tilt in Atelier intro
  const intro = document.getElementById('intro');
  const stage = document.getElementById('introStage');
  if (intro && stage && window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    intro.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const nx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1);
      const ny = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1);
      stage.classList.add('is-tilting');
      stage.style.setProperty('--ry', `${(nx * 10).toFixed(2)}deg`);
      stage.style.setProperty('--rx', `${(-ny * 8).toFixed(2)}deg`);
      stage.style.setProperty('--sx', `${(-nx * 18).toFixed(1)}px`);
      stage.style.setProperty('--sy', `${(-ny * 8).toFixed(1)}px`);
    });
    intro.addEventListener('pointerleave', () => {
      stage.classList.remove('is-tilting');
      stage.style.setProperty('--rx', '0deg');
      stage.style.setProperty('--ry', '0deg');
      stage.style.setProperty('--sx', '0px');
      stage.style.setProperty('--sy', '0px');
    });
  }

  // Interactive fabric swatch selector
  const FABRICS = {
    'worsted-wool': {
      name: 'Worsted Wool',
      color: '#C49A6C',
      weave: 'twill',
      image: 'assets/images/worsted wool.jpg',
      alt: 'Close-up of worsted wool suiting fabric',
      meta: 'Biella, Italy · 270 g/m² · Super 130s',
      desc: 'Tightly spun from long-staple fleece for a crisp, resilient drape and clean matte finish. Holds a sharp crease from morning meetings through late dinners.',
      tags: ['All-Season', 'Structured Drape', 'Suits & Trousers']
    },
    'irish-linen': {
      name: 'Irish Linen',
      color: '#E9DFD1',
      weave: 'linen',
      image: 'assets/images/irish linen.jpg',
      alt: 'Close-up of woven Irish linen fabric',
      meta: 'County Antrim · 310 g/m² · Pure Flax',
      desc: 'Woven from long flax yarns and washed for character. Cool to the skin with an effortless texture that softens gracefully with every wear.',
      tags: ['Warm Weather', 'Unstructured', 'Relaxed Elegance']
    },
    'brushed-cotton': {
      name: 'Brushed Cotton',
      color: '#8A4B2A',
      weave: 'brushed',
      image: 'assets/images/brushed cotton.jpg',
      alt: 'Close-up of brushed cotton twill fabric',
      meta: 'Lancashire, UK · 340 g/m² · Peached Twill',
      desc: 'Dense cotton twill lightly raised for a suede-like handfeel. Tailors into warm, tactile separates and refined chinos.',
      tags: ['Autumn / Winter', 'Velvety Hand', 'Separates & Chinos']
    },
    'cashmere-blend': {
      name: 'Cashmere Blend',
      color: '#2E211A',
      weave: 'herringbone',
      image: 'assets/images/cashmere blend.jpg',
      alt: 'Close-up of cashmere blend overcoat fabric',
      meta: 'Scottish Borders · 480 g/m² · 70% Wool / 30% Cashmere',
      desc: 'Substantial warmth paired with remarkable softness and rich depth of shade. Tailored for overcoats and winter jackets that skim the shoulders.',
      tags: ['Cold Weather', 'Lofty Finish', 'Overcoats & Jackets']
    },
    'sea-island-cotton': {
      name: 'Sea Island Cotton',
      color: '#F6F1EA',
      weave: 'poplin',
      image: 'assets/images/Sea island cotton.jpg',
      alt: 'Close-up of Sea Island cotton shirting fabric',
      meta: 'West Indies · 125 g/m² · Two-Fold Poplin',
      desc: 'Extra-long staple cotton spun into a smooth, luminous shirting cloth. Exceptionally breathable against the skin with crisp collar recovery.',
      tags: ['Year-Round', 'Silky Sheen', 'Bespoke Shirting']
    },
    'tropical-wool': {
      name: 'Tropical Wool',
      color: '#2F4C7E',
      weave: 'fresco',
      image: 'assets/images/tropical wool.jpg',
      alt: 'Close-up of tropical wool fresco fabric',
      meta: 'Huddersfield, UK · 240 g/m² · High-Twist Fresco',
      desc: 'An open-weave high-twist wool engineered for warm climates and long-haul travel. Air passes freely while creases bounce right out.',
      tags: ['High Breathability', 'Crease-Resistant', 'Travel Suiting']
    }
  };

  const swatchBtns = [...document.querySelectorAll('.swatch-btn')];
  const fabricMedia = document.getElementById('fabricMedia');
  const fabricPanel = document.getElementById('fabricPanel');
  const fabricChip = document.getElementById('fabricChip');
  const fabricMeta = document.getElementById('fabricMeta');
  const fabricTitle = document.getElementById('fabricTitle');
  const fabricDesc = document.getElementById('fabricDesc');
  const fabricTags = document.getElementById('fabricTags');
  const fabricRequestBtn = document.getElementById('fabricRequestBtn');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeFabricKey = 'worsted-wool';
  let activePhotoKey = null;
  let switchTimer = null;
  let mediaRequestId = 0;

  Object.values(FABRICS).forEach(({ image }) => {
    if (!image) return;
    const img = new Image();
    img.src = encodeURI(image);
  });

  const switchFabricPhoto = (data) => {
    if (!fabricMedia || !data?.image) return;
    const nextSrc = encodeURI(data.image);
    const nextAlt = data.alt || data.name;
    const reqId = ++mediaRequestId;

    if (prefersReducedMotion) {
      const current = fabricMedia.querySelector('img');
      if (current) {
        current.src = nextSrc;
        current.alt = nextAlt;
        current.classList.add('is-active');
      }
      return;
    }

    const nextImg = new Image();
    nextImg.decoding = 'async';
    nextImg.alt = nextAlt;
    nextImg.src = nextSrc;

    const mountAndFade = () => {
      if (reqId !== mediaRequestId) return;
      fabricMedia.querySelectorAll('img').forEach((img) => img.setAttribute('aria-hidden', 'true'));
      fabricMedia.appendChild(nextImg);
      void nextImg.offsetWidth;
      nextImg.classList.add('is-active');

      const cleanup = () => {
        [...fabricMedia.querySelectorAll('img')].forEach((img) => {
          if (img !== nextImg && (img.compareDocumentPosition(nextImg) & Node.DOCUMENT_POSITION_FOLLOWING)) {
            img.remove();
          }
        });
      };

      const onEnd = (e) => {
        if (e.propertyName !== 'opacity') return;
        nextImg.removeEventListener('transitionend', onEnd);
        clearTimeout(fallbackTimer);
        cleanup();
      };
      nextImg.addEventListener('transitionend', onEnd);
      const fallbackTimer = setTimeout(() => {
        nextImg.removeEventListener('transitionend', onEnd);
        cleanup();
      }, 800);
    };

    if (nextImg.decode) {
      nextImg.decode().then(mountAndFade, () => {
        if (nextImg.naturalWidth) mountAndFade();
      });
    } else if (nextImg.complete && nextImg.naturalWidth) {
      mountAndFade();
    } else {
      nextImg.onload = mountAndFade;
    }
  };

  const selectFabric = (key) => {
    const data = FABRICS[key];
    if (!data || !fabricPanel || (key === activeFabricKey && key === activePhotoKey)) return;

    if (key !== activePhotoKey) {
      activePhotoKey = key;
      switchFabricPhoto(data);
    }

    if (key === activeFabricKey) return;
    activeFabricKey = key;
    swatchBtns.forEach((btn) => btn.setAttribute('aria-selected', String(btn.dataset.fabric === key)));
    clearTimeout(switchTimer);
    fabricPanel.classList.add('is-switching');
    switchTimer = setTimeout(() => {
      fabricChip.style.setProperty('--c', data.color);
      fabricChip.dataset.weave = data.weave;
      fabricMeta.textContent = data.meta;
      fabricTitle.textContent = data.name;
      fabricDesc.textContent = data.desc;
      fabricTags.replaceChildren(...data.tags.map((tag) => {
        const li = document.createElement('li');
        li.textContent = tag;
        return li;
      }));
      fabricRequestBtn.textContent = `Request ${data.name} at your fitting →`;
      fabricPanel.classList.remove('is-switching');
    }, 90);
  };

  if (swatchBtns.length && fabricPanel) {
    swatchBtns.forEach((btn, idx) => {
      btn.addEventListener('click', () => selectFabric(btn.dataset.fabric));
      btn.addEventListener('keydown', (e) => {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
        e.preventDefault();
        const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
        const next = swatchBtns[(idx + dir + swatchBtns.length) % swatchBtns.length];
        next.focus();
        selectFabric(next.dataset.fabric);
      });
    });

    fabricRequestBtn?.addEventListener('click', () => {
      const data = FABRICS[activeFabricKey];
      const preset = data ? `I'd like to view ${data.name} (${data.meta}) swatches during my fitting.` : '';
      openBookingModal({ message: preset });
    });
  }

  document.getElementById('year').textContent = new Date().getFullYear();
})();
