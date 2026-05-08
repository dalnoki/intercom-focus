// Intercom Focus — Content Script
// Selectors verified from actual Intercom DOM (May 2026)

const STYLE_ID = 'intercom-focus-injected-styles';

// Expand conversation-space within its flex container.
// Does NOT use :has() — that rule hid all siblings (too aggressive).
const EXPAND_SPACE_CSS = `
[data-intercom-target="conversation-space"] {
  flex-grow: 1 !important;
  flex-shrink: 1 !important;
  flex-basis: 100% !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}`;

const GROUPS = {
  primaryNav: {
    label: 'Primary Nav (left icon rail)',
    selectors: [
      '[data-primary-nav-container]',
      '.nav__container'
    ]
    // No extraCSS — just hide the rail, don't expand the panel
  },
  inboxLeftNav: {
    label: 'Inbox folder/inbox list sidebar',
    selectors: [
      '[data-intercom-target="inbox-left-nav"]',
      '[data-target="inbox-nav"]'
    ],
    extraCSS: EXPAND_SPACE_CSS
  },
  rightSidebar: {
    label: 'Right sidebar (Details / Copilot)',
    selectors: [
      '.inbox2__conversation-details-sidebar',
      '[data-resize-target][data-resize-min-width="300"]'
    ],
    extraCSS: EXPAND_SPACE_CSS + `
[data-rhsb-toggle-button] {
  display: none !important;
}`
  }
};

// ─── Inline-style override ────────────────────────────────────────────────────
// Intercom's resize JS continuously rewrites flex-basis as an inline style.
// CSS !important can't beat a JS assignment, so we watch the attribute and
// forcibly re-apply our values via setProperty('…', '…', 'important').

let currentSettings = {};
let inlineStyleObserver = null;

function forceConversationSize() {
  // Only fight Intercom's resize JS when an inner-panel toggle is on
  const expandSpace = currentSettings.inboxLeftNav || currentSettings.rightSidebar;

  const cs = document.querySelector('[data-intercom-target="conversation-space"]');
  if (!cs) return;

  if (expandSpace) {
    cs.style.setProperty('flex-basis', '100%', 'important');
    cs.style.setProperty('flex-grow', '1', 'important');
    cs.style.setProperty('flex-shrink', '1', 'important');
    cs.style.setProperty('min-width', '0', 'important');
    cs.style.setProperty('width', '100%', 'important');
    cs.style.setProperty('max-width', '100%', 'important');
  } else {
    cs.style.removeProperty('flex-basis');
    cs.style.removeProperty('flex-grow');
    cs.style.removeProperty('flex-shrink');
    cs.style.removeProperty('min-width');
    cs.style.removeProperty('width');
    cs.style.removeProperty('max-width');
  }
}

function attachInlineStyleObserver() {
  if (inlineStyleObserver) inlineStyleObserver.disconnect();

  const expandSpace = currentSettings.inboxLeftNav || currentSettings.rightSidebar;
  if (!expandSpace) return; // no need to fight Intercom when nothing is hidden

  inlineStyleObserver = new MutationObserver(() => {
    forceConversationSize();
  });
  const cs = document.querySelector('[data-intercom-target="conversation-space"]');
  if (cs) inlineStyleObserver.observe(cs, { attributes: true, attributeFilter: ['style'] });
}

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

// ─── Shadow DOM injection ─────────────────────────────────────────────────────
// The conversation stream content lives inside #teammate-app-react's shadow
// root with class "mx-auto max-w-[1000px]". Regular CSS can't reach it, so
// we inject a <style> directly into the shadow root.

const SHADOW_STYLE_ID = 'intercom-focus-shadow-styles';

function injectShadowStyles(enable) {
  const host = document.getElementById('teammate-app-react');
  if (!host || !host.shadowRoot) return;
  const root = host.shadowRoot;
  let el = root.getElementById(SHADOW_STYLE_ID);
  if (enable) {
    if (!el) {
      el = document.createElement('style');
      el.id = SHADOW_STYLE_ID;
      root.appendChild(el);
    }
    el.textContent = `
      .mx-auto { margin-left: 0 !important; margin-right: 0 !important; }
      [class*="max-w-[1000px]"] { max-width: 100% !important; }
    `;
  } else {
    if (el) el.remove();
  }
}

function applyStyles(settings) {
  currentSettings = settings || {};

  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(el);
  }
  el.textContent = buildCSS(currentSettings);

  const expandSpace = currentSettings.inboxLeftNav || currentSettings.rightSidebar;
  forceConversationSize();
  attachInlineStyleObserver();
  injectShadowStyles(!!expandSpace);
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
    } else {
      attachInlineStyleObserver();
    }
  }, 300);
});

function startObserver() {
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { init(); startObserver(); });
} else {
  init();
  startObserver();
}
