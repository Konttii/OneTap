/* ==========================================================================
   OneTap Computer Club — Assignment #4: Interactivity (Vanilla JS)
   One shared file for every page. Each init* function first checks that the
   DOM elements it needs exist, so nothing throws on pages without them.

   Task 1  Form validation .......... setupFormValidation(), getFieldError(),
                                      showError(), clearError()
   Task 2  Accordion (FAQ) .......... initAccordion(), setAccordionItem()
   Task 3  Popup (Subscribe) ........ initPopup()
   Task 4  Background colour ........ initBackgroundSwitcher(), applyBackground(),
                                      ensureReadable()
   Task 5  Current date & time ...... initDateTime()

   Assignment #5 — Advanced JavaScript & DOM Manipulation
   Day / Night theme ................ initThemeToggle()
   Keyboard menu navigation ......... initKeyboardNav()
   Rating stars ..................... initRating()
   Menu filter (switch, objects) .... menu, initMenuFilter()
   Async form + callback, Clear ..... sendBooking(), initContactForm()
   Sound effects .................... playSound()

   Assignment #6 — jQuery (DOM, Events, Search & UX)
   Task 0  jQuery ready check ....... $(document).ready()
   Task 1  Real-time search/filter .. initMenuSearch(), initFaqSearch()
   Task 2  Autocomplete suggestions . renderSuggestions()
   Task 3  Search highlighting ...... highlightMatches() (.html, regex, .wrap)
   Task 4  Scroll progress bar ...... initScrollProgress()
   Task 5  Animated number counter .. initCounters()
   Task 6  Loading spinner on submit  setSubmitLoading()
   Task 7  Toast notification system  showToast()
   Task 8  Copy to clipboard ........ initClipboardCopy() (.on('copy'))
   Task 9  Image lazy loading ....... initLazyLoading() (scroll, .offset, .attr)
   ========================================================================== */
