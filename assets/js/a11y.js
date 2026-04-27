/* DMO Architects — accessibility toolbar
   Implements IS 5568 / WCAG 2.0 AA assistive features:
   font size, contrast, invert, grayscale, readable font, link highlight,
   stop animations, big cursor, reset. Persists in localStorage.
*/
(() => {
  'use strict';

  const STORAGE_KEY = 'dmo-a11y';
  const FONT_STEP = 10;          // percent per step
  const FONT_MIN = 80;
  const FONT_MAX = 160;

  const FLAGS = [
    'a11y-high-contrast',
    'a11y-invert',
    'a11y-grayscale',
    'a11y-readable',
    'a11y-links',
    'a11y-no-motion',
    'a11y-big-cursor'
  ];

  /* ---- State ---- */
  const defaults = { font: 100 };
  FLAGS.forEach((f) => (defaults[f] = false));
  let state = { ...defaults };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    state = { ...defaults, ...saved };
  } catch (_) { /* ignore */ }

  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  };

  const apply = () => {
    const root = document.documentElement;
    root.style.fontSize = `${state.font}%`;
    FLAGS.forEach((f) => root.classList.toggle(f, !!state[f]));
    /* update font readout */
    const fs = document.getElementById('a11yFontSize');
    if (fs) fs.textContent = `${state.font}%`;
    /* mark active toggles */
    document.querySelectorAll('[data-a11y-toggle]').forEach((btn) => {
      const flag = btn.dataset.a11yToggle;
      btn.setAttribute('aria-pressed', state[flag] ? 'true' : 'false');
    });
  };

  /* ---- Build toolbar markup ---- */
  const toolbar = document.createElement('div');
  toolbar.className = 'a11y';
  toolbar.innerHTML = `
    <button class="a11y__trigger" id="a11yTrigger" type="button" aria-label="פתיחת תפריט נגישות" aria-expanded="false" aria-controls="a11yPanel">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="6.5" r="1.4" fill="currentColor"/>
        <path d="M5 9h14"/>
        <path d="M12 9v5"/>
        <path d="M12 14l-3 6M12 14l3 6"/>
      </svg>
      <span class="a11y__trigger-label">נגישות</span>
    </button>

    <div class="a11y__panel" id="a11yPanel" role="dialog" aria-modal="false" aria-labelledby="a11yTitle" hidden>
      <div class="a11y__head">
        <h2 id="a11yTitle">תפריט נגישות</h2>
        <button class="a11y__close" id="a11yClose" type="button" aria-label="סגירה">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="a11y__group" role="group" aria-label="גודל טקסט">
        <span class="a11y__label">גודל טקסט</span>
        <div class="a11y__row">
          <button class="a11y__btn" type="button" data-a11y-font="-" aria-label="הקטנת טקסט">−</button>
          <span class="a11y__readout" id="a11yFontSize">100%</span>
          <button class="a11y__btn" type="button" data-a11y-font="+" aria-label="הגדלת טקסט">+</button>
        </div>
      </div>

      <div class="a11y__grid" role="group" aria-label="התאמות תצוגה">
        <button class="a11y__opt" type="button" data-a11y-toggle="a11y-high-contrast" aria-pressed="false">
          <span class="a11y__opt-icon" aria-hidden="true">◐</span>
          <span>ניגודיות גבוהה</span>
        </button>
        <button class="a11y__opt" type="button" data-a11y-toggle="a11y-invert" aria-pressed="false">
          <span class="a11y__opt-icon" aria-hidden="true">◑</span>
          <span>היפוך צבעים</span>
        </button>
        <button class="a11y__opt" type="button" data-a11y-toggle="a11y-grayscale" aria-pressed="false">
          <span class="a11y__opt-icon" aria-hidden="true">◔</span>
          <span>גווני אפור</span>
        </button>
        <button class="a11y__opt" type="button" data-a11y-toggle="a11y-readable" aria-pressed="false">
          <span class="a11y__opt-icon" aria-hidden="true">Aa</span>
          <span>פונט קריא</span>
        </button>
        <button class="a11y__opt" type="button" data-a11y-toggle="a11y-links" aria-pressed="false">
          <span class="a11y__opt-icon" aria-hidden="true">⟶</span>
          <span>הדגשת קישורים</span>
        </button>
        <button class="a11y__opt" type="button" data-a11y-toggle="a11y-no-motion" aria-pressed="false">
          <span class="a11y__opt-icon" aria-hidden="true">❚❚</span>
          <span>עצירת אנימציות</span>
        </button>
        <button class="a11y__opt" type="button" data-a11y-toggle="a11y-big-cursor" aria-pressed="false">
          <span class="a11y__opt-icon" aria-hidden="true">↖</span>
          <span>סמן גדול</span>
        </button>
      </div>

      <div class="a11y__foot">
        <button class="a11y__reset" type="button" id="a11yReset">איפוס הגדרות</button>
        <a class="a11y__statement" href="accessibility.html">הצהרת הנגישות</a>
      </div>
    </div>
  `;
  document.body.appendChild(toolbar);

  /* ---- Wire interactions ---- */
  const trigger = document.getElementById('a11yTrigger');
  const panel = document.getElementById('a11yPanel');
  const closeBtn = document.getElementById('a11yClose');

  const setOpen = (open) => {
    panel.hidden = !open;
    panel.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', String(open));
    if (open) {
      const first = panel.querySelector('button, a');
      first?.focus();
    } else {
      trigger.focus();
    }
  };

  trigger.addEventListener('click', () => setOpen(panel.hidden));
  closeBtn.addEventListener('click', () => setOpen(false));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) setOpen(false);
  });

  document.addEventListener('click', (e) => {
    if (panel.hidden) return;
    if (!panel.contains(e.target) && !trigger.contains(e.target)) setOpen(false);
  });

  /* font controls */
  panel.querySelectorAll('[data-a11y-font]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.a11yFont;
      const next = dir === '+' ? state.font + FONT_STEP : state.font - FONT_STEP;
      state.font = Math.min(FONT_MAX, Math.max(FONT_MIN, next));
      apply(); save();
    });
  });

  /* boolean toggles */
  panel.querySelectorAll('[data-a11y-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const flag = btn.dataset.a11yToggle;
      state[flag] = !state[flag];
      apply(); save();
    });
  });

  /* reset */
  document.getElementById('a11yReset').addEventListener('click', () => {
    state = { ...defaults };
    apply(); save();
  });

  /* keyboard shortcut: Alt+Shift+A opens menu */
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.code === 'KeyA')) {
      e.preventDefault();
      setOpen(panel.hidden);
    }
  });

  /* ---- Initial apply ---- */
  apply();
})();
