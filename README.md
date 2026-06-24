# TOOB — the other one book club

A three-step book-voting web app with a vintage library theme:

1. **Submission** — each member submits up to N books (Google-Books-style search over a local catalog).
2. **Voting** — members drag books into a ranked order.
3. **Verdict** — results are tallied with a **Borda count** and the winner is revealed.

This is the Claude Design vintage UI ported into a standard **Vite + React 18** project.

## Run it

```bash
npm install
npm run dev      # starts Vite, opens http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Project layout

```
toob/
├── index.html                     # root div + Google Fonts (Hanken Grotesk, Permanent Marker, Space Mono)
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx                   # entry — imports everything in dependency order
    ├── lib/
    │   └── setup-globals.js       # exposes React / ReactDOM / lucide on window (see note below)
    ├── vendor/
    │   └── toob-design-system.js  # compiled design-system primitives (Button, Input, Wordmark, …) — DO NOT hand-edit
    ├── styles/
    │   └── toob.css               # design tokens + the vintage palette override
    ├── data.js                    # mock catalog, seed room, and computeResults() (Borda count)
    ├── App.jsx                    # the orchestrator: screen/stage state + the Tweaks panel
    └── components/
        ├── tweaks-panel.jsx       # the draggable "Tweaks" theming knobs
        ├── vintage-components.jsx # vintage logo, stage stepper, card, progress (TOOB_V*)
        ├── shell.jsx              # Backdrop, Header, Landing, Sign-in
        └── stages.jsx             # Submission, Voting, Results, Admin, book Details modal
```

## How the integration works (worth knowing before you edit)

The original Claude Design export was written for a plain HTML page: React,
ReactDOM and lucide were loaded as `<script>` globals, and each app file is an
IIFE that reads/writes `window.*` (e.g. `window.TOOB_Header`). To keep your
working UI **byte-for-byte intact** while making it a real Vite project:

- `src/lib/setup-globals.js` re-exposes `React`, `ReactDOM`, and `lucide` on
  `window`. It is imported **first** in `main.jsx` so those globals exist before
  any TOOB code runs.
- `src/main.jsx` then imports the rest **in dependency order** (data → tweaks →
  vintage → shell → stages → App). `App.jsx` mounts the app into `#root`, so it
  is imported last.
- `src/vendor/toob-design-system.js` is the compiled design system. Its embedded
  preview self-mount was disabled so it doesn't double-render — `App.jsx` owns
  the single mount. Treat this file as a dependency: edit your app in `src/`,
  not in here.

Because the files still talk through `window`, editing e.g. `components/shell.jsx`
works as expected — it re-registers `window.TOOB_Header`, and `App.jsx` reads the
new version on reload.

## Notes / next steps

- **Data is mock and in-memory.** `src/data.js` ships a seed room so Voting and
  Verdict have something to show. State lives in React (`App.jsx`); a refresh
  resets it. Wire a backend (or `localStorage`) in `App.jsx`'s state handlers
  (`create`, `join`, `addBook`, `saveVote`, `advance`) when you're ready.
- **Real book search.** `stages.jsx` searches `window.TOOB_DATA.BOOKS` locally.
  To use the Google Books API, replace that filter in the Submission component
  with a fetch to `https://www.googleapis.com/books/v1/volumes?q=...` and map the
  results into the `{ id, title, authors, year, pages, categories, desc, color }`
  shape `data.js` already uses.
- **Demo affordance:** clicking the numbered stage stepper in the header jumps
  between stages (handy for testing). Remove the `onClick` in `shell.jsx`'s
  `Header` when you add real host-driven stage transitions.
- **The Tweaks panel** (leather / accent / paper-grain knobs) is the floating box
  bottom-right. It's purely cosmetic; delete the `<TweaksPanel>` block in
  `App.jsx` if you don't want it shipped.
- The production JS bundle is ~150 kB gzipped (most of it the design-system
  bundle). Fine for now; code-split later if you care.
