/**
 * NEXTFLIX — 1:1 Reverse-Engineered Netflix Clone
 * Vanilla JavaScript Implementation
 */

'use strict';

/* ─── 1. MOVIE METADATA FOR POPUP MODAL ──────────────── */
const MOVIES = {
  'silent-voice': {
    title: 'A SILENT VOICE',
    img: 'images/silent-voice.jpg',
    tags: ['2016', 'U/A 13+', 'Movie', 'Anime', 'Drama', 'Romance', 'Heartfelt'],
    desc: 'A former elementary school bully seeks redemption and attempts to make amends with the deaf girl he once tormented years earlier.'
  },
  'your-name': {
    title: 'YOUR NAME.',
    img: 'images/your-name.jpg',
    tags: ['2016', 'U/A 13+', 'Movie', 'Anime', 'Romance', 'Fantasy', 'Masterpiece'],
    desc: 'Two teenagers separated by distance and destiny mysteriously begin swapping bodies, embarking on an unforgettable journey across time to find one another.'
  },
  'weathering-with-you': {
    title: 'WEATHERING WITH YOU',
    img: 'images/weathering-with-you.jpg',
    tags: ['2019', 'U/A 13+', 'Movie', 'Anime', 'Fantasy', 'Romance', 'Drama'],
    desc: 'During an endlessly rainy Tokyo summer, a runaway boy crosses paths with an orphaned girl who possesses the wondrous power to stop the rain and bring out the sun.'
  },
  'garden-of-words': {
    title: 'THE GARDEN OF WORDS',
    img: 'images/garden-of-words.jpg',
    tags: ['2013', 'U/A 13+', 'Movie', 'Anime', 'Romance', 'Drama', 'Visual Poetry'],
    desc: 'On rainy mornings in a quiet Tokyo garden, an aspiring young shoemaker and a troubled older woman form an unspoken bond that heals their hidden sorrows.'
  },
  'josee-tiger-fish': {
    title: 'JOSEE, THE TIGER AND THE FISH',
    img: 'images/josee-tiger-fish.jpg',
    tags: ['2020', 'U/A 13+', 'Movie', 'Anime', 'Heartfelt', 'Romance', 'Inspiring'],
    desc: 'A passionate university marine biology student becomes the caretaker for an imaginative paraplegic girl, opening up new horizons and touching each other’s hearts.'
  },
  'pancreas': {
    title: 'I WANT TO EAT YOUR PANCREAS',
    img: 'images/pancreas.jpg',
    tags: ['2018', 'U/A 13+', 'Movie', 'Anime', 'Tearjerker', 'Romance', 'Drama'],
    desc: 'An introverted high school boy discovers the secret diary of his vivacious classmate and learns she is silently living with a fatal pancreatic illness.'
  },
  'grave-of-fireflies': {
    title: 'GRAVE OF THE FIREFLIES',
    img: 'images/grave-of-the-fireflies.jpg',
    tags: ['1988', '16+', 'Movie', 'Studio Ghibli', 'War', 'Tragedy', 'Classic'],
    desc: 'In the closing months of World War II, two orphaned siblings fight desperately for survival against starvation and devastation in wartime Japan.'
  },
  'spirited-away': {
    title: 'SPIRITED AWAY',
    img: 'images/spirited-away.jpg',
    tags: ['2001', 'U', 'Movie', 'Studio Ghibli', 'Oscar Winner', 'Fantasy', 'Adventure'],
    desc: 'Ten-year-old Chihiro wanders into a secret spirit world ruled by witches and spirits, and must work in an otherworldly bathhouse to rescue her parents.'
  },
  'suzume': {
    title: 'SUZUME',
    img: 'images/suzume.jpg',
    tags: ['2022', 'U/A 13+', 'Movie', 'Anime', 'Adventure', 'Fantasy', 'Action'],
    desc: 'A courageous 17-year-old girl and an enigmatic young traveler journey across abandoned ruins in Japan to seal mystical doors preventing devastating cataclysms.'
  },
  'anohana': {
    title: 'ANOHANA: THE FLOWER WE SAW THAT DAY',
    img: 'images/anohana.jpg',
    tags: ['2013', 'U/A 13+', 'Movie', 'Anime', 'Drama', 'Nostalgia', 'Friendship'],
    desc: 'Years after a childhood tragedy shattered their close-knit circle, the spirit of Menma appears to Jinta to fulfill an unremembered promise and heal old wounds.'
  }
};


