# TOOB — the other one book club

Three-step book picking for your club, with a vintage leather-and-parchment
library theme:

1. **Recommend** — everyone searches **Google Books** and submits up to N titles.
2. **Vote** — members drag the ballot into a ranked order.
3. **Verdict** — a **Borda count** tallies every ballot and stamps the winner.

This is your working app (real search, rooms, sign-in, deadlines, host
controls) re-skinned to the vintage TOOB look — the ring-O wordmark, embossed
stage medallions, parchment cards, and the `SELECTED` rubber stamp.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

## What's in the box

```
toob/
├── index.html            # root div + Google Fonts (Permanent Marker, Hanken Grotesk, Space Mono)
├── .env                  # VITE_GOOGLE_BOOKS_API_KEY (optional)
├── tailwind.config.js / postcss.config.js
├── vite.config.js
└── src/
    ├── main.jsx          # React entry
    ├── index.css         # Tailwind + base theme + stamp animation
    └── App.jsx           # the whole app: theme, helpers, screens, and state
```

It's intentionally one file (`App.jsx`), matching how your working version was
structured — the vintage palette/fonts live at the top in the `C`, `MARKER`,
`SANS`, `MONO` constants, so re-theming is all in one place.

## What changed from the version that "lost functionality"

The Claude Design re-skin replaced your real logic with a mock demo. This brings
the real logic back and dresses it in vintage:

- **Google Books search** is restored. (Your file had a duplicate `const url`
  declaration in `searchBooks` — a hard syntax error — which is fixed here.) The
  API key now comes from `.env` as `VITE_GOOGLE_BOOKS_API_KEY`; search also works
  without a key at a lower quota. **Restrict the key by HTTP referrer in the
  Google Cloud console**, since any client-side key ships in the built JS.
- **Storage** now uses `localStorage` instead of the artifact `window.storage`.
  Rooms persist across refreshes and **sync across tabs of the same browser**
  (4-second polling), so you can test multi-user by opening a second tab.
- Everything else — username/password sign-in with SHA-256 hashing, session
  restore, submission/voting deadlines with auto-advance, host controls
  (close submissions, close voting, reopen, reset round), and the Borda count —
  is carried over unchanged.

## Going multi-device (real backend)

`localStorage` only lives in one browser, so friends on other devices can't see
each other's rooms yet. The storage layer is isolated to make this a one-spot
swap: replace the `localStore` object near the top of `App.jsx` (the
`get/set/delete/list` methods) with calls to a real backend — Firebase
Firestore, Supabase, or your own API. Everything downstream already speaks that
async `get/set/delete/list` interface, and the 4s `refresh` polling becomes your
sync loop (or swap it for real-time subscriptions). Once that's in, flip
`LOCAL_ONLY` to `false` to hide the "Local mode" banner.

## Notes

- Built with Vite + React 18 + Tailwind + `lucide-react`. ~59 kB gzipped.
- `crypto.subtle` (used for password hashing) needs a secure context —
  `localhost` and any `https://` host qualify; plain `http://` on a LAN IP won't.
