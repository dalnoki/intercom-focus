// Intercom Focus — Content Script
// Selectors verified from actual Intercom DOM (May 2026)

const STYLE_ID = 'intercom-focus-injected-styles';

const EXPAND_CONVERSATION = `
[data-intercom-target="conversation-space"] {
  flex-grow: 1 !important;
  flex-shrink: 1 !important;
  flex-basis: 0% !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}
.full-conversation-panel {
  left: 0 !important;
}
.inbox2__conversation-page {
  width: 100% !important;
}`;

const GROUPS = {
  primaryNav: {
    label: 'Primary Nav (left icon rail)',
    selectors: [
      '[data-primary-nav-container]',
      '.nav__container'
    ],
    extraCSS: EXPAND_CONVERSATION
  },
  inboxLeftNav: {
    label: 'Inbox folder/inbox list sidebar',
    selectors: [
      '[data-intercom-target="inbox-left-nav"]',
      '[data-target="inbox-nav"]'
    ],
    extraCSS: EXPAND_CONVERSATION
  },
  rightSidebar: {
    label: 'Right sidebar (Details / Copilot)',
    selectors: [
      '.inbox2__conversation-details-sidebar',
      '[data-resize-target][data-resize-min-width="300"]'
    ],
    extraCSS: EXPAND_CONVERSATION + `
/* Hide the toggle button that re-opens the sidebar */
[data-rhsb-toggle-button] {
  display: none !important;
}`
  }
};

// ─── CSS Builder ──────────────────────────────────────────────────────────────
function buildCSS(settings) {
  const rules = [];
  for (const [key, group] of Object.entries(GROUPS)) {
    if (settings[key] === true) {
      rules.push(group.selectors.join(',\n') + ' {\n  display: none !important;\n}');
      if (group.extraCSS) {
        rules.push(group.extraCSS);
      }
    }
  }
  return rules.join('\n\n');
}

function applyStyles(settings) {
  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(el);
  }
  el.textContent = buildCSS(settings);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  chrome.storage.sync.get('settings', ({ settings }) => {
    applyStyles(settings || {});
  });
}

chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings) {
    applyStyles(changes.settings.newValue || {});
  }
});

let debounceTimer = null;
const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (!document.getElementById(STYLE_ID)) {
      chrome.storage.sync.get('settings', ({ settings }) => {
        applyStyles(settings || {});
      });
    }
  }, 300);
});

function startObserver() {
  observer.observe(document.body, { childList: true, subtree: false });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { init(); startObserver(); });
} else {
  init();
  startObserver();
}