/* ─── 2. STICKY HEADER TRANSITION ON SCROLL ──────────── */
(function initHeader() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  function updateHeader() {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  // Header Sign In button directs to the sign-in gateway
  const signInBtn = document.getElementById('headerSignInBtn');
  if (signInBtn) {
    signInBtn.textContent = 'Sign In';
    signInBtn.href = 'signup.html?mode=signin';
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
})();


/* ─── 3. TRENDING NOW CAROUSEL ───────────────────────── */
(function initCarousel() {
  const viewport = document.getElementById('carouselViewport');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  if (!viewport || !prevBtn || !nextBtn) return;

  function getScrollAmount() {
    return viewport.clientWidth * 0.8;
  }

  function updateNavVisibility() {
    const maxScroll = viewport.scrollWidth - viewport.clientWidth - 10;
    prevBtn.style.opacity = viewport.scrollLeft <= 10 ? '0' : '1';
    prevBtn.style.pointerEvents = viewport.scrollLeft <= 10 ? 'none' : 'auto';
    nextBtn.style.opacity = viewport.scrollLeft >= maxScroll ? '0' : '1';
    nextBtn.style.pointerEvents = viewport.scrollLeft >= maxScroll ? 'none' : 'auto';
  }

  prevBtn.addEventListener('click', () => {
    viewport.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    viewport.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
  });

  viewport.addEventListener('scroll', updateNavVisibility, { passive: true });
  window.addEventListener('resize', updateNavVisibility, { passive: true });
  setTimeout(updateNavVisibility, 200);
})();


/* ─── 4. MOVIE DETAILS MODAL ─────────────────────────── */
(function initModal() {
  const modal = document.getElementById('movieModal');
  const closeBtn = document.getElementById('modalCloseBtn');
  const modalImg = document.getElementById('modalImg');
  const modalTitle = document.getElementById('modalTitle');
  const modalTags = document.getElementById('modalTags');
  const modalDesc = document.getElementById('modalDesc');
  const cards = document.querySelectorAll('.top10-card');
  if (!modal || !closeBtn) return;

  function openModal(movieKey) {
    const movie = MOVIES[movieKey];
    if (!movie) return;

    modalImg.src = movie.img;
    modalTitle.textContent = movie.title;
    modalDesc.textContent = movie.desc;

    // Render tags
    modalTags.innerHTML = '';
    movie.tags.forEach(t => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = t;
      modalTags.appendChild(span);
    });

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const movieKey = card.getAttribute('data-movie');
      openModal(movieKey);
    });
  });

  const modalCta = document.getElementById('modalCta');
  if (modalCta) {
    modalCta.addEventListener('click', () => {
      if (window.location.protocol.startsWith('http')) {
        window.location.href = '/browse';
      } else {
        window.location.href = 'browse.html';
      }
    });
  }

  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
})();


/* ─── 5. FAQ ACCORDION (SINGLE OPEN COLLAPSIBLE) ──────── */
(function initFaq() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question-btn');
    const panel = item.querySelector('.faq-answer-panel');
    if (!btn || !panel) return;

    btn.addEventListener('click', () => {
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';

      // Close all other items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          const otherBtn = otherItem.querySelector('.faq-question-btn');
          const otherPanel = otherItem.querySelector('.faq-answer-panel');
          if (otherBtn && otherPanel) {
            otherBtn.setAttribute('aria-expanded', 'false');
            otherPanel.style.maxHeight = null;
          }
        }
      });

      // Toggle this item
      if (isExpanded) {
        btn.setAttribute('aria-expanded', 'false');
        panel.style.maxHeight = null;
      } else {
        btn.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
})();


/* ─── 6. EMAIL VALIDATION & SUBMISSION ────────────────── */
(function initEmailForms() {
  const forms = [
    { formId: 'heroForm', inputId: 'heroEmail', errorId: 'heroError' },
    { formId: 'faqForm', inputId: 'faqEmail', errorId: 'faqError' }
  ];

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  forms.forEach(({ formId, inputId, errorId }) => {
    const form = document.getElementById(formId);
    const input = document.getElementById(inputId);
    const errorEl = document.getElementById(errorId);
    if (!form || !input || !errorEl) return;

    function validate() {
      const value = input.value.trim();
      if (!value) {
        errorEl.textContent = 'Email is required.';
        input.classList.add('has-error');
        return false;
      }
      if (!EMAIL_REGEX.test(value)) {
        errorEl.textContent = 'Please enter a valid email address.';
        input.classList.add('has-error');
        return false;
      }
      errorEl.textContent = '';
      input.classList.remove('has-error');
      return true;
    }

    input.addEventListener('input', () => {
      if (input.classList.contains('has-error')) {
        validate();
      }
    });

    input.addEventListener('blur', () => {
      if (input.value.trim().length > 0) {
        validate();
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validate()) {
        const btn = form.querySelector('button[type="submit"]');
        const span = btn ? btn.querySelector('span') : null;
        if (btn) btn.disabled = true;
        if (span) span.textContent = 'Entering NEXTFLIX...';

        const emailVal = input.value.trim();
        const username = emailVal.split('@')[0];
        try {
          localStorage.setItem('nextflix_user', JSON.stringify({
            email: emailVal,
            username: username,
            isLoggedIn: true,
            loginTime: Date.now()
          }));
          localStorage.setItem('activeProfile', 'me');
        } catch (err) {
          console.warn('Storage error:', err);
        }

        setTimeout(() => {
          if (window.location.protocol.startsWith('http')) {
            window.location.href = '/browse';
          } else {
            window.location.href = 'browse.html';
          }
        }, 300);
      }
    });
  });
})();
