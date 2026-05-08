const KEYS = ['primaryNav', 'inboxLeftNav', 'conversationList', 'rightSidebar'];

chrome.storage.sync.get('settings', ({ settings }) => {
  const s = settings || {};
  KEYS.forEach(key => {
    const el = document.getElementById(key);
    if (el) el.checked = !!s[key];
  });
});

KEYS.forEach(key => {
  const el = document.getElementById(key);
  if (!el) return;
  el.addEventListener('change', () => {
    chrome.storage.sync.get('settings', ({ settings }) => {
      const s = settings || {};
      s[key] = el.checked;
      chrome.storage.sync.set({ settings: s });
    });
  });
});
