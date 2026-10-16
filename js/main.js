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

  function showSuccessMessage(form, text) {
    removeSuccessMessage(form);
    const success = document.createElement('div');
    success.className = 'form-success';
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

      reset();
      showSuccessMessage(form, settings.successMessage || 'Thank you! Your form has been submitted.');
      if (typeof settings.onSuccess === 'function') settings.onSuccess(form);
    });

    return { reset: reset };
  }

  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    setupFormValidation(form, {
      successMessage: 'Thank you! Your booking request has been sent. We will confirm it shortly.',
      // form.reset() restores the default times; re-sync the preset button state too.
      onReset: function () {
        const daytime = form.querySelector('.time-choice[data-time="daytime"]');
        if (daytime) daytime.click();
      }
    });
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

  /* ---------- Boot ---------- */
  function init() {
    initDateTime();
    initBackgroundSwitcher();
    initAccordion();
    initContactForm();
    initPopup();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
