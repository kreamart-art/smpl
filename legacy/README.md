# legacy/: the current layout, while the new one is in preview

This is the frontend everyone sees on usesmpl.com until the new layout (`src/`)
is ready for everyone. It is main at `2b4b32e`, with three changes:

- `src/lib/layout.js` + one line in `src/context/AppContext.jsx`: follows the
  server's answer on which layout this session should run;
- `src/pages/Notifications.jsx` and `src/components/NativeBoot.jsx`: effects
  keyed on the user id instead of the user object (they looped);
- `index.html`: a `smpl-layout` meta tag.

`npm run build` builds it into `dist-legacy/` (see `vite.legacy.config.js`), next
to the new layout in `dist/`. The server serves the new layout only to accounts
with `users.newLayout = 1` (see `server/layout.js`).

Run it locally with `npm run dev:legacy` (port 5192, API from `npm run server`).

When the new layout is everyone's: delete this folder, `vite.legacy.config.js`,
`server/layout.js` and the `build` step for it, and serve `dist/` directly.
