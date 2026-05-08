# Intercom Focus — Chrome Extension

Hide parts of the Intercom interface you don't need.

## Install

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `intercom-hider` folder
5. Pin the extension from the toolbar

## Usage

Click the extension icon while on any Intercom tab. Toggles apply instantly — no page reload needed.

## What you can hide

**Navigation**
- Primary nav rail (the leftmost icon sidebar)
- Inbox folder list (Your inbox, Mentions, Teams, Views…)
- Conversation list panel (the middle column)

**Individual nav items**
- Reports
- Outbound
- Knowledge
- Fin AI Agent
- Contacts

## Selector stability

All selectors use `data-intercom-target` and semantic class names from the verified live DOM (May 2026). These are more stable than obfuscated Tailwind classes. If Intercom updates and something breaks, open an issue or add custom CSS via the browser DevTools to find the new selector.

## Files

```
intercom-hider/
├── manifest.json   Chrome extension config
├── content.js      Injects CSS into Intercom tabs
├── popup.html      Toggle UI
├── popup.js        Reads/writes settings
└── README.md
```
