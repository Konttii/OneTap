/* ==========================================================================
   OneTap Computer Club — Final Project JavaScript (js/script.js)
   Team: Kuandyk Koshanov, Alimzhan Tileshov & Nuradil Uzakbayev

   Shared across all pages. Every init* function checks for the required DOM
   elements before attaching listeners so there are zero console errors.

   Modules included:
   1. Date & Time in footer .................... initDateTime()
   2. Background Color Switcher ................ initBackgroundSwitcher()
   3. Light & Dark Mode Toggle (localStorage) .. initThemeToggle()
   4. FAQ Accordion ............................ initAccordion()
   5. Custom Form Validation (novalidate) ...... setupFormValidation(), getFieldError()
   6. Authentication & Profile (localStorage) .. initAuthAndProfile()
   7. Booking Form + Async Fetch + History ..... initContactForm(), sendBooking()
   8. Subscribe Popup Modal .................... initPopup()
   9. Web Audio API Sound Effects .............. playSound()
   10. Keyboard Navbar & Card Navigation ....... initKeyboardNav(), initBootstrapCardNav()
   11. Interactive Rating Stars ................ initRating()
   12. Snack Menu Filter, Search & Saved Tray .. menu, initMenuFilter(), initMenuSearch()
   13. FAQ Live Search, Autocomplete & Highlight initFaqSearch()
   14. Scroll Progress Bar & Animated Counters . initScrollProgress(), initCounters()
   15. Toast Notifications & Clipboard Copy .... showToast(), initClipboardCopy()
   16. Image Lazy Loading ...................... initLazyLoading()
   17. Tariff Matrix Keyboard/D-Pad Navigation . initTableNavigation()
   18. External Public API (Steam/CheapShark) .. initGamesApi() (async/await + fetch)
   ========================================================================== */