(function () {
  'use strict';

  /* ======================================================================
     Task 5 — Display current date and time
     Output example: "October 9, 2026, 10:45:12 AM"
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

    updateDateTime();                    // show immediately, no 1s blank
    setInterval(updateDateTime, 1000);   // then tick every second
  }

  /* ======================================================================
     Task 4 — Change background colour with JavaScript
     The 🎨 button opens a small panel: the user picks ANY colour with the
     colour picker, or clicks a preset swatch / "Random" / "Reset".
     Page text is white, so very bright picks are darkened automatically
     (same hue) to keep the text readable.
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
  const BACKGROUND_STORAGE_KEY = 'onetap-background-color';
  const MAX_BACKGROUND_LUMINANCE = 0.07; // keeps muted grey text at >= 4.5:1 contrast

  function hexToRgb(hex) {
    const value = parseInt(hex.slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }

  function rgbToHex(rgb) {
    return '#' + rgb.map(function (channel) {
      return Math.round(channel).toString(16).padStart(2, '0');
    }).join('');
  }

  // WCAG relative luminance, 0 (black) .. 1 (white)
  function getLuminance(rgb) {
    const linear = rgb.map(function (channel) {
      const c = channel / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  }

  // Returns { color, adjusted }: the colour itself, or a darker shade of it.
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

  function applyBackground(color) {
    document.body.style.backgroundColor = color;               // the property required by the task
    document.documentElement.style.backgroundColor = color;    // keeps the canvas in sync
    document.documentElement.style.setProperty('--bg', color); // navbars that use var(--bg) follow too
  }

  function readSavedBackground() {
    try {
      const saved = localStorage.getItem(BACKGROUND_STORAGE_KEY);
      return /^#[0-9a-f]{6}$/i.test(saved) ? saved.toLowerCase() : null;
    } catch (error) {
      return null; // storage may be blocked (e.g. private mode)
    }
  }

  function saveBackground(color) {
    try {
      localStorage.setItem(BACKGROUND_STORAGE_KEY, color);
    } catch (error) {
      /* ignore: the colour simply will not persist */
    }
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
    if (saved) setColor(saved, false); // keep the chosen colour when moving between pages
    else setColor(DEFAULT_BACKGROUND, false);

    button.addEventListener('click', function () {
      if (panel.classList.contains('is-open')) closePanel();
      else openPanel();
    });

    // live preview while dragging inside the native colour picker
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

    // close when clicking elsewhere or pressing Escape
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
     Task 2 — Accordion (FAQ)
     Collapsed by default. Click toggles the answer; height/opacity/icon
     are animated by CSS transitions, the target max-height is set from JS.
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

      setAccordionItem(item, false); // default state: everything hidden

      button.addEventListener('click', function () {
        const willOpen = !item.classList.contains('is-open');
        setAccordionItem(item, willOpen);
      });
    });

    // Text re-wraps when the window is resized, so refresh the open panels.
    window.addEventListener('resize', function () {
      items.forEach(function (item) {
        if (item.classList.contains('is-open')) setAccordionItem(item, true);
      });
    });
  }

  /* ======================================================================
     Task 1 — Form validation
     ====================================================================== */
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PASSWORD_MIN_LENGTH = 8;
  const NAME_MIN_LENGTH = 2;

  // Returns an error message, or '' when the field is valid.
  function getFieldError(field, form) {
    const label = field.dataset.label || field.name || 'This field';
    const value = field.type === 'password' ? field.value : field.value.trim();

    if (field.required && value === '') {
      return label + ' is required.';
    }
    if (value === '') return ''; // optional and empty -> fine

    switch (field.dataset.validate) {
      case 'name':
        if (value.length < NAME_MIN_LENGTH) {
          return 'Name must be at least ' + NAME_MIN_LENGTH + ' characters long.';
        }
        break;
      case 'email':
        if (!EMAIL_PATTERN.test(value)) {
          return 'Please enter a valid email address, e.g. you@example.com.';
        }
        break;
      case 'password':
        if (value.length < PASSWORD_MIN_LENGTH) {
          return 'Password must be at least ' + PASSWORD_MIN_LENGTH + ' characters long (now ' + value.length + ').';
        }
        break;
      case 'confirm': {
        const original = form.querySelector('#' + field.dataset.match);
        if (!original || value !== original.value) {
          return 'Passwords do not match.';
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
    // Inside a Bootstrap .input-group the message goes under the whole group.
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
    success.className = 'form-success';
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

  /**
   * Attaches custom validation to a form.
   * options.successMessage  text shown after a valid submit
   * options.onSuccess       callback after a valid submit
   * options.onReset         callback after the form has been reset
   * options.sendData        optional async sender: sendData(form, callback(ok, message))
   * Returns { reset() } which clears values, errors and messages.
   */
  function setupFormValidation(form, options) {
    const settings = options || {};
    const fields = Array.prototype.filter.call(
      form.querySelectorAll('input, select, textarea'),
      function (field) { return field.required || field.dataset.validate; }
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
      // Validate when leaving a field, but do not nag about untouched empty ones.
      field.addEventListener('blur', function () {
        if (field.value !== '' || field.dataset.touched) {
          field.dataset.touched = 'true';
          validate(field);
        }
      });

      // Once a field was checked, re-check on every keystroke so the error
      // disappears the moment the user fixes it.
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
        firstInvalid.focus();
        return;
      }

      // Assignment 5: async submit — sendData() calls back when the request is finished
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

      // Assignment 6 (Task 6): show loading spinner & "Please wait…" on submit, then restore after a short delay
      const submitBtn = form.querySelector('[type="submit"]');
      setSubmitLoading(submitBtn, true);
      setTimeout(function () {
        setSubmitLoading(submitBtn, false);
        reset();
        showSuccessMessage(form, settings.successMessage || 'Thank you! Your form has been submitted.');
        playSound('success');
        showToast('Form submitted successfully!', 'success');
        if (typeof settings.onSuccess === 'function') settings.onSuccess(form);
      }, 1200);
    });

    return { reset: reset };
  }

  /* Visit time presets (moved here from the inline <script> in contact.html).
     Works with the buttons of the plain version and the radios of the Bootstrap one. */
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

  // Assignment 5: sends the booking with fetch (POST) and reports back through a callback
  const BOOKING_URL = 'https://jsonplaceholder.typicode.com/posts';

  function sendBooking(form, callback) {
    const submit = form.querySelector('[type="submit"]');
    const data = Object.fromEntries(new FormData(form));
    delete data.password;
    delete data['confirm-password'];

    // Assignment 6 (Task 6): Loading spinner + "Please wait…" and disabled button during submit
    setSubmitLoading(submit, true);
    const delayPromise = new Promise(function (resolve) { setTimeout(resolve, 1200); });

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
        callback(true, 'Thank you, ' + data.fullname + '! Booking #' + result.id + ' was sent. We will confirm it shortly.');
      })
      .catch(function () {
        callback(false, 'Could not send the request. Check your internet connection and try again.');
      })
      .finally(function () {
        setSubmitLoading(submit, false);
      });
  }

  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    setupFormValidation(form, {
      sendData: sendBooking,
      // form.reset() restores the default times; re-sync the preset button state too.
      onReset: function () {
        const daytime = form.querySelector('.time-choice[data-time="daytime"]');
        if (daytime) daytime.click();
      }
    });

    // Assignment 5: "Clear" button empties all text inputs with querySelectorAll + forEach
    const clearBtn = document.getElementById('clear-form');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        form.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea').forEach(function (field) {
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
     Task 3 — Popup (modal) subscribe form
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
      document.body.classList.add('popup-open'); // locks background scroll
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

    // 1) the "x" button
    closers.forEach(function (closer) {
      closer.addEventListener('click', closePopup);
    });

    // 2) a click on the dark overlay, outside the form box
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) closePopup();
    });

    // Bonus: Escape closes, Tab stays inside the dialog
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
     Assignment 5 — Sound effects (Web Audio API, no audio files needed)
     The previous sound is stopped before a new one starts, so they never overlap.
     ====================================================================== */
  let audioContext = null;
  let currentSound = null;

  function playSound(type) {
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
      default:        frequency = 520; // 'click'
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
    currentSound = oscillator;
  }

  /* ======================================================================
     Assignment 5 — Day / Night theme switch (dynamic style change)
     The ☀️/🌙 button is created by JS inside the floating .fab-group.
     ====================================================================== */
  const THEME_STORAGE_KEY = 'onetap-theme';

  function initThemeToggle() {
    const group = document.querySelector('.fab-group');
    if (!group) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'fab fab-daynight';
    group.prepend(button);

    function setTheme(theme) {
      const isDay = theme === 'day';
      document.body.classList.toggle('day-theme', isDay);
      button.textContent = isDay ? '🌙' : '☀️';
      button.setAttribute('aria-label', isDay ? 'Switch to night theme' : 'Switch to day theme');
      button.title = button.getAttribute('aria-label');
    }

    let saved = null;
    try { saved = localStorage.getItem(THEME_STORAGE_KEY); } catch (error) { /* ignore */ }
    setTheme(saved === 'day' ? 'day' : 'night');

    button.addEventListener('click', function () {
      const next = document.body.classList.contains('day-theme') ? 'night' : 'day';
      setTheme(next);
      playSound('click');
      showToast('Switched to ' + (next === 'day' ? 'Day' : 'Night') + ' theme.', 'info');
      try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch (error) { /* ignore */ }
    });
  }

  /* ======================================================================
     Assignment 5 — Keyboard navigation in the main menu (keydown + focus())
     ← / → (and ↑ / ↓) move between the menu links, Home / End jump to the edges.
     ====================================================================== */
  function initKeyboardNav() {
    const links = Array.from(document.querySelectorAll('.nav-menu a, .navbar-nav .nav-link'));
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
        links[next].focus();
      });
    });
  }

  /* ======================================================================
     Assignment 5 — Rating stars (querySelectorAll + attributes + animation)
     ====================================================================== */
  const RATING_STORAGE_KEY = 'onetap-rating';
  const RATING_MESSAGES = ['', 'Sorry to hear that 😕', 'We will do better!', 'Not bad, thanks!', 'Great, glad you liked it!', 'Awesome — see you soon! 🔥'];

  function initRating() {
    const stars = document.querySelectorAll('#rating-stars .star');
    const result = document.getElementById('rating-result');
    if (!stars.length || !result) return;

    function showRating(value) {
      // classic for loop: light up every star up to the chosen one
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
     Assignment 5 — Menu filter
     Objects & methods, arrays & loops (for / while), higher-order functions
     (map / filter / forEach) and a switch statement for the filter type.
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
      { id: 'batonchik', name: 'Batonchik', category: 'snacks', categoryLabel: 'Batonshik',    price: 600,  keywords: 'batonchik батончик snacks снеки bar шоколад chocolate сладкое 600' }
    ],

    filterBy: function (filter) {
      const limit = this.budgetLimit;
      switch (filter) {
        case 'drinks':
        case 'food':
        case 'snacks':
          return this.items.filter(function (item) { return item.category === filter; });
        case 'budget':
          return this.items.filter(function (item) { return item.price <= limit; });
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

    // how many of the cheapest items fit into a given budget (while loop)
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

  function initMenuFilter() {
    const buttons = document.querySelectorAll('#menu-filter .filter-btn');
    const list = document.getElementById('price-list');
    const summary = document.getElementById('menu-summary');
    if (!list) return;

    function render(filter) {
      const items = menu.filterBy(filter);
      list.innerHTML = items.map(function (item, idx) {
        return '<li class="price-item is-visible" tabindex="0" role="button" data-id="' + item.id + '" data-index="' + idx + '" title="Click or press Enter to select">' +
          '<span class="price-name">' + item.name + '</span>' +
          '<span class="price-val">' + item.price + ' &#8376;</span>' +
        '</li>';
      }).join('');

      if (summary) {
        summary.textContent = items.length + ' item(s), average price ' + menu.averagePrice(items) +
          ' ₸. With 2000 ₸ you can grab up to ' + menu.itemsForBudget(2000) + ' of the cheapest snacks.';
      }
    }

    if (buttons.length) {
      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          buttons.forEach(function (btn) { btn.classList.toggle('is-active', btn === button); });
          playSound('click');
          render(button.dataset.filter || 'all');
        });
      });
    }

    render('all');
  }

  /* ======================================================================
     Assignment 6 — Part 1: jQuery Search
     Task 1: Real-time Search and Live Filter (.on('keyup'), .filter())
     Task 2: Autocomplete Search Suggestions (dropdown list as user types)
     Task 3: Search Highlighting (.html(), regex, .wrap())
     ====================================================================== */
  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Task 3: Highlights matching words inside $elements using .html(), regex, and .wrap()
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

  // Task 2: Renders autocomplete dropdown suggestions and handles selection
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

  // Tasks 1, 2 & 3 on Menu page (menu.html)
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

    let currentCategory = 'all';

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

      if ($clear.length) {
        if (query) {
          $clear.removeAttr('hidden');
        } else {
          $clear.attr('hidden', true);
        }
      }

      // Filter the data items
      const matchingItems = menu.items.filter(function (item) {
        // Category condition
        let matchesCategory = true;
        if (currentCategory === 'drinks') matchesCategory = item.category === 'drinks';
        else if (currentCategory === 'food') matchesCategory = item.category === 'food';
        else if (currentCategory === 'snacks') matchesCategory = item.category === 'snacks';
        else if (currentCategory === 'budget') matchesCategory = item.price <= menu.budgetLimit;

        if (!matchesCategory) return false;
        if (!query) return true;

        // Query condition: matches name, price, category or keywords (Russian/English)
        const itemText = (item.name + ' ' + item.categoryLabel + ' ' + item.category + ' ' + item.price + ' ' + item.keywords).toLowerCase();
        return itemText.indexOf(lower) !== -1;
      });

      const matchingIds = matchingItems.map(function (it) { return it.id; });

      // Update card grid (html/menu.html)
      if ($cards.length) {
        $cards.each(function () {
          const id = $(this).attr('data-id') || $(this).find('.menu-name').text().split('—')[0].trim().toLowerCase();
          const isMatch = matchingIds.indexOf(id) !== -1;
          $(this).toggle(isMatch);
        });
        highlightMatches($cards.filter(':visible').find('.menu-name, .menu-category'), query);
      }

      // Update carousel (one-tap-bootstrap/html/menu.html)
      if ($carouselItems.length) {
        let firstMatchIndex = -1;
        $carouselItems.each(function (idx) {
          const id = $(this).attr('data-id') || $(this).find('h5').text().split('—')[0].trim().toLowerCase();
          const isMatch = matchingIds.indexOf(id) !== -1;
          $(this).toggleClass('d-none', !isMatch);
          if (isMatch && firstMatchIndex === -1) firstMatchIndex = idx;
        });
        highlightMatches($carouselItems.find('h5, span'), query);

        if (firstMatchIndex !== -1 && !$carouselItems.eq(firstMatchIndex).hasClass('active')) {
          $carouselItems.removeClass('active');
          $carouselItems.eq(firstMatchIndex).addClass('active');
        }
      }

      // Update price list (#price-list)
      if ($list.length) {
        $list.empty();
        if (matchingItems.length) {
          const listHtml = matchingItems.map(function (item, idx) {
            return '<li class="price-item" tabindex="0" role="button" data-id="' + item.id + '" data-index="' + idx + '" title="Click or press Enter to select">' +
              '<span class="price-name">' + item.name + '</span>' +
              '<span class="price-val">' + item.price + ' &#8376;</span>' +
            '</li>';
          }).join('');
          $list.html(listHtml);
          highlightMatches($list.find('.price-name, .price-val'), query);
          void $list[0].offsetWidth;
          $list.find('.price-item').addClass('is-visible');
        }

        // Update summary text
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

      // Update search status message
      if ($status.length) {
        const totalCount = matchingItems.length;
        if (!query) {
          if (currentCategory !== 'all') {
            $status.text('Filtered by ' + currentCategory + ': ' + totalCount + ' item(s).');
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
    }

    if ($input.length) {
      // Input typing & escape
      $input.off('keyup.menu input.menu').on('keyup.menu input.menu', function (event) {
        if (event.key === 'Escape') {
          if ($suggestions.length) $suggestions.empty().attr('hidden', true);
          return;
        }
        applyFilterAndSearch(true);
      });

      // Clear button
      if ($clear.length) {
        $clear.off('click.menu').on('click.menu', function () {
          $input.val('');
          if ($suggestions.length) $suggestions.empty().attr('hidden', true);
          applyFilterAndSearch(false);
          $input.trigger('focus');
        });
      }

      // Close suggestions on outside click
      $(document).off('click.menuSuggestions').on('click.menuSuggestions', function (event) {
        if (!$(event.target).closest('#menu-search-wrapper').length) {
          if ($suggestions.length) $suggestions.empty().attr('hidden', true);
        }
      });
    }

    // Category filter buttons
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

    // Price list keyboard navigation (ArrowUp, ArrowDown)
    if ($list.length) {
      $list.off('keydown.priceNav').on('keydown.priceNav', '.price-item', function (event) {
        const $items = $list.find('.price-item');
        const idx = $items.index(this);
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const next = Math.min($items.length - 1, idx + 1);
          $items.eq(next).focus().addClass('is-selected').siblings().removeClass('is-selected');
          playSound('click');
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          const prev = Math.max(0, idx - 1);
          $items.eq(prev).focus().addClass('is-selected').siblings().removeClass('is-selected');
          playSound('click');
        } else if (event.key === 'Enter') {
          event.preventDefault();
          const name = $(this).find('.price-name').text();
          const price = $(this).find('.price-val').text();
          showToast('Selected: ' + name + ' (' + price + ')', 'success');
          playSound('success');
        }
      });

      // Price list item click selection
      $list.off('click.priceSelect').on('click.priceSelect', '.price-item', function () {
        $(this).addClass('is-selected').siblings().removeClass('is-selected');
        const name = $(this).find('.price-name').text();
        const price = $(this).find('.price-val').text();
        showToast('Selected: ' + name + ' (' + price + ')', 'info');
        playSound('click');
      });
    }

    // Initial render
    applyFilterAndSearch(false);
  }

  // Tasks 1, 2 & 3 on Home page FAQ section (index.html)
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

      if (query) {
        $clear.removeAttr('hidden');
      } else {
        $clear.attr('hidden', true);
      }

      // Restore & highlight all FAQ questions and answers using .html(), regex, .wrap()
      const totalHighlights = highlightMatches(
        $items.find('.faq-question span:first-child, .faq-answer-inner p'),
        query
      );

      // Task 1: Filter FAQ items with .filter()
      $items.hide();
      const $matched = $items.filter(function () {
        return $(this).text().toLowerCase().indexOf(lower) !== -1;
      });
      $matched.show();

      // Open matching accordion items automatically when searching so highlighted words are visible
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
     Assignment 6 — Part 2: UX Engagement Elements with jQuery
     Task 4: Colorful and Stylized Scroll Progress Bar
     Task 5: Animated Number Counter
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
     Assignment 6 — Task 6: Loading spinner on Submit
     Task 7: Notification System (Temporary Toast)
     Task 8: Copied to Clipboard Button (.on('copy'))
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

    // Task 8 hint: use .on('copy') to update icon to checkmark, show tooltip & toast
    $(document).on('copy', '.copy-btn, .copy-snippet', function (event, manualValue) {
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

    $buttons.on('click', function () {
      const $btn = $(this);
      const value = $btn.attr('data-copy') || '';
      copyStringToClipboard(value).then(function () {
        $btn.trigger('copy', [value]);
      });
    });
  }

  /* ======================================================================
     Assignment 6 — Task 9: Image Lazy Loading
     Loads images only when they enter the viewport using scroll(), .offset(), .attr('src')
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

        // Task 9 hint: use .offset() and .attr('src')
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

    // Task 9 hint: use scroll() (with .on('scroll') fallback for jQuery 4)
    if (typeof $(window).scroll === 'function') {
      $(window).scroll(checkAndLoadImages);
    } else {
      $(window).on('scroll', checkAndLoadImages);
    }
    $(window).on('resize', checkAndLoadImages);
    checkAndLoadImages();
  }

  /* ======================================================================
     Interactive Table Navigation (Arrow Keys & On-Screen Buttons)
     Allows moving within #tariff-table by buttons (▲, ▼, ◄, ►) and arrow keys.
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

    const totalRows = $rows.length; // 5 rows
    const totalCols = 4;            // 4 zones: Main, VIP, Bootcamp, Tournament

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
      // $cells.eq(0) is package label; $cells.eq(1..4) are zone prices
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

    // Click on any zone cell selects it
    $tbody.on('click', 'td:not(.col-label)', function () {
      const $cell = $(this);
      const $row = $cell.closest('tr');
      const r = $rows.index($row);
      const c = $row.find('td:not(.col-label)').index($cell);
      selectCell(r, c, true);
    });

    // On-screen D-pad buttons: ▲, ▼, ◄, ►
    $dpadBtns.on('click', function (event) {
      event.preventDefault();
      const dir = $(this).attr('data-dir');
      if (dir === 'up') selectCell(curRow - 1, curCol, true);
      else if (dir === 'down') selectCell(curRow + 1, curCol, true);
      else if (dir === 'left') selectCell(curRow, curCol - 1, true);
      else if (dir === 'right') selectCell(curRow, curCol + 1, true);
    });

    // Keyboard navigation when focusing on table or its toolbar
    $(document).on('keydown.tariffTable', function (event) {
      // Only process when not inside input, textarea or select
      const activeTag = (document.activeElement && document.activeElement.tagName) ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      // Check if table is visible on current page
      if (!$table.is(':visible')) return;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          selectCell(curRow - 1, curCol, true);
          break;
        case 'ArrowDown':
          event.preventDefault();
          selectCell(curRow + 1, curCol, true);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          selectCell(curRow, curCol - 1, true);
          break;
        case 'ArrowRight':
          event.preventDefault();
          selectCell(curRow, curCol + 1, true);
          break;
        case 'Home':
          event.preventDefault();
          selectCell(curRow, 0, true);
          break;
        case 'End':
          event.preventDefault();
          selectCell(curRow, totalCols - 1, true);
          break;
        case 'Enter':
          if ($table.is(':hover') || $(document.activeElement).closest('#tariff-table, #table-nav-toolbar').length) {
            event.preventDefault();
            const text = $selectionText.text();
            showToast(text || 'Tariff selected!', 'success');
            playSound('success');
          }
          break;
        default:
          break;
      }
    });

    // Initial selection: Row 0 (1 Hour), Col 0 (Main)
    selectCell(0, 0, false);
  }

  /* ======================================================================
     Assignment 6 — Task 0: Setup ($(document).ready)
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
    });
  }

  /* ---------- Boot ---------- */
  function init() {
    initDateTime();
    initBackgroundSwitcher();
    initThemeToggle();
    initKeyboardNav();
    initRating();
    initMenuFilter();
    initAccordion();
    initTimePresets();
    initContactForm();
    initPopup();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
