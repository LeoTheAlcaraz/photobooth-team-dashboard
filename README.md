# Photobooth-io Development Feed

Static internal productivity workspace for daily updates, bug reports, archive lookup, and settings. It runs by opening `index.html` directly and is safe to deploy to Netlify, Vercel, or GitHub Pages without a build step.

## What’s inside

- `index.html` for the login screen.
- `dashboard.html`, `reports.html`, `bugs.html`, `archive.html`, and `settings.html` for the main workspace.
- Shared CSS under `assets/css` with a single design system and page-specific overrides.
- Shared vanilla JS under `assets/js` for storage, UI helpers, markdown preview, search, auth, and page renderers.

## Storage model

Everything is local-first right now.

- Session data is stored in `localStorage`.
- Reports, bugs, activity, drafts, notifications, and UI preferences are stored in one browser state blob.
- Attachments are preview-only data URLs stored locally for the current browser profile.

## Run locally

Just open `index.html` in a browser.

If you want a local web server for cleaner route handling, use any static server you already have available, but the app does not depend on one.

## Deployment

- Push the folder to GitHub and deploy as a static site.
- Or drop it into Netlify / Vercel as-is.
- No environment variables, no backend, no install step.

## Architecture notes

- Shared shell and behavior live in `assets/js/app.js` and `assets/js/ui.js`.
- Page modules render into `#page-root`.
- The app uses event delegation for actions that appear after render, which keeps the code simple and avoids duplicate listeners.
- The design tokens live in `assets/css/global.css`, with page-specific CSS only for layout differences.

## Scalability notes

This is intentionally structured so a future backend can replace `localStorage` without changing the UI contract much.

- Swap `storage.js` for API calls.
- Keep the page renderers and modal system.
- Preserve the record shapes for reports, bugs, and activity.

## Future backend ideas

- Persist reports and bugs to a real database.
- Replace the fake auth session with SSO or company identity.
- Upload attachments to object storage instead of browser data URLs.
- Add server-side search and audit trails once the team needs shared persistence.