(function () {
  'use strict';

  /* ======================================================================
     Storage Keys (localStorage)
     ====================================================================== */
  const THEME_STORAGE_KEY = 'onetap-theme';
  const BACKGROUND_STORAGE_KEY = 'onetap-background-color';
  const RATING_STORAGE_KEY = 'onetap-rating';
  const USERS_STORAGE_KEY = 'onetap-users';
  const CURRENT_USER_KEY = 'onetap-current-user';
  const BOOKINGS_STORAGE_KEY = 'onetap-bookings';
  const SAVED_MENU_KEY = 'onetap-saved-menu';
  const MENU_FILTER_KEY = 'onetap-menu-filter';
  const MENU_SEARCH_KEY = 'onetap-menu-search';
  const SAVED_GAMES_KEY = 'onetap-saved-games';

  function readJsonStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJsonStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* ignore quota / private mode errors */
    }
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ======================================================================
     1. Display current date and time in footer
     ====================================================================== */
  function initDateTime() {
    const output = document.getElementById('current-datetime');
    if (!output) return;

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    function updateDateTime() {
      const now = new Date();
      output.textContent = dateFormatter.format(now) + ', ' + timeFormatter.format(now);
      output.setAttribute('datetime', now.toISOString());
    }

    updateDateTime();
    setInterval(updateDateTime, 1000);
  }

  /* ======================================================================
     2. Background colour switcher + 3. Light & Dark Modes (localStorage)
     ====================================================================== */
  const BACKGROUND_PALETTE = [
    { name: 'Midnight Black', color: '#08080a' },
    { name: 'Deep Navy',      color: '#0b1226' },
    { name: 'Royal Plum',     color: '#17102b' },
    { name: 'Forest Night',   color: '#0a1c16' },
    { name: 'Crimson Dusk',   color: '#241016' },
    { name: 'Ocean Slate',    color: '#0e1d29' }
  ];
  const DEFAULT_BACKGROUND = BACKGROUND_PALETTE[0].color;
  const MAX_BACKGROUND_LUMINANCE = 0.07;

  function hexToRgb(hex) {
    const value = parseInt(hex.slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }

  function rgbToHex(rgb) {
    return '#' + rgb.map(function (channel) {
      return Math.round(channel).toString(16).padStart(2, '0');
    }).join('');
  }

  function getLuminance(rgb) {
    const linear = rgb.map(function (channel) {
      const c = channel / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  }

  function ensureReadable(hex) {
    const rgb = hexToRgb(hex);
    if (getLuminance(rgb) <= MAX_BACKGROUND_LUMINANCE) {
      return { color: hex, adjusted: false };
    }
    let low = 0;
    let high = 1;
    for (let i = 0; i < 12; i++) {
      const mid = (low + high) / 2;
      const scaled = rgb.map(function (channel) { return channel * mid; });
      if (getLuminance(scaled) > MAX_BACKGROUND_LUMINANCE) {
        high = mid;
      } else {
        low = mid;
      }
    }
    return { color: rgbToHex(rgb.map(function (channel) { return channel * low; })), adjusted: true };
  }

  function readSavedBackground() {
    try {
      const saved = localStorage.getItem(BACKGROUND_STORAGE_KEY);
      return /^#[0-9a-f]{6}$/i.test(saved) ? saved.toLowerCase() : null;
    } catch (error) {
      return null;
    }
  }

  function saveBackground(color) {
    try {
      localStorage.setItem(BACKGROUND_STORAGE_KEY, color);
    } catch (error) {
      /* ignore */
    }
  }

  function applyBackground(color) {
    if (document.body.classList.contains('day-theme')) {
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
      document.documentElement.style.removeProperty('--bg');
      return;
    }
    document.body.style.backgroundColor = color;
    document.documentElement.style.backgroundColor = color;
    document.documentElement.style.setProperty('--bg', color);
  }

  function buildBackgroundPanel() {
    const panel = document.createElement('div');
    panel.className = 'bg-panel';
    panel.id = 'bg-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Background color');

    const swatches = BACKGROUND_PALETTE.map(function (preset) {
      return '<button type="button" class="bg-swatch" data-color="' + preset.color + '"' +
             ' style="background-color:' + preset.color + '" title="' + preset.name + '"' +
             ' aria-label="' + preset.name + '"></button>';
    }).join('');

    panel.innerHTML =
      '<label class="bg-panel-title" for="bg-color-input">Background color</label>' +
      '<input type="color" class="bg-color-input" id="bg-color-input" value="' + DEFAULT_BACKGROUND + '">' +
      '<div class="bg-swatches">' + swatches + '</div>' +
      '<div class="bg-actions">' +
        '<button type="button" class="bg-action" id="bg-random">Random</button>' +
        '<button type="button" class="bg-action" id="bg-reset">Reset</button>' +
      '</div>' +
      '<p class="bg-note" id="bg-note" role="status" hidden>Shade darkened a little so the text stays readable.</p>';
    return panel;
  }

  function initBackgroundSwitcher() {
    const button = document.getElementById('bg-toggle');
    if (!button) return;

    const host = button.closest('.fab-group') || button.parentElement;
    const panel = buildBackgroundPanel();
    host.appendChild(panel);

    const input = panel.querySelector('#bg-color-input');
    const note = panel.querySelector('#bg-note');
    const swatchButtons = panel.querySelectorAll('.bg-swatch');

    function setColor(requested, save) {
      const result = ensureReadable(requested.toLowerCase());
      if (save && document.body.classList.contains('day-theme')) {
        // If user actively picks a dark background swatch, switch to dark mode first
        setGlobalTheme('night', false);
      }
      applyBackground(result.color);
      input.value = result.color;
      note.hidden = !result.adjusted;
      swatchButtons.forEach(function (swatch) {
        swatch.classList.toggle('is-active', swatch.dataset.color === result.color);
      });
      button.style.setProperty('--picked', result.color);
      if (save) saveBackground(result.color);
    }

    function openPanel() {
      panel.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true');
    }

    function closePanel() {
      panel.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
    }

    button.setAttribute('aria-label', 'Choose background color');
    button.setAttribute('title', 'Choose background color');
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'bg-panel');
    button.setAttribute('aria-expanded', 'false');

    const saved = readSavedBackground();
    if (saved) setColor(saved, false);
    else setColor(DEFAULT_BACKGROUND, false);

    button.addEventListener('click', function () {
      if (panel.classList.contains('is-open')) closePanel();
      else openPanel();
    });

    input.addEventListener('input', function () {
      setColor(input.value, true);
    });

    swatchButtons.forEach(function (swatch) {
      swatch.addEventListener('click', function () {
        setColor(swatch.dataset.color, true);
      });
    });

    panel.querySelector('#bg-random').addEventListener('click', function () {
      const randomRgb = [0, 0, 0].map(function () { return Math.floor(Math.random() * 256); });
      setColor(rgbToHex(randomRgb), true);
    });

    panel.querySelector('#bg-reset').addEventListener('click', function () {
      setColor(DEFAULT_BACKGROUND, true);
    });

    document.addEventListener('click', function (event) {
      if (panel.classList.contains('is-open') && !host.contains(event.target)) closePanel();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && panel.classList.contains('is-open')) {
        closePanel();
        button.focus();
      }
    });
  }

  /* ======================================================================
     3. Light & Dark Mode Toggle Switch (Requirement 3)
     Syncs navbar switch [data-theme-toggle] and floating .fab-daynight button.
     Persists across all pages using localStorage.
     ====================================================================== */
  function setGlobalTheme(theme, announce) {
    const isDay = theme === 'day' || theme === 'light';
    const normalized = isDay ? 'day' : 'night';
    document.body.classList.toggle('day-theme', isDay);

    if (isDay) {
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
      document.documentElement.style.removeProperty('--bg');
    } else {
      const savedBg = readSavedBackground() || DEFAULT_BACKGROUND;
      applyBackground(savedBg);
    }

    // Update floating button
    const fabBtn = document.querySelector('.fab-daynight');
    if (fabBtn) {
      fabBtn.textContent = isDay ? '🌙' : '☀️';
      fabBtn.setAttribute('aria-label', isDay ? 'Switch to dark mode' : 'Switch to light mode');
      fabBtn.title = fabBtn.getAttribute('aria-label');
    }

    // Update navbar toggle switch(es)
    document.querySelectorAll('[data-theme-toggle]').forEach(function (switchBtn) {
      switchBtn.setAttribute('aria-checked', String(isDay));
      const label = switchBtn.querySelector('.theme-switch-label');
      if (label) {
        label.textContent = isDay ? '☀️ Light' : '🌙 Dark';
      }
    });

    try {
      localStorage.setItem(THEME_STORAGE_KEY, normalized);
    } catch (error) {
      /* ignore */
    }

    if (announce) {
      playSound('click');
      showToast('Switched to ' + (isDay ? 'Light' : 'Dark') + ' mode.', 'info');
    }
  }

  function initThemeToggle() {
    const group = document.querySelector('.fab-group');
    if (group && !group.querySelector('.fab-daynight')) {
      const fabButton = document.createElement('button');
      fabButton.type = 'button';
      fabButton.className = 'fab fab-daynight';
      group.prepend(fabButton);

      fabButton.addEventListener('click', function () {
        const next = document.body.classList.contains('day-theme') ? 'night' : 'day';
        setGlobalTheme(next, true);
      });
    }

    document.querySelectorAll('[data-theme-toggle]').forEach(function (switchBtn) {
      switchBtn.addEventListener('click', function () {
        const next = document.body.classList.contains('day-theme') ? 'night' : 'day';
        setGlobalTheme(next, true);
      });
    });

    let saved = null;
    try { saved = localStorage.getItem(THEME_STORAGE_KEY); } catch (error) { /* ignore */ }
    setGlobalTheme(saved === 'day' || saved === 'light' ? 'day' : 'night', false);
  }

  /* ======================================================================
     4. Accordion (FAQ)
     ====================================================================== */
  function setAccordionItem(item, isOpen) {
    const button = item.querySelector('.faq-question');
    const panel = item.querySelector('.faq-answer');
    if (!button || !panel) return;

    item.classList.toggle('is-open', isOpen);
    button.setAttribute('aria-expanded', String(isOpen));
    panel.style.maxHeight = isOpen ? panel.scrollHeight + 'px' : '0px';
  }

  function initAccordion() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach(function (item) {
      const button = item.querySelector('.faq-question');
      if (!button) return;

      setAccordionItem(item, false);

      button.addEventListener('click', function () {
        const willOpen = !item.classList.contains('is-open');
        setAccordionItem(item, willOpen);
      });
    });

    window.addEventListener('resize', function () {
      items.forEach(function (item) {
        if (item.classList.contains('is-open')) setAccordionItem(item, true);
      });
    });
  }

  /* ======================================================================
     5. Form Validation Engine (Requirement 5.2)
     Validates:
     - Required fields (data-required="true")
     - Email format (data-validate="email")
     - Password length >= 8 AND complexity: uppercase, lowercase, number (data-validate="password")
     - Phone number pattern: 10-15 digits, valid phone chars (data-validate="phone")
     - Confirm password match (data-validate="confirm")
     No HTML validation attributes (required, pattern, minlength, type="email") are used.
     ====================================================================== */
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  const PHONE_CHARS_PATTERN = /^\+?[\d\s\-()]{10,20}$/;
  const PASSWORD_MIN_LENGTH = 8;
  const NAME_MIN_LENGTH = 2;

  function isFieldRequired(field) {
    return field.dataset.required === 'true' || field.required;
  }

  function getFieldError(field, form) {
    const label = field.dataset.label || field.name || 'This field';
    const value = field.type === 'password' ? field.value : field.value.trim();

    if (isFieldRequired(field) && value === '') {
      return label + ' is required. Please fill in this field.';
    }
    if (value === '') return '';

    switch (field.dataset.validate) {
      case 'name':
        if (value.length < NAME_MIN_LENGTH) {
          return label + ' must be at least ' + NAME_MIN_LENGTH + ' characters long.';
        }
        break;

      case 'email':
        if (!EMAIL_PATTERN.test(value)) {
          return 'Please enter a valid email address (for example: player@onetap.kz).';
        }
        break;

      case 'phone': {
        const digitsOnly = value.replace(/\D/g, '');
        if (!PHONE_CHARS_PATTERN.test(value) || digitsOnly.length < 10 || digitsOnly.length > 15) {
          return 'Please enter a valid phone number (10–15 digits, e.g. +7 701 123 45 67).';
        }
        break;
      }

      case 'password': {
        if (value.length < PASSWORD_MIN_LENGTH) {
          return 'Password must be at least ' + PASSWORD_MIN_LENGTH + ' characters long (currently ' + value.length + ').';
        }
        const hasUpper = /[A-Z]/.test(value);
        const hasLower = /[a-z]/.test(value);
        const hasDigit = /[0-9]/.test(value);
        if (!hasUpper || !hasLower || !hasDigit) {
          return 'Password must include at least one uppercase letter (A-Z), one lowercase letter (a-z), and one number (0-9).';
        }
        break;
      }

      case 'confirm': {
        const original = form.querySelector('#' + field.dataset.match);
        if (!original || value !== original.value) {
          return 'Passwords do not match. Please re-enter your password.';
        }
        break;
      }

      default:
        break;
    }
    return '';
  }

  function getErrorId(field) {
    return (field.id || field.name) + '-error';
  }

  function showError(field, message) {
    const anchor = field.closest('.input-group') || field;
    const errorId = getErrorId(field);
    let error = document.getElementById(errorId);

    if (!error) {
      error = document.createElement('div');
      error.id = errorId;
      error.className = 'field-error';
      error.setAttribute('role', 'alert');
      anchor.insertAdjacentElement('afterend', error);
    }
    error.textContent = message;

    field.classList.add('field-invalid');
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', errorId);
  }

  function clearError(field) {
    const error = document.getElementById(getErrorId(field));
    if (error) error.remove();

    field.classList.remove('field-invalid');
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  }

  function removeSuccessMessage(form) {
    const success = form.querySelector('.form-success');
    if (success) success.remove();
  }

  function showSuccessMessage(form, text, isError) {
    removeSuccessMessage(form);
    const success = document.createElement('div');
    success.className = 'form-success mb-3';
    if (isError) success.classList.add('is-error');
    success.setAttribute('role', 'status');
    success.textContent = text;

    const submit = form.querySelector('[type="submit"]');
    if (submit) {
      submit.insertAdjacentElement('beforebegin', success);
    } else {
      form.appendChild(success);
    }
  }

  function setupFormValidation(form, options) {
    const settings = options || {};
    const fields = Array.prototype.filter.call(
      form.querySelectorAll('input, select, textarea'),
      function (field) { return isFieldRequired(field) || Boolean(field.dataset.validate); }
    );

    function validate(field) {
      const message = getFieldError(field, form);
      if (message) {
        showError(field, message);
      } else {
        clearError(field);
      }
      return message === '';
    }

    function reset() {
      form.reset();
      fields.forEach(function (field) {
        delete field.dataset.touched;
        clearError(field);
      });
      removeSuccessMessage(form);
      if (typeof settings.onReset === 'function') settings.onReset(form);
    }

    fields.forEach(function (field) {
      field.addEventListener('blur', function () {
        if (field.value !== '' || field.dataset.touched) {
          field.dataset.touched = 'true';
          validate(field);
        }
      });

      field.addEventListener('input', function () {
        removeSuccessMessage(form);
        if (field.dataset.touched || field.classList.contains('field-invalid')) {
          validate(field);
        }
        if (field.dataset.validate === 'password') {
          fields.forEach(function (other) {
            if (other.dataset.validate === 'confirm' && (other.dataset.touched || other.value !== '')) {
              other.dataset.touched = 'true';
              validate(other);
            }
          });
        }
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      removeSuccessMessage(form);

      let firstInvalid = null;
      fields.forEach(function (field) {
        field.dataset.touched = 'true';
        if (!validate(field) && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        playSound('error');
        firstInvalid.focus();
        return;
      }

      if (typeof settings.onValidSubmit === 'function') {
        settings.onValidSubmit(form, {
          reset: reset,
          showMessage: function (msg, isErr) { showSuccessMessage(form, msg, isErr); }
        });
        return;
      }

      if (typeof settings.sendData === 'function') {
        settings.sendData(form, function (ok, message) {
          if (ok) reset();
          showSuccessMessage(form, message, !ok);
          playSound(ok ? 'success' : 'error');
          showToast(
            ok ? 'Form submitted successfully!' : 'Could not send booking request.',
            ok ? 'success' : 'error'
          );
        });
        return;
      }

      const submitBtn = form.querySelector('[type="submit"]');
      setSubmitLoading(submitBtn, true);
      setTimeout(function () {
        setSubmitLoading(submitBtn, false);
        reset();
        showSuccessMessage(form, settings.successMessage || 'Thank you! Your form has been submitted.');
        playSound('success');
        showToast('Form submitted successfully!', 'success');
        if (typeof settings.onSuccess === 'function') settings.onSuccess(form);
      }, 900);
    });

    return { reset: reset, validateAll: function () {
      let ok = true;
      fields.forEach(function (f) {
        f.dataset.touched = 'true';
        if (!validate(f)) ok = false;
      });
      return ok;
    }};
  }

  /* ======================================================================
     6. Authentication Simulation & Profile Page (Requirement 5.1)
     - Sign Up stores user data locally (name, email, phone, zone, password)
     - Log In checks credentials and redirects to Profile Page
     - Profile Page displays stored user details, bookings, saved items
     ====================================================================== */
  function getCurrentUser() {
    return readJsonStorage(CURRENT_USER_KEY, null);
  }

  function getRegisteredUsers() {
    return readJsonStorage(USERS_STORAGE_KEY, []);
  }

  function saveRegisteredUser(userObj) {
    const users = getRegisteredUsers();
    const existingIdx = users.findIndex(function (u) {
      return u.email.toLowerCase() === userObj.email.toLowerCase();
    });
    if (existingIdx !== -1) {
      users[existingIdx] = userObj;
    } else {
      users.push(userObj);
    }
    writeJsonStorage(USERS_STORAGE_KEY, users);
    // Also save under 'onetap-user' for direct inspection in DevTools
    writeJsonStorage('onetap-user', userObj);
  }

  function setCurrentUser(userObj) {
    if (userObj) {
      const sessionUser = {
        name: userObj.name,
        email: userObj.email,
        phone: userObj.phone,
        zone: userObj.zone || 'Main Zone',
        createdAt: userObj.createdAt || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      };
      writeJsonStorage(CURRENT_USER_KEY, sessionUser);
    } else {
      try { localStorage.removeItem(CURRENT_USER_KEY); } catch (e) { /* ignore */ }
    }
    updateNavbarAuth();
  }

  function updateNavbarAuth() {
    const user = getCurrentUser();
    document.querySelectorAll('#nav-profile-link').forEach(function (link) {
      if (user && user.name) {
        const firstName = user.name.trim().split(/\s+/)[0];
        link.textContent = '👤 ' + firstName;
        link.title = 'Logged in as ' + user.name + ' (' + user.email + ')';
      } else {
        link.textContent = '👤 Profile';
        link.title = 'Sign Up or Log In';
      }
    });
  }

  function getInitials(name) {
    const parts = String(name || 'OneTap').trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return String(parts[0] || 'OT').slice(0, 2).toUpperCase();
  }

  function renderProfileDashboard() {
    const dashboard = document.getElementById('profile-dashboard');
    const authSection = document.getElementById('auth-section');
    if (!dashboard) return;

    const user = getCurrentUser();
    if (!user) {
      dashboard.hidden = true;
      if (authSection) authSection.hidden = false;
      return;
    }

    dashboard.hidden = false;
    if (authSection) authSection.hidden = true;

    const avatarEl = document.getElementById('profile-avatar');
    const displayNameEl = document.getElementById('profile-display-name');
    const sinceEl = document.getElementById('profile-display-since');
    const detailNameEl = document.getElementById('profile-detail-name');
    const detailEmailEl = document.getElementById('profile-detail-email');
    const detailPhoneEl = document.getElementById('profile-detail-phone');
    const detailZoneEl = document.getElementById('profile-detail-zone');

    if (avatarEl) avatarEl.textContent = getInitials(user.name);
    if (displayNameEl) displayNameEl.textContent = user.name;
    if (sinceEl) sinceEl.textContent = 'Member since ' + (user.createdAt || '2026');
    if (detailNameEl) detailNameEl.textContent = user.name;
    if (detailEmailEl) detailEmailEl.textContent = user.email;
    if (detailPhoneEl) detailPhoneEl.textContent = user.phone || '+7 701 000 00 00';
    if (detailZoneEl) detailZoneEl.textContent = user.zone || 'Main Zone';

    // Render saved bookings
    const bookingsContainer = document.getElementById('profile-bookings-list');
    if (bookingsContainer) {
      const bookings = readJsonStorage(BOOKINGS_STORAGE_KEY, []);
      if (!bookings.length) {
        bookingsContainer.innerHTML = '<p class="text-muted mb-0">No bookings recorded yet. Reserve a seat on the Contact page!</p>';
      } else {
        bookingsContainer.innerHTML = bookings.slice(0, 5).map(function (b) {
          return '<div class="booking-item-card">' +
            '<div>' +
              '<strong class="text-danger text-uppercase">' + escapeHtml(b.zone) + ' Zone</strong>' +
              '<span class="d-block small text-muted">' + escapeHtml(b.visitTime) + ' (' + escapeHtml(b.startTime) + ' – ' + escapeHtml(b.endTime) + ')</span>' +
            '</div>' +
            '<span class="badge bg-success">Confirmed #' + escapeHtml(b.id) + '</span>' +
          '</div>';
        }).join('');
      }
    }

    // Render saved snacks
    const snacksContainer = document.getElementById('profile-snacks-list');
    if (snacksContainer) {
      const savedSnackIds = readJsonStorage(SAVED_MENU_KEY, []);
      const savedSnacks = menu.items.filter(function (item) {
        return savedSnackIds.indexOf(item.id) !== -1;
      });
      if (!savedSnacks.length) {
        snacksContainer.innerHTML = '<p class="text-muted small mb-0">No snacks saved yet. Visit the Menu page to save items.</p>';
      } else {
        snacksContainer.innerHTML = '<ul class="list-unstyled mb-0">' +
          savedSnacks.map(function (item) {
            return '<li class="d-flex justify-content-between py-1 border-bottom border-secondary small">' +
              '<span>' + escapeHtml(item.name) + '</span>' +
              '<strong class="text-danger">' + escapeHtml(item.price) + ' ₸</strong>' +
            '</li>';
          }).join('') +
        '</ul>';
      }
    }

    // Render saved API games
    const gamesContainer = document.getElementById('profile-games-list');
    if (gamesContainer) {
      const savedGames = readJsonStorage(SAVED_GAMES_KEY, []);
      if (!savedGames.length) {
        gamesContainer.innerHTML = '<p class="text-muted small mb-0">No PC games bookmarked yet. Explore the Steam catalog on Zones/Home.</p>';
      } else {
        gamesContainer.innerHTML = '<ul class="list-unstyled mb-0">' +
          savedGames.map(function (g) {
            return '<li class="d-flex justify-content-between py-1 border-bottom border-secondary small">' +
              '<span class="text-truncate me-2">' + escapeHtml(g.title) + '</span>' +
              '<span class="badge bg-danger">$' + escapeHtml(g.salePrice) + '</span>' +
            '</li>';
          }).join('') +
        '</ul>';
      }
    }
  }

  function initAuthAndProfile() {
    updateNavbarAuth();

    const authSection = document.getElementById('auth-section');
    const dashboard = document.getElementById('profile-dashboard');
    if (!authSection && !dashboard) return;

    const tabButtons = document.querySelectorAll('[data-auth-tab]');
    const loginPanel = document.getElementById('login-panel');
    const signupPanel = document.getElementById('signup-panel');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const logoutBtn = document.getElementById('logout-btn');
    const fillDemoBtn = document.getElementById('fill-demo-btn');

    function switchAuthTab(mode) {
      const isSignup = mode === 'signup';
      tabButtons.forEach(function (btn) {
        const active = btn.dataset.authTab === mode;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', String(active));
      });
      if (loginPanel) loginPanel.hidden = isSignup;
      if (signupPanel) signupPanel.hidden = !isSignup;
    }

    tabButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        playSound('click');
        switchAuthTab(btn.dataset.authTab);
      });
    });

    document.querySelectorAll('[data-switch-auth]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        playSound('click');
        switchAuthTab(btn.dataset.switchAuth);
      });
    });

    // Demo Member button for defense convenience
    if (fillDemoBtn && loginForm) {
      fillDemoBtn.addEventListener('click', function () {
        const demoUser = {
          name: 'Kuandyk Koshanov',
          email: 'kuandyk@onetap.kz',
          phone: '+7 701 555 20 26',
          zone: 'VIP Zone',
          password: 'OneTap2026',
          createdAt: 'November 18, 2026'
        };
        saveRegisteredUser(demoUser);

        const emailField = document.getElementById('login-email');
        const phoneField = document.getElementById('login-phone');
        const passField = document.getElementById('login-password');
        if (emailField) { emailField.value = demoUser.email; clearError(emailField); }
        if (phoneField) { phoneField.value = demoUser.phone; clearError(phoneField); }
        if (passField) { passField.value = demoUser.password; clearError(passField); }

        playSound('click');
        showToast('Demo account registered & filled! Click "Log In to Profile".', 'info');
      });
    }

    // Sign Up form handler
    if (signupForm) {
      setupFormValidation(signupForm, {
        onValidSubmit: function (form, helpers) {
          const submitBtn = form.querySelector('[type="submit"]');
          const userObj = {
            name: document.getElementById('signup-name').value.trim(),
            email: document.getElementById('signup-email').value.trim(),
            phone: document.getElementById('signup-phone').value.trim(),
            zone: document.getElementById('signup-zone').value,
            password: document.getElementById('signup-password').value,
            createdAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          };

          setSubmitLoading(submitBtn, true);
          setTimeout(function () {
            setSubmitLoading(submitBtn, false);
            saveRegisteredUser(userObj);
            setCurrentUser(userObj);
            helpers.reset();
            playSound('success');
            showToast('Sign Up complete! Welcome to OneTap, ' + userObj.name + '.', 'success');
            renderProfileDashboard();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 600);
        }
      });
    }

    // Log In form handler
    if (loginForm) {
      setupFormValidation(loginForm, {
        onValidSubmit: function (form, helpers) {
          const emailInput = document.getElementById('login-email').value.trim();
          const phoneInput = document.getElementById('login-phone').value.trim();
          const passwordInput = document.getElementById('login-password').value;
          const submitBtn = form.querySelector('[type="submit"]');

          const users = getRegisteredUsers();
          const matchedUser = users.find(function (u) {
            return u.email.toLowerCase() === emailInput.toLowerCase() && u.password === passwordInput;
          });

          setSubmitLoading(submitBtn, true);
          setTimeout(function () {
            setSubmitLoading(submitBtn, false);

            if (!matchedUser) {
              helpers.showMessage('Invalid email or password. Please Sign Up first or click "Fill Demo Member".', true);
              playSound('error');
              showToast('Log In failed: Invalid credentials.', 'error');
              return;
            }

            // Update phone if provided
            if (phoneInput) matchedUser.phone = phoneInput;
            saveRegisteredUser(matchedUser);
            setCurrentUser(matchedUser);
            helpers.reset();
            playSound('success');
            showToast('Logged in! Redirecting to Profile Page…', 'success');

            // Redirect / display Profile Page view
            window.location.hash = 'profile-dashboard';
            renderProfileDashboard();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 600);
        }
      });
    }

    // Log Out button handler
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        setCurrentUser(null);
        playSound('click');
        showToast('You have logged out of your OneTap account.', 'info');
        if (window.location.hash) {
          history.replaceState(null, '', window.location.pathname);
        }
        renderProfileDashboard();
        switchAuthTab('login');
      });
    }

    // Initial render on profile.html
    renderProfileDashboard();
  }

  /* ======================================================================
     7. Contact / Booking Form + Time Presets + Async Submit + localStorage
     ====================================================================== */
  const TIME_PRESETS = {
    daytime: { start: '12:00', end: '18:00' },
    nightpass: { start: '23:00', end: '07:00' }
  };

  function initTimePresets() {
    const startInput = document.getElementById('start-time');
    const endInput = document.getElementById('end-time');
    if (!startInput || !endInput) return;

    function applyPreset(name) {
      const preset = TIME_PRESETS[name.replace('-', '')];
      if (!preset) return;
      startInput.value = preset.start;
      endInput.value = preset.end;
    }

    const buttons = document.querySelectorAll('.time-choice');
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        buttons.forEach(function (btn) { btn.classList.toggle('active', btn === button); });
        applyPreset(button.dataset.time);
      });
    });

    document.querySelectorAll('input[name="visit-time"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (radio.checked) applyPreset(radio.value);
      });
    });
  }

  const BOOKING_URL = 'https://jsonplaceholder.typicode.com/posts';

  function saveBookingToStorage(bookingData, bookingId) {
    const bookings = readJsonStorage(BOOKINGS_STORAGE_KEY, []);
    bookings.unshift({
      id: bookingId || Math.floor(100 + Math.random() * 900),
      fullname: bookingData.fullname,
      email: bookingData.email,
      phone: bookingData.phone,
      zone: bookingData.zone || 'main',
      visitTime: bookingData['visit-time'] === 'nightpass' ? 'Night Pass' : 'Daytime',
      startTime: bookingData['start-time'] || '12:00',
      endTime: bookingData['end-time'] || '18:00',
      createdAt: new Date().toISOString()
    });
    writeJsonStorage(BOOKINGS_STORAGE_KEY, bookings.slice(0, 15));
  }

  function sendBooking(form, callback) {
    const submit = form.querySelector('[type="submit"]');
    const data = Object.fromEntries(new FormData(form));
    delete data.password;
    delete data['confirm-password'];

    setSubmitLoading(submit, true);
    const delayPromise = new Promise(function (resolve) { setTimeout(resolve, 900); });

    Promise.all([
      fetch(BOOKING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      }),
      delayPromise
    ])
      .then(function (results) {
        const result = results[0];
        saveBookingToStorage(data, result.id);
        callback(true, 'Thank you, ' + data.fullname + '! Booking #' + result.id + ' was confirmed and saved to your Member Profile.');
      })
      .catch(function () {
        // Save locally even if offline so the user's booking is never lost
        const localId = Math.floor(100 + Math.random() * 900);
        saveBookingToStorage(data, localId);
        callback(true, 'Thank you, ' + data.fullname + '! Booking #' + localId + ' was saved locally to your Member Profile.');
      })
      .finally(function () {
        setSubmitLoading(submit, false);
      });
  }

  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    // Pre-fill zone and tariff from URL query string (e.g. contact.html?zone=vip&tariff=Night)
    try {
      const params = new URLSearchParams(window.location.search);
      const zoneParam = params.get('zone');
      const tariffParam = params.get('tariff');
      const zoneSelect = document.getElementById('zone');
      if (zoneParam && zoneSelect) {
        zoneSelect.value = zoneParam.toLowerCase();
      }
      if (tariffParam && /night/i.test(tariffParam)) {
        const nightRadio = document.getElementById('nightpass');
        if (nightRadio) {
          nightRadio.checked = true;
          nightRadio.dispatchEvent(new Event('change'));
        }
      }
    } catch (error) {
      /* ignore URLSearchParams errors */
    }

    // Pre-fill user details if logged in
    const user = getCurrentUser();
    if (user) {
      const nameInput = document.getElementById('fullname');
      const emailInput = document.getElementById('email');
      const phoneInput = document.getElementById('phone');
      if (nameInput && !nameInput.value) nameInput.value = user.name || '';
      if (emailInput && !emailInput.value) emailInput.value = user.email || '';
      if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
    }

    setupFormValidation(form, {
      sendData: sendBooking,
      onReset: function () {
        const daytime = form.querySelector('.time-choice[data-time="daytime"]');
        if (daytime) daytime.click();
      }
    });

    const clearBtn = document.getElementById('clear-form');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="password"], textarea').forEach(function (field) {
          field.value = '';
          delete field.dataset.touched;
          clearError(field);
        });
        removeSuccessMessage(form);
        playSound('click');
        showToast('Booking form fields cleared.', 'info');
      });
    }
  }

  /* ======================================================================
     8. Popup (modal) subscribe form
     ====================================================================== */
  function initPopup() {
    const overlay = document.getElementById('subscribe-popup');
    if (!overlay) return;

    const box = overlay.querySelector('.popup-box');
    const openers = document.querySelectorAll('[data-popup-open="subscribe-popup"]');
    const closers = overlay.querySelectorAll('[data-popup-close]');
    const form = overlay.querySelector('#subscribe-form');
    let lastFocused = null;
    let autoCloseTimer = null;
    let validation = null;

    function isOpen() {
      return overlay.classList.contains('is-open');
    }

    function openPopup() {
      lastFocused = document.activeElement;
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('popup-open');
      if (box) box.focus();
    }

    function closePopup() {
      clearTimeout(autoCloseTimer);
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('popup-open');
      if (validation) validation.reset();
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    if (form) {
      validation = setupFormValidation(form, {
        successMessage: 'You are subscribed! Watch your inbox for tournament news.',
        onSuccess: function () {
          autoCloseTimer = setTimeout(closePopup, 2200);
        }
      });
    }

    openers.forEach(function (opener) {
      opener.addEventListener('click', openPopup);
    });

    closers.forEach(function (closer) {
      closer.addEventListener('click', closePopup);
    });

    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) closePopup();
    });

    document.addEventListener('keydown', function (event) {
      if (!isOpen()) return;

      if (event.key === 'Escape') {
        closePopup();
        return;
      }
      if (event.key === 'Tab') {
        const focusable = overlay.querySelectorAll('button:not([disabled]), input, select, textarea, a[href]');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === box)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ======================================================================
     9. Sound effects (Web Audio API)
     ====================================================================== */
  let audioContext = null;
  let currentSound = null;

  function playSound(type) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContext) audioContext = new AudioCtx();

      if (currentSound) {
        try { currentSound.stop(); } catch (error) { /* already finished */ }
      }

      let frequency;
      switch (type) {
        case 'success': frequency = 880; break;
        case 'error':   frequency = 220; break;
        default:        frequency = 520;
      }

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.12, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.18);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.18);
      currentSound = oscillator;
    } catch (error) {
      /* ignore audio autoplay restrictions */
    }
  }

  /* ======================================================================
     10. Keyboard navigation in the main menu
     ====================================================================== */
  function initKeyboardNav() {
    const links = Array.from(document.querySelectorAll('.nav-menu a, .navbar-nav .nav-link, .pure-nav-list a'));
    if (!links.length) return;

    links.forEach(function (link, index) {
      link.addEventListener('keydown', function (event) {
        let next = null;
        switch (event.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            next = (index + 1) % links.length;
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            next = (index - 1 + links.length) % links.length;
            break;
          case 'Home':
            next = 0;
            break;
          case 'End':
            next = links.length - 1;
            break;
          default:
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        links[next].focus();
      });
    });
  }

  /* ======================================================================
     11. Rating stars (querySelectorAll + attributes + localStorage)
     ====================================================================== */
  const RATING_MESSAGES = ['', 'Sorry to hear that 😕', 'We will do better!', 'Not bad, thanks!', 'Great, glad you liked it!', 'Awesome — see you soon! 🔥'];

  function initRating() {
    const stars = document.querySelectorAll('#rating-stars .star');
    const result = document.getElementById('rating-result');
    if (!stars.length || !result) return;

    function showRating(value) {
      for (let i = 0; i < stars.length; i++) {
        const isOn = i < value;
        stars[i].classList.toggle('is-active', isOn);
        stars[i].setAttribute('aria-pressed', String(isOn));
      }
      result.textContent = value ? 'Your rating: ' + value + '/5 — ' + RATING_MESSAGES[value] : 'No rating yet.';
    }

    stars.forEach(function (star) {
      star.addEventListener('click', function () {
        const value = Number(star.dataset.value);
        showRating(value);
        playSound(value >= 3 ? 'success' : 'error');
        showToast('Thanks! You rated OneTap ' + value + '/5 stars.', 'success');
        try { localStorage.setItem(RATING_STORAGE_KEY, value); } catch (error) { /* ignore */ }
      });
    });

    let saved = 0;
    try { saved = Number(localStorage.getItem(RATING_STORAGE_KEY)) || 0; } catch (error) { /* ignore */ }
    showRating(saved);
  }

  /* ======================================================================
     12. Menu Filter, Live Search & Saved Items in localStorage (Req 5.3)
     ====================================================================== */
  const menu = {
    budgetLimit: 600,
    items: [
      { id: 'cola',      name: 'Cola',      category: 'drinks', categoryLabel: 'Drinks',        price: 800,  keywords: 'cola кола напиток напитки drinks drink soda газировка 800' },
      { id: 'gorilla',   name: 'Gorilla',   category: 'drinks', categoryLabel: 'Drinks',        price: 650,  keywords: 'gorilla горилла напиток напитки drinks drink energy энергетик 650' },
      { id: 'asu',       name: 'Asu',       category: 'drinks', categoryLabel: 'Drinks',        price: 400,  keywords: 'asu асу напиток напитки drinks drink water вода 400' },
      { id: 'buerger',   name: 'Buerger',   category: 'food',   categoryLabel: 'Burgers',       price: 700,  keywords: 'buerger burger бургер food еда burgers бургеры fastfood 700' },
      { id: 'romanov',   name: 'Romanov',   category: 'food',   categoryLabel: 'Sandwiches',    price: 800,  keywords: 'romanov романов food еда sandwich сэндвич бутерброд 800' },
      { id: 'maxi',      name: 'Maxi',      category: 'snacks', categoryLabel: 'Snacks & Bars', price: 600,  keywords: 'maxi макси snacks снеки bars батончик 600' },
      { id: 'eclipse',   name: 'Eclipse',   category: 'snacks', categoryLabel: 'Bubble gum',    price: 400,  keywords: 'eclipse эклипс snacks снеки bubble gum жвачка резинка 400' },
      { id: 'lays',      name: 'Lays',      category: 'snacks', categoryLabel: 'Snacks',        price: 1000, keywords: 'lays лейс чипсы chips snacks снеки 1000' },
      { id: 'batonchik', name: 'Batonchik', category: 'snacks', categoryLabel: 'Batonshik',     price: 600,  keywords: 'batonchik батончик snacks снеки bar шоколад chocolate сладкое 600' }
    ],

    filterBy: function (filter, savedIds) {
      const limit = this.budgetLimit;
      const savedList = savedIds || [];
      switch (filter) {
        case 'drinks':
        case 'food':
        case 'snacks':
          return this.items.filter(function (item) { return item.category === filter; });
        case 'budget':
          return this.items.filter(function (item) { return item.price <= limit; });
        case 'saved':
          return this.items.filter(function (item) { return savedList.indexOf(item.id) !== -1; });
        case 'all':
        default:
          return this.items.slice();
      }
    },

    averagePrice: function (list) {
      if (!list.length) return 0;
      let sum = 0;
      for (let i = 0; i < list.length; i++) {
        sum += list[i].price;
      }
      return Math.round(sum / list.length);
    },

    itemsForBudget: function (budget) {
      const prices = this.items.map(function (item) { return item.price; }).sort(function (a, b) { return a - b; });
      let count = 0;
      let spent = 0;
      while (count < prices.length && spent + prices[count] <= budget) {
        spent += prices[count];
        count++;
      }
      return count;
    }
  };

  function getSavedMenuIds() {
    return readJsonStorage(SAVED_MENU_KEY, []);
  }

  function toggleSavedMenuItem(itemId) {
    const saved = getSavedMenuIds();
    const idx = saved.indexOf(itemId);
    let added = false;
    if (idx === -1) {
      saved.push(itemId);
      added = true;
    } else {
      saved.splice(idx, 1);
    }
    writeJsonStorage(SAVED_MENU_KEY, saved);
    return added;
  }

  function renderSavedMenuTray() {
    const trayList = document.getElementById('saved-menu-list');
    const countBadge = document.getElementById('menu-saved-count');
    const clearBtn = document.getElementById('clear-saved-menu');
    const footer = document.getElementById('saved-menu-footer');
    const totalEl = document.getElementById('saved-menu-total');

    const savedIds = getSavedMenuIds();
    if (countBadge) countBadge.textContent = String(savedIds.length);

    if (!trayList) return;

    const savedItems = menu.items.filter(function (it) { return savedIds.indexOf(it.id) !== -1; });
    if (!savedItems.length) {
      trayList.innerHTML = '<li class="text-muted small">No snacks saved yet. Click "+ Save" on any item in the price list.</li>';
      if (clearBtn) clearBtn.hidden = true;
      if (footer) footer.hidden = true;
      return;
    }

    if (clearBtn) clearBtn.hidden = false;
    if (footer) footer.hidden = false;

    let total = 0;
    trayList.innerHTML = savedItems.map(function (item) {
      total += item.price;
      return '<li class="saved-tray-item">' +
        '<span><strong>' + escapeHtml(item.name) + '</strong> <span class="text-muted">(' + item.price + ' ₸)</span></span>' +
        '<button type="button" class="saved-tray-remove" data-remove-saved="' + item.id + '" aria-label="Remove ' + escapeHtml(item.name) + '">&times;</button>' +
      '</li>';
    }).join('');

    if (totalEl) totalEl.textContent = 'Total: ' + total + ' ₸';
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightMatches($elements, query) {
    let matchCount = 0;
    const trimmed = (query || '').toString().trim();
    const regex = trimmed ? new RegExp('(' + escapeRegExp(trimmed) + ')', 'gi') : null;

    $elements.each(function () {
      const $el = $(this);
      if ($el.data('original-text') === undefined) {
        $el.data('original-text', $el.text());
      }
      const rawText = $el.data('original-text');
      const safeHtml = $('<div>').text(rawText).html();

      if (!regex) {
        $el.html(safeHtml);
        return;
      }

      const replaced = safeHtml.replace(regex, function (match) {
        matchCount++;
        return '<span class="hl-word">' + match + '</span>';
      });
      $el.html(replaced);
      $el.find('.hl-word').wrap('<mark class="search-highlight"></mark>');
    });

    return matchCount;
  }

  function renderSuggestions($list, items, query, onSelect) {
    const q = (query || '').toString().trim().toLowerCase();
    if (!q) {
      $list.empty().attr('hidden', true);
      return;
    }

    const matches = items.filter(function (entry) {
      return entry.label.toLowerCase().indexOf(q) !== -1 ||
             (entry.tag && entry.tag.toLowerCase().indexOf(q) !== -1);
    }).slice(0, 6);

    if (!matches.length) {
      $list.empty().attr('hidden', true);
      return;
    }

    const html = matches.map(function (entry) {
      return '<li class="autocomplete-item" role="option" data-value="' +
        $('<div>').text(entry.value).html() + '">' +
        '<span>' + $('<div>').text(entry.label).html() + '</span>' +
        (entry.tag ? '<span class="autocomplete-tag">' + $('<div>').text(entry.tag).html() + '</span>' : '') +
        '</li>';
    }).join('');

    $list.html(html).removeAttr('hidden');

    $list.off('click.autocomplete').on('click.autocomplete', '.autocomplete-item', function () {
      const chosen = $(this).attr('data-value');
      $list.empty().attr('hidden', true);
      onSelect(chosen);
    });
  }

  function initMenuSearch() {
    if (typeof window.jQuery === 'undefined') return;
    const $input = $('#menu-search');
    const $list = $('#price-list');
    const $cards = $('.menu-grid .menu-item');
    const $carouselItems = $('#menuCarousel .carousel-item');
    const $filterButtons = $('#menu-filter .filter-btn');
    const $summary = $('#menu-summary');

    if (!$input.length && !$list.length && !$cards.length && !$carouselItems.length) return;

    const $clear = $('#menu-search-clear');
    const $suggestions = $('#menu-suggestions');
    const $status = $('#menu-search-status');

    // Restore saved filter & search query from localStorage (Req 5.3)
    let currentCategory = 'all';
    try {
      const savedCat = localStorage.getItem(MENU_FILTER_KEY);
      if (savedCat) currentCategory = savedCat;
      const savedQuery = localStorage.getItem(MENU_SEARCH_KEY);
      if (savedQuery && $input.length) $input.val(savedQuery);
    } catch (error) { /* ignore */ }

    if ($filterButtons.length) {
      $filterButtons.each(function () {
        $(this).toggleClass('is-active', $(this).attr('data-filter') === currentCategory);
      });
    }

    const suggestionPool = [
      { label: 'Cola — 800 ₸',             value: 'Cola',      tag: 'Drinks' },
      { label: 'Кола (газировка)',          value: 'Кола',      tag: 'Напитки' },
      { label: 'Gorilla — 650 ₸',          value: 'Gorilla',   tag: 'Energy' },
      { label: 'Горилла (энергетик)',       value: 'Горилла',   tag: 'Напитки' },
      { label: 'Asu — 400 ₸',              value: 'Asu',       tag: 'Water' },
      { label: 'Асу (вода)',               value: 'Асу',       tag: 'Напитки' },
      { label: 'Buerger — 700 ₸',          value: 'Buerger',   tag: 'Food' },
      { label: 'Бургер',                   value: 'Бургер',    tag: 'Еда' },
      { label: 'Romanov — 800 ₸',          value: 'Romanov',   tag: 'Food' },
      { label: 'Сэндвич Романов',          value: 'Сэндвич',   tag: 'Еда' },
      { label: 'Maxi — 600 ₸',             value: 'Maxi',      tag: 'Snacks' },
      { label: 'Eclipse — 400 ₸',          value: 'Eclipse',   tag: 'Gum' },
      { label: 'Жвачка Eclipse',           value: 'Жвачка',    tag: 'Снеки' },
      { label: 'Lays — 1000 ₸',            value: 'Lays',      tag: 'Chips' },
      { label: 'Чипсы Lays',               value: 'Чипсы',     tag: 'Снеки' },
      { label: 'Batonchik — 600 ₸',        value: 'Batonchik', tag: 'Snacks' },
      { label: 'Батончик шоколадный',      value: 'Батончик',  tag: 'Снеки' },
      { label: 'All Drinks / Все напитки', value: 'Drinks',    tag: 'Category' },
      { label: 'Food / Вся еда',           value: 'Food',      tag: 'Category' },
      { label: 'Snacks / Снеки',           value: 'Snacks',    tag: 'Category' },
      { label: 'До 600 ₸',                 value: '600',       tag: 'Бюджет' }
    ];

    function applyFilterAndSearch(showAutocomplete) {
      const query = $input.length ? String($input.val() || '').trim() : '';
      const lower = query.toLowerCase();
      const savedIds = getSavedMenuIds();

      try {
        localStorage.setItem(MENU_FILTER_KEY, currentCategory);
        localStorage.setItem(MENU_SEARCH_KEY, query);
      } catch (e) { /* ignore */ }

      if ($clear.length) {
        if (query) $clear.removeAttr('hidden');
        else $clear.attr('hidden', true);
      }

      const categoryItems = menu.filterBy(currentCategory, savedIds);
      const matchingItems = categoryItems.filter(function (item) {
        if (!query) return true;
        const itemText = (item.name + ' ' + item.categoryLabel + ' ' + item.category + ' ' + item.price + ' ' + item.keywords).toLowerCase();
        return itemText.indexOf(lower) !== -1;
      });

      const matchingIds = matchingItems.map(function (it) { return it.id; });

      if ($cards.length) {
        $cards.each(function () {
          const id = $(this).attr('data-id') || $(this).find('.menu-name').text().split('—')[0].trim().toLowerCase();
          const isMatch = matchingIds.indexOf(id) !== -1;
          $(this).toggle(isMatch);
        });
        highlightMatches($cards.filter(':visible').find('.menu-name, .menu-category'), query);
      }

      if ($carouselItems.length) {
        let firstMatchIndex = -1;
        const $indicators = $('#menuCarousel .carousel-indicators button');
        $carouselItems.each(function (idx) {
          const id = $(this).attr('data-id') || $(this).find('h5').text().split('—')[0].trim().toLowerCase();
          const isMatch = matchingIds.indexOf(id) !== -1;
          $(this).toggleClass('d-none', !isMatch);
          if ($indicators.length) {
            $indicators.eq(idx).toggleClass('d-none', !isMatch);
          }
          if (isMatch && firstMatchIndex === -1) firstMatchIndex = idx;
        });
        highlightMatches($carouselItems.find('h5, span'), query);

        if (firstMatchIndex !== -1) {
          $('#menuCarousel').show();
          if (!$carouselItems.eq(firstMatchIndex).hasClass('active')) {
            $carouselItems.removeClass('active');
            $carouselItems.eq(firstMatchIndex).addClass('active');
            if ($indicators.length) {
              $indicators.removeClass('active').removeAttr('aria-current');
              $indicators.eq(firstMatchIndex).addClass('active').attr('aria-current', 'true');
            }
          }
        } else {
          $('#menuCarousel').hide();
        }
      }

      if ($list.length) {
        $list.empty();
        if (matchingItems.length) {
          const listHtml = matchingItems.map(function (item, idx) {
            const isSaved = savedIds.indexOf(item.id) !== -1;
            return '<li class="price-item is-visible" tabindex="0" data-id="' + item.id + '" data-index="' + idx + '">' +
              '<span class="price-name">' + escapeHtml(item.name) + '</span>' +
              '<span class="price-item-actions">' +
                '<span class="price-val">' + item.price + ' &#8376;</span>' +
                '<button type="button" class="price-save-btn ' + (isSaved ? 'is-saved' : '') + '" data-save-menu="' + item.id + '" aria-label="Save ' + escapeHtml(item.name) + '">' +
                  (isSaved ? '✓ Saved' : '+ Save') +
                '</button>' +
              '</span>' +
            '</li>';
          }).join('');
          $list.html(listHtml);
          highlightMatches($list.find('.price-name, .price-val'), query);
        } else {
          $list.html('<li class="price-item-empty text-muted py-3 text-center">No snacks or drinks match your filter.</li>');
        }

        if ($summary.length) {
          if (!matchingItems.length) {
            $summary.text('0 items found for the selected criteria.');
          } else {
            $summary.text(
              matchingItems.length + ' item(s), average price ' + menu.averagePrice(matchingItems) +
              ' ₸. With 2000 ₸ you can grab up to ' + menu.itemsForBudget(2000) + ' of the cheapest snacks.'
            );
          }
        }
      }

      if ($status.length) {
        const totalCount = matchingItems.length;
        if (!query) {
          if (currentCategory !== 'all') {
            $status.text('Filtered by ' + currentCategory + ': ' + totalCount + ' item(s) (saved in localStorage).');
          } else {
            $status.text('');
          }
        } else if (totalCount === 0) {
          $status.text('No snacks or drinks found for "' + query + '". Try searching for Cola, Burger, Drinks, Snacks, or 600 ₸.');
        } else {
          $status.text('Found ' + totalCount + ' matching item(s) for "' + query + '".');
        }
      }

      if (showAutocomplete && $suggestions.length) {
        renderSuggestions($suggestions, suggestionPool, query, function (chosen) {
          $input.val(chosen);
          applyFilterAndSearch(false);
          $input.trigger('focus');
        });
      }

      renderSavedMenuTray();
    }

    if ($input.length) {
      $input.off('keyup.menu input.menu').on('keyup.menu input.menu', function (event) {
        if (event.key === 'Escape') {
          if ($suggestions.length) $suggestions.empty().attr('hidden', true);
          return;
        }
        applyFilterAndSearch(true);
      });

      if ($clear.length) {
        $clear.off('click.menu').on('click.menu', function () {
          $input.val('');
          if ($suggestions.length) $suggestions.empty().attr('hidden', true);
          applyFilterAndSearch(false);
          $input.trigger('focus');
        });
      }

      $(document).off('click.menuSuggestions').on('click.menuSuggestions', function (event) {
        if (!$(event.target).closest('#menu-search-wrapper').length) {
          if ($suggestions.length) $suggestions.empty().attr('hidden', true);
        }
      });
    }

    if ($filterButtons.length) {
      $filterButtons.off('click.menu').on('click.menu', function () {
        const filter = $(this).attr('data-filter') || 'all';
        currentCategory = filter;
        $filterButtons.each(function () {
          $(this).toggleClass('is-active', $(this).attr('data-filter') === filter);
        });
        playSound('click');
        applyFilterAndSearch(false);
      });
    }

    if ($list.length) {
      // Save button click inside price list
      $list.off('click.saveMenu').on('click.saveMenu', '[data-save-menu]', function (event) {
        event.stopPropagation();
        const itemId = $(this).attr('data-save-menu');
        const added = toggleSavedMenuItem(itemId);
        const itemObj = menu.items.find(function (it) { return it.id === itemId; });
        playSound(added ? 'success' : 'click');
        showToast(
          (added ? 'Saved to tray: ' : 'Removed from tray: ') + (itemObj ? itemObj.name : itemId),
          added ? 'success' : 'info'
        );
        applyFilterAndSearch(false);
      });

      // Remove button inside Saved Tray
      $(document).off('click.removeSavedMenu').on('click.removeSavedMenu', '[data-remove-saved]', function () {
        const itemId = $(this).attr('data-remove-saved');
        toggleSavedMenuItem(itemId);
        playSound('click');
        applyFilterAndSearch(false);
      });

      $('#clear-saved-menu').off('click.clearSaved').on('click.clearSaved', function () {
        writeJsonStorage(SAVED_MENU_KEY, []);
        playSound('click');
        showToast('Cleared all saved snacks.', 'info');
        applyFilterAndSearch(false);
      });

      // Keyboard navigation in price list
      $list.off('keydown.priceNav').on('keydown.priceNav', '.price-item', function (event) {
        const $items = $list.find('.price-item');
        const idx = $items.index(this);
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          event.stopPropagation();
          const next = Math.min($items.length - 1, idx + 1);
          $items.eq(next).focus().addClass('is-selected').siblings().removeClass('is-selected');
          playSound('click');
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          event.stopPropagation();
          const prev = Math.max(0, idx - 1);
          $items.eq(prev).focus().addClass('is-selected').siblings().removeClass('is-selected');
          playSound('click');
        } else if (event.key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
          const itemId = $(this).attr('data-id');
          if (itemId) {
            const added = toggleSavedMenuItem(itemId);
            const name = $(this).find('.price-name').text();
            showToast((added ? 'Saved: ' : 'Removed: ') + name, added ? 'success' : 'info');
            playSound('success');
            applyFilterAndSearch(false);
          }
        }
      });

      $list.off('click.priceSelect').on('click.priceSelect', '.price-item', function (event) {
        if ($(event.target).closest('button').length) return;
        $(this).addClass('is-selected').siblings().removeClass('is-selected');
        const name = $(this).find('.price-name').text();
        const price = $(this).find('.price-val').text();
        showToast('Selected: ' + name + ' (' + price + ')', 'info');
        playSound('click');
      });
    }

    applyFilterAndSearch(false);
  }

  /* ======================================================================
     13. FAQ Search, Autocomplete & Highlighting (index.html)
     ====================================================================== */
  function initFaqSearch() {
    if (typeof window.jQuery === 'undefined') return;
    const $input = $('#faq-search');
    if (!$input.length) return;

    const $clear = $('#faq-search-clear');
    const $suggestions = $('#faq-suggestions');
    const $status = $('#faq-search-status');
    const $items = $('#faq .faq-item');

    const faqSuggestions = [
      { label: 'How do I book a seat?',       value: 'book a seat', tag: 'Booking' },
      { label: 'Open 24/7 in Astana',         value: '24/7',        tag: 'Hours' },
      { label: 'Daytime vs Night Pass hours', value: 'Night Pass',  tag: 'Tariffs' },
      { label: 'VIP Zone private booths',     value: 'VIP Zone',    tag: 'Zones' },
      { label: 'Bootcamp Zone training',      value: 'Bootcamp',    tag: 'Zones' },
      { label: 'Tournament Room brackets',    value: 'Tournament',  tag: 'Events' },
      { label: 'Mangilik El 55/1 address',    value: 'Mangilik El', tag: 'Location' }
    ];

    function runFaqSearch(showAutocomplete) {
      const query = String($input.val() || '').trim();
      const lower = query.toLowerCase();

      if (query) $clear.removeAttr('hidden');
      else $clear.attr('hidden', true);

      const totalHighlights = highlightMatches(
        $items.find('.faq-question span:first-child, .faq-answer-inner p'),
        query
      );

      $items.hide();
      const $matched = $items.filter(function () {
        return $(this).text().toLowerCase().indexOf(lower) !== -1;
      });
      $matched.show();

      $items.each(function () {
        const isMatch = Boolean(query) && $(this).is(':visible');
        setAccordionItem(this, isMatch);
      });

      if (!query) {
        $status.text('');
      } else if (!$matched.length) {
        $status.text('No FAQ entries match "' + query + '".');
      } else {
        $status.text(
          'Found ' + totalHighlights + ' highlighted match(es) across ' + $matched.length + ' question(s).'
        );
      }

      if (showAutocomplete) {
        renderSuggestions($suggestions, faqSuggestions, query, function (chosen) {
          $input.val(chosen);
          runFaqSearch(false);
        });
      }
    }

    $input.on('keyup input', function (event) {
      if (event.key === 'Escape') {
        $suggestions.empty().attr('hidden', true);
        return;
      }
      runFaqSearch(true);
    });

    $clear.on('click', function () {
      $input.val('');
      $suggestions.empty().attr('hidden', true);
      runFaqSearch(false);
      $input.trigger('focus');
    });

    $(document).on('click', function (event) {
      if (!$(event.target).closest('#faq-search-wrapper').length) {
        $suggestions.empty().attr('hidden', true);
      }
    });
  }

  /* ======================================================================
     14. Scroll Progress Bar & Animated Number Counters
     ====================================================================== */
  function initScrollProgress() {
    if (typeof window.jQuery === 'undefined') return;
    if (!$('#scroll-progress').length) {
      $('body').prepend(
        '<div class="scroll-progress" id="scroll-progress" aria-hidden="true">' +
          '<div class="scroll-progress-bar" id="scroll-progress-bar"></div>' +
        '</div>'
      );
    }

    const $bar = $('#scroll-progress-bar');

    function updateProgress() {
      const scrollTop = $(window).scrollTop();
      const docHeight = $(document).height() - $(window).height();
      const percent = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
      $bar.css('width', percent + '%');
    }

    $(window).on('scroll resize', updateProgress);
    updateProgress();
  }

  function initCounters() {
    if (typeof window.jQuery === 'undefined') return;
    const $counters = $('.stat-number[data-target]');
    if (!$counters.length) return;

    function animateCountersIfVisible() {
      const viewBottom = $(window).scrollTop() + $(window).height();

      $counters.each(function () {
        const $counter = $(this);
        if ($counter.data('counted')) return;

        if ($counter.offset().top < viewBottom - 30) {
          $counter.data('counted', true);
          const target = Number($counter.attr('data-target')) || 0;
          const suffix = $counter.attr('data-suffix') || '';

          $({ countValue: 0 }).animate(
            { countValue: target },
            {
              duration: 1800,
              easing: 'swing',
              step: function () {
                $counter.text(Math.floor(this.countValue) + suffix);
              },
              complete: function () {
                $counter.text(target + suffix);
              }
            }
          );
        }
      });
    }

    $(window).on('scroll resize', animateCountersIfVisible);
    animateCountersIfVisible();
  }

  /* ======================================================================
     15. Loading Spinner, Toast Notifications & Clipboard Copy
     ====================================================================== */
  function setSubmitLoading(button, isLoading) {
    if (!button) return;
    if (typeof window.jQuery !== 'undefined') {
      const $btn = $(button);
      if (isLoading) {
        if (!$btn.data('original-label')) {
          $btn.data('original-label', $btn.text());
        }
        $btn.prop('disabled', true).addClass('is-loading');
        $btn.html('<span class="btn-spinner" aria-hidden="true"></span><span>Please wait…</span>');
      } else {
        $btn.prop('disabled', false).removeClass('is-loading');
        $btn.text($btn.data('original-label') || 'Submit');
      }
      return;
    }

    if (isLoading) {
      button.dataset.originalLabel = button.textContent;
      button.disabled = true;
      button.textContent = 'Please wait…';
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalLabel || 'Submit';
    }
  }

  function showToast(message, type) {
    if (typeof window.jQuery === 'undefined') return;
    let $container = $('#toast-container');
    if (!$container.length) {
      $container = $('<div class="toast-container" id="toast-container" aria-live="polite"></div>');
      $('body').append($container);
    }

    const kind = type || 'success';
    const icon = kind === 'success' ? '✓' : (kind === 'info' ? 'i' : '!');
    const $toast = $(
      '<div class="toast-notification is-' + kind + '" role="status">' +
        '<span class="toast-icon" aria-hidden="true">' + icon + '</span>' +
        '<span class="toast-text"></span>' +
      '</div>'
    );
    $toast.find('.toast-text').text(message);

    $container.append($toast);
    $toast.hide().fadeIn(220).delay(2800).fadeOut(400, function () {
      $(this).remove();
    });
  }

  function copyStringToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text).catch(function () {
        fallbackCopyText(text);
      });
    }
    fallbackCopyText(text);
    return Promise.resolve();
  }

  function fallbackCopyText(text) {
    const $temp = $('<textarea readonly></textarea>').val(text).css({
      position: 'fixed',
      left: '-9999px',
      top: '0'
    });
    $('body').append($temp);
    $temp[0].select();
    try { document.execCommand('copy'); } catch (error) { /* ignore */ }
    $temp.remove();
  }

  function initClipboardCopy() {
    if (typeof window.jQuery === 'undefined') return;
    const $buttons = $('.copy-btn');
    if (!$buttons.length) return;

    $(document).off('copy.clipboard').on('copy.clipboard', '.copy-btn, .copy-snippet', function (event, manualValue) {
      event.stopPropagation();
      const $btn = $(this).hasClass('copy-btn') ? $(this) : $(this).find('.copy-btn');
      if (!$btn.length) return;

      const copiedValue = manualValue || $btn.attr('data-copy') || '';
      const $icon = $btn.find('.copy-icon');
      const $label = $btn.find('.copy-text');

      $icon.text('✓');
      $label.text('Copied');
      $btn.addClass('is-copied');

      clearTimeout($btn.data('copy-timer'));
      const timer = setTimeout(function () {
        $icon.text('📋');
        $label.text('Copy');
        $btn.removeClass('is-copied');
      }, 2000);
      $btn.data('copy-timer', timer);

      playSound('success');
      showToast('Copied to clipboard: ' + copiedValue, 'success');
    });

    $buttons.off('click.clipboard').on('click.clipboard', function () {
      const $btn = $(this);
      const value = $btn.attr('data-copy') || '';
      copyStringToClipboard(value).then(function () {
        $btn.trigger('copy', [value]);
      });
    });
  }

  /* ======================================================================
     16. Image Lazy Loading
     ====================================================================== */
  function initLazyLoading() {
    if (typeof window.jQuery === 'undefined') return;
    const $lazyImages = $('img.lazy-img[data-src]');
    if (!$lazyImages.length) return;

    function checkAndLoadImages() {
      const scrollTop = $(window).scrollTop();
      const windowHeight = $(window).height();

      $lazyImages.each(function () {
        const $img = $(this);
        const realSrc = $img.attr('data-src');
        if (!realSrc) return;

        if ($img.offset().top < scrollTop + windowHeight + 120) {
          $img.on('load', function () {
            $img.addClass('is-loaded');
          });
          $img.attr('src', realSrc).removeAttr('data-src');
          if (this.complete) {
            $img.addClass('is-loaded');
          }
        }
      });
    }

    $(window).on('scroll resize', checkAndLoadImages);
    checkAndLoadImages();
  }

  /* ======================================================================
     17. Interactive Tariff Table Navigation (services.html)
     ====================================================================== */
  function initTableNavigation() {
    if (typeof window.jQuery === 'undefined') return;
    const $table = $('#tariff-table');
    if (!$table.length) return;

    const $tbody = $table.find('tbody');
    const $rows = $tbody.find('tr');
    if (!$rows.length) return;

    const $selectionText = $('#table-nav-selection');
    const $bookLink = $('#table-nav-book');
    const $dpadBtns = $('.table-nav-btn');

    const totalRows = $rows.length;
    const totalCols = 4;

    let curRow = 0;
    let curCol = 0;

    const zoneNames = ['Main Zone', 'VIP Zone', 'Bootcamp Zone', 'Tournament Room'];
    const zoneValues = ['main', 'vip', 'bootcamp', 'tournament'];

    function selectCell(r, c, playSnd) {
      curRow = Math.max(0, Math.min(totalRows - 1, r));
      curCol = Math.max(0, Math.min(totalCols - 1, c));

      $tbody.find('td').removeClass('is-cell-selected');

      const $row = $rows.eq(curRow);
      const $cells = $row.find('td');
      const $targetCell = $cells.eq(curCol + 1);

      $targetCell.addClass('is-cell-selected');

      const pkgLabel = String($cells.eq(0).clone().children().remove().end().text() || '').trim();
      const zoneName = zoneNames[curCol] || 'Zone';
      const zoneVal = zoneValues[curCol] || 'main';
      const price = String($targetCell.text() || '').trim();

      if ($selectionText.length) {
        $selectionText.text(zoneName + ' — ' + pkgLabel + ' (' + price + ')');
      }

      if ($bookLink.length) {
        $bookLink.attr('href', 'contact.html?zone=' + zoneVal + '&tariff=' + encodeURIComponent(pkgLabel));
      }

      if (playSnd) {
        playSound('click');
      }
    }

    $tbody.on('click', 'td:not(.col-label)', function () {
      const $cell = $(this);
      const $row = $cell.closest('tr');
      const r = $rows.index($row);
      const c = $row.find('td:not(.col-label)').index($cell);
      selectCell(r, c, true);
    });

    $dpadBtns.on('click', function (event) {
      event.preventDefault();
      const dir = $(this).attr('data-dir');
      if (dir === 'up') selectCell(curRow - 1, curCol, true);
      else if (dir === 'down') selectCell(curRow + 1, curCol, true);
      else if (dir === 'left') selectCell(curRow, curCol - 1, true);
      else if (dir === 'right') selectCell(curRow, curCol + 1, true);
    });

    // Keyboard navigation when focusing on table or its toolbar
    $table.add('#table-nav-toolbar').on('keydown.tariffTable', function (event) {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          event.stopPropagation();
          selectCell(curRow - 1, curCol, true);
          break;
        case 'ArrowDown':
          event.preventDefault();
          event.stopPropagation();
          selectCell(curRow + 1, curCol, true);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          event.stopPropagation();
          selectCell(curRow, curCol - 1, true);
          break;
        case 'ArrowRight':
          event.preventDefault();
          event.stopPropagation();
          selectCell(curRow, curCol + 1, true);
          break;
        case 'Home':
          event.preventDefault();
          event.stopPropagation();
          selectCell(curRow, 0, true);
          break;
        case 'End':
          event.preventDefault();
          event.stopPropagation();
          selectCell(curRow, totalCols - 1, true);
          break;
        case 'Enter':
          event.preventDefault();
          event.stopPropagation();
          showToast('Selected: ' + $selectionText.text(), 'success');
          playSound('success');
          break;
        default:
          break;
      }
    });

    selectCell(0, 0, false);
  }

  /* ======================================================================
     18. External Public API Integration (Requirement 7)
     Fetches real PC games from the public CheapShark / Steam API using
     async/await and fetch(). Displays loading spinner, handles errors gracefully,
     supports live game search & sorting, and saves favorites to localStorage.
     ====================================================================== */
  const FALLBACK_CLUB_GAMES = [
    {
      gameID: 'cs2',
      steamAppID: '730',
      title: 'Counter-Strike 2',
      salePrice: '0.00',
      normalPrice: '14.99',
      steamRatingPercent: '88',
      steamRatingText: 'Very Positive',
      metacriticScore: '83',
      thumb: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg'
    },
    {
      gameID: 'dota2',
      steamAppID: '570',
      title: 'Dota 2',
      salePrice: '0.00',
      normalPrice: '0.00',
      steamRatingPercent: '82',
      steamRatingText: 'Very Positive',
      metacriticScore: '90',
      thumb: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/570/header.jpg'
    },
    {
      gameID: 'witcher3',
      steamAppID: '292030',
      title: 'The Witcher 3: Wild Hunt',
      salePrice: '9.99',
      normalPrice: '39.99',
      steamRatingPercent: '96',
      steamRatingText: 'Overwhelmingly Positive',
      metacriticScore: '93',
      thumb: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg'
    },
    {
      gameID: 'cyberpunk',
      steamAppID: '1091500',
      title: 'Cyberpunk 2077',
      salePrice: '29.99',
      normalPrice: '59.99',
      steamRatingPercent: '84',
      steamRatingText: 'Very Positive',
      metacriticScore: '86',
      thumb: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg'
    },
    {
      gameID: 'apex',
      steamAppID: '1172470',
      title: 'Apex Legends',
      salePrice: '0.00',
      normalPrice: '0.00',
      steamRatingPercent: '78',
      steamRatingText: 'Mostly Positive',
      metacriticScore: '88',
      thumb: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1172470/header.jpg'
    },
    {
      gameID: 'eldenring',
      steamAppID: '1245620',
      title: 'ELDEN RING',
      salePrice: '35.99',
      normalPrice: '59.99',
      steamRatingPercent: '93',
      steamRatingText: 'Very Positive',
      metacriticScore: '94',
      thumb: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg'
    },
    {
      gameID: 'l4d2',
      steamAppID: '550',
      title: 'Left 4 Dead 2',
      salePrice: '1.99',
      normalPrice: '9.99',
      steamRatingPercent: '97',
      steamRatingText: 'Overwhelmingly Positive',
      metacriticScore: '89',
      thumb: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/550/header.jpg'
    },
    {
      gameID: 'pubg',
      steamAppID: '578080',
      title: 'PUBG: BATTLEGROUNDS',
      salePrice: '0.00',
      normalPrice: '0.00',
      steamRatingPercent: '59',
      steamRatingText: 'Mixed',
      metacriticScore: '86',
      thumb: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/578080/header.jpg'
    }
  ];

  function getSavedGames() {
    return readJsonStorage(SAVED_GAMES_KEY, []);
  }

  function initGamesApi() {
    const section = document.getElementById('games-api-section');
    if (!section) return;

    const grid = document.getElementById('api-games-grid');
    const loadingEl = document.getElementById('api-loading');
    const errorEl = document.getElementById('api-error');
    const errorMsgEl = document.getElementById('api-error-msg');
    const statusText = document.getElementById('api-status-text');
    const searchInput = document.getElementById('api-game-search');
    const searchBtn = document.getElementById('api-search-btn');
    const clearBtn = document.getElementById('api-clear-btn');
    const refreshBtn = document.getElementById('api-refresh-btn');
    const retryBtn = document.getElementById('api-retry-btn');
    const fallbackBtn = document.getElementById('api-fallback-btn');
    const savedCountEl = document.getElementById('api-saved-count');
    const filterBtns = section.querySelectorAll('#api-filter-group .filter-btn');

    let currentSort = 'Metacritic';
    let lastFetchedGames = [];

    function updateSavedCount() {
      if (savedCountEl) {
        savedCountEl.textContent = String(getSavedGames().length);
      }
    }

    function isGameSaved(gameID) {
      return getSavedGames().some(function (g) { return String(g.gameID) === String(gameID); });
    }

    function toggleSaveGame(gameObj) {
      const saved = getSavedGames();
      const idx = saved.findIndex(function (g) { return String(g.gameID) === String(gameObj.gameID); });
      let added = false;
      if (idx === -1) {
        saved.push({
          gameID: String(gameObj.gameID),
          steamAppID: gameObj.steamAppID || '',
          title: gameObj.title,
          salePrice: gameObj.salePrice || '0.00',
          normalPrice: gameObj.normalPrice || '0.00',
          steamRatingPercent: gameObj.steamRatingPercent || '90',
          steamRatingText: gameObj.steamRatingText || 'Very Positive',
          thumb: gameObj.thumb
        });
        added = true;
      } else {
        saved.splice(idx, 1);
      }
      writeJsonStorage(SAVED_GAMES_KEY, saved);
      updateSavedCount();
      return added;
    }

    function renderGames(games, sourceNote) {
      if (!grid) return;
      updateSavedCount();

      if (!games || !games.length) {
        grid.innerHTML =
          '<div class="col-12">' +
            '<div class="card text-center py-4">' +
              '<p class="mb-0 text-muted">No PC games matched your search criteria. Try another title or filter.</p>' +
            '</div>' +
          '</div>';
        if (statusText) statusText.textContent = '0 games found.';
        return;
      }

      if (statusText) {
        statusText.textContent = sourceNote || ('Showing ' + games.length + ' PC game(s) from live Steam / CheapShark API.');
      }

      grid.innerHTML = games.map(function (deal) {
        const gameID = deal.gameID || deal.dealID || deal.title;
        const steamAppID = deal.steamAppID;
        const imgUrl = steamAppID
          ? 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/' + encodeURIComponent(steamAppID) + '/header.jpg'
          : (deal.thumb || 'images/Main.jpg');
        const fallbackThumb = deal.thumb || 'images/Main.jpg';
        const ratingPct = Number(deal.steamRatingPercent) || 88;
        const ratingText = deal.steamRatingText || 'Very Positive';
        const salePrice = Number(deal.salePrice || 0).toFixed(2);
        const normalPrice = Number(deal.normalPrice || 0).toFixed(2);
        const saved = isGameSaved(gameID);

        return '<div class="col">' +
          '<article class="card api-game-card">' +
            '<div class="api-game-img-wrap">' +
              '<img class="api-game-img" src="' + escapeHtml(imgUrl) + '" data-fallback="' + escapeHtml(fallbackThumb) + '" alt="' + escapeHtml(deal.title) + '" loading="lazy">' +
              '<span class="api-rating-badge">★ ' + escapeHtml(ratingPct) + '% Steam</span>' +
              '<span class="api-club-badge">Pre-Installed</span>' +
            '</div>' +
            '<div class="api-game-body">' +
              '<h3 class="api-game-title">' + escapeHtml(deal.title) + '</h3>' +
              '<p class="api-game-meta">' + escapeHtml(ratingText) + (deal.metacriticScore && deal.metacriticScore !== '0' ? ' · Metacritic ' + escapeHtml(deal.metacriticScore) : '') + '</p>' +
              '<div class="api-game-footer">' +
                '<div>' +
                  '<span class="api-price-tag">' + (salePrice === '0.00' ? 'Free to Play' : ('$' + escapeHtml(salePrice))) + '</span>' +
                  (normalPrice !== salePrice && normalPrice !== '0.00' ? '<span class="api-price-old">$' + escapeHtml(normalPrice) + '</span>' : '') +
                '</div>' +
                '<button type="button" class="api-save-btn ' + (saved ? 'is-saved' : '') + '" data-save-game="' + escapeHtml(gameID) + '">' +
                  (saved ? '★ Saved' : '☆ Save') +
                '</button>' +
              '</div>' +
            '</div>' +
          '</article>' +
        '</div>';
      }).join('');

      // Attach image fallback handler
      grid.querySelectorAll('img.api-game-img').forEach(function (img) {
        img.addEventListener('error', function () {
          const fb = img.getAttribute('data-fallback');
          if (fb && img.src !== fb) {
            img.src = fb;
          } else {
            img.src = 'images/Main.jpg';
          }
        }, { once: true });
      });
    }

    async function fetchSteamGames(query, sortBy) {
      if (currentSort === 'saved' && !query) {
        const savedList = getSavedGames();
        if (loadingEl) loadingEl.hidden = true;
        if (errorEl) errorEl.hidden = true;
        lastFetchedGames = savedList;
        renderGames(savedList, 'Showing ' + savedList.length + ' saved game(s) from localStorage.');
        return;
      }

      if (loadingEl) loadingEl.hidden = false;
      if (errorEl) errorEl.hidden = true;
      if (grid) grid.innerHTML = '';
      if (statusText) statusText.textContent = 'Requesting live data from CheapShark Steam API…';

      let url = 'https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=8';
      if (query) {
        url += '&title=' + encodeURIComponent(query);
      } else if (sortBy === 'Price') {
        url += '&upperPrice=15&sortBy=Deal%20Rating';
      } else {
        url += '&sortBy=' + encodeURIComponent(sortBy || 'Metacritic');
      }

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('API returned HTTP status ' + response.status);
        }
        const data = await response.json();
        if (loadingEl) loadingEl.hidden = true;

        // Deduplicate by title for cleaner catalog display
        const seen = {};
        const unique = (Array.isArray(data) ? data : []).filter(function (item) {
          const key = (item.title || '').toLowerCase();
          if (!key || seen[key]) return false;
          seen[key] = true;
          return true;
        }).slice(0, 8);

        lastFetchedGames = unique;
        renderGames(
          unique,
          query
            ? ('Found ' + unique.length + ' Steam game(s) matching "' + query + '" via live API.')
            : ('Loaded ' + unique.length + ' live PC games from Steam / CheapShark API (' + (sortBy || 'Top Rated') + ').')
        );
      } catch (error) {
        if (loadingEl) loadingEl.hidden = true;
        if (errorEl) errorEl.hidden = false;
        if (errorMsgEl) {
          errorMsgEl.textContent = 'Failed to fetch live Steam API data (' + (error && error.message ? error.message : 'Network error') + ').';
        }
        if (statusText) {
          statusText.textContent = 'API request failed. You can retry or load the club backup catalog.';
        }
      }
    }

    // Event listeners for API controls
    if (searchBtn && searchInput) {
      searchBtn.addEventListener('click', function () {
        const q = searchInput.value.trim();
        if (clearBtn) clearBtn.hidden = !q;
        playSound('click');
        fetchSteamGames(q, currentSort);
      });

      searchInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          const q = searchInput.value.trim();
          if (clearBtn) clearBtn.hidden = !q;
          playSound('click');
          fetchSteamGames(q, currentSort);
        }
      });
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener('click', function () {
        searchInput.value = '';
        clearBtn.hidden = true;
        playSound('click');
        fetchSteamGames('', currentSort);
      });
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentSort = btn.getAttribute('data-api-sort') || 'Metacritic';
        filterBtns.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        playSound('click');
        const q = searchInput ? searchInput.value.trim() : '';
        fetchSteamGames(q, currentSort);
      });
    });

    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        playSound('click');
        const q = searchInput ? searchInput.value.trim() : '';
        fetchSteamGames(q, currentSort);
        showToast('Refreshed live Steam games catalog!', 'info');
      });
    }

    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        playSound('click');
        const q = searchInput ? searchInput.value.trim() : '';
        fetchSteamGames(q, currentSort);
      });
    }

    if (fallbackBtn) {
      fallbackBtn.addEventListener('click', function () {
        if (errorEl) errorEl.hidden = true;
        lastFetchedGames = FALLBACK_CLUB_GAMES;
        playSound('success');
        renderGames(FALLBACK_CLUB_GAMES, 'Showing 8 pre-installed club games (offline backup catalog).');
        showToast('Loaded club backup games catalog.', 'info');
      });
    }

    if (grid) {
      grid.addEventListener('click', function (event) {
        const saveBtn = event.target.closest('[data-save-game]');
        if (!saveBtn) return;
        const id = saveBtn.getAttribute('data-save-game');
        const gameObj = lastFetchedGames.find(function (g) {
          return String(g.gameID || g.dealID || g.title) === String(id);
        });
        if (!gameObj) return;

        const added = toggleSaveGame({
          gameID: id,
          steamAppID: gameObj.steamAppID,
          title: gameObj.title,
          salePrice: gameObj.salePrice,
          normalPrice: gameObj.normalPrice,
          steamRatingPercent: gameObj.steamRatingPercent,
          steamRatingText: gameObj.steamRatingText,
          thumb: gameObj.thumb
        });

        saveBtn.classList.toggle('is-saved', added);
        saveBtn.textContent = added ? '★ Saved' : '☆ Save';
        playSound(added ? 'success' : 'click');
        showToast((added ? 'Bookmarked game: ' : 'Removed bookmark: ') + gameObj.title, added ? 'success' : 'info');

        if (currentSort === 'saved') {
          fetchSteamGames('', 'saved');
        }
      });
    }

    updateSavedCount();
    fetchSteamGames('', currentSort);
  }

  /* ======================================================================
     10b. Keyboard Navigation Across Cards (with conflict prevention)
     ====================================================================== */
  function initBootstrapCardNav() {
    if (typeof window.jQuery === 'undefined') return;

    function queryCards() {
      return $('.card:visible, .custom-card:visible').filter(function () {
        return !$(this).closest('.popup-box, .popup-overlay, .fab-group').length;
      });
    }

    let $cards = queryCards();
    if (!$cards.length) return;
    const $carousel = $('#menuCarousel');
    let activeIndex = -1;

    function getCardTitle($el) {
      const heading = $el.find('.card-title, .api-game-title, h1, h2, h3, h4, h5, .stat-label').first().text().trim();
      if (heading) return heading;
      const text = $el.text().trim();
      return text ? text.slice(0, 32) + '…' : 'Card';
    }

    function setupCardAttributes() {
      $cards = queryCards();
      $cards.each(function (idx) {
        const $card = $(this);
        if (!$card.attr('tabindex')) {
          $card.attr('tabindex', '0');
        }
        $card.attr('role', 'region');
        $card.attr('data-card-index', idx);
        if (!$card.attr('aria-label')) {
          $card.attr('aria-label', getCardTitle($card));
        }
      });
    }

    setupCardAttributes();

    function setActiveCard(index, shouldScroll, playAudio) {
      $cards = queryCards();
      if (!$cards.length) return;

      if (index < 0) index = $cards.length - 1;
      if (index >= $cards.length) index = 0;
      activeIndex = index;

      $cards.removeClass('is-card-focused').attr('aria-selected', 'false');
      const $target = $cards.eq(activeIndex);
      $target.addClass('is-card-focused').attr('aria-selected', 'true');
      $target.focus();

      if (shouldScroll && $target.length && $target[0].scrollIntoView) {
        $target[0].scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }

      if (playAudio) {
        playSound('click');
      }
    }

    $(document).off('click.cardNav', '.card, .custom-card').on('click.cardNav', '.card, .custom-card', function (event) {
      if ($(event.target).closest('a, button, input, textarea, select, label').length) return;
      $cards = queryCards();
      const idx = $cards.index(this);
      if (idx !== -1) {
        setActiveCard(idx, false, true);
      }
    });

    $(document).off('focusin.cardNav', '.card, .custom-card').on('focusin.cardNav', '.card, .custom-card', function (event) {
      if ($(event.target).is('input, textarea, select, button, a')) return;
      $cards = queryCards();
      const idx = $cards.index(this);
      if (idx !== -1 && idx !== activeIndex) {
        $cards.removeClass('is-card-focused').attr('aria-selected', 'false');
        $(this).addClass('is-card-focused').attr('aria-selected', 'true');
        activeIndex = idx;
      }
    });

    $(document).off('keydown.bootstrapCardNav').on('keydown.bootstrapCardNav', function (event) {
      const activeEl = document.activeElement;
      const activeTag = (activeEl && activeEl.tagName) ? activeEl.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || $(activeEl).is('[contenteditable]')) {
        return;
      }
      // Do not hijack arrow keys when inside navbar, price-list, tariff-table, or open popup
      if ($(activeEl).closest('.navbar-nav, .pure-nav-list, #price-list, #tariff-table, #table-nav-toolbar, .popup-overlay.is-open').length) {
        return;
      }

      $cards = queryCards();

      if ($carousel.length && $(activeEl).closest('#menuCarousel').length) {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          $carousel.carousel('next');
          playSound('click');
          return;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          $carousel.carousel('prev');
          playSound('click');
          return;
        }
      }

      if (!$cards.length) return;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          setActiveCard(activeIndex + 1, true, true);
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          setActiveCard(activeIndex - 1, true, true);
          break;

        case 'Home':
          event.preventDefault();
          setActiveCard(0, true, true);
          break;

        case 'End':
          event.preventDefault();
          setActiveCard($cards.length - 1, true, true);
          break;

        case 'Enter':
        case ' ':
          if (activeIndex >= 0 && activeIndex < $cards.length && $(activeEl).is('.card, .custom-card')) {
            const $cur = $cards.eq(activeIndex);
            const $btn = $cur.find('a.btn, a[href], button').first();
            const title = getCardTitle($cur);

            if ($btn.length) {
              event.preventDefault();
              showToast('Selected: ' + title, 'success');
              playSound('success');
              setTimeout(function () {
                $btn[0].click();
              }, 200);
            } else {
              event.preventDefault();
              showToast('Card: ' + title, 'info');
              playSound('success');
            }
          }
          break;

        case 'Escape':
          if (activeIndex >= 0) {
            $cards.removeClass('is-card-focused').attr('aria-selected', 'false');
            if (activeEl && $(activeEl).is('.card, .custom-card')) {
              activeEl.blur();
            }
            activeIndex = -1;
          }
          break;

        default:
          break;
      }
    });

    window.cardNavigation = {
      getCards: function () { return queryCards(); },
      getCurrentIndex: function () { return activeIndex; },
      getActiveCard: function () { return activeIndex >= 0 ? queryCards().eq(activeIndex) : null; },
      next: function () {
        const total = queryCards().length;
        if (total) setActiveCard((activeIndex + 1) % total, true, true);
      },
      prev: function () {
        const total = queryCards().length;
        if (total) setActiveCard((activeIndex - 1 + total) % total, true, true);
      },
      focusCard: function (idx) { setActiveCard(idx, true, true); },
      select: function (idx) { setActiveCard(idx, true, true); },
      clear: function () {
        queryCards().removeClass('is-card-focused').attr('aria-selected', 'false');
        activeIndex = -1;
      }
    };
  }

  /* ======================================================================
     jQuery Ready & Application Boot
     ====================================================================== */
  if (typeof window.jQuery !== 'undefined') {
    if (!window.jQuery.trim) {
      window.jQuery.trim = function (str) {
        return str == null ? '' : String(str).trim();
      };
    }
    $(document).ready(function () {
      console.log('jQuery is ready!');
      initMenuSearch();
      initFaqSearch();
      initScrollProgress();
      initCounters();
      initClipboardCopy();
      initLazyLoading();
      initTableNavigation();
      initBootstrapCardNav();
    });
  }

  function init() {
    initDateTime();
    initBackgroundSwitcher();
    initThemeToggle();
    initKeyboardNav();
    initRating();
    initAccordion();
    initTimePresets();
    initAuthAndProfile();
    initContactForm();
    initPopup();
    initGamesApi();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
