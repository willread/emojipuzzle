# emojipuzzle

A free, account-free emoji math puzzle game — a Solvemoji-style experience with unlimited puzzles.

## Concept

A small system of equations uses emojis as unknowns. The player figures out the value of each emoji, then solves a final equation. Players can generate as many puzzles as they want — no daily gate. Example:

```
🍎 + 🍎 + 🍎 = 30
🍎 + 🍌 × 🍌 = 18
🍌 − 🥥 = 2
🥥 + 🍌 + 🍎 × 🍌 = ?
```

## Principles

- **No accounts.** Any per-user state lives in `localStorage` only.
- **Free for everyone.** No ads, no paywalls, no premium tier.
- **Unlimited puzzles.** Generate a new one any time — no daily limit.
- **Static site.** Deployable to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages).

## Stack

- Vite + React + TypeScript (SPA)
- Cloudflare Worker with Static Assets binding (serves the built SPA)
- Plain CSS (no UI framework yet)

## Dev

```sh
npm install
npm run dev          # Vite dev server (fast iteration on the SPA)
npm run preview      # Build, then run the worker locally via wrangler
npm run deploy       # Build, then deploy the worker to Cloudflare
```

## Status

Working MVP — random puzzle generator, input UI, check/reveal, new puzzle button.

## TODO

- [ ] Difficulty levels (easy/medium/hard)
- [ ] Better puzzle variety (multiplication-only, division, larger numbers)
- [ ] Share card (copy result to clipboard)
- [ ] Local stats (puzzles solved, average time) in localStorage
- [ ] Hint system
