# External Integrations

**Analysis Date:** 2026-04-14

## APIs & External Services

**None detected.** The game has no calls to external APIs, remote endpoints, analytics services, or cloud backends. All game logic runs client-side in the browser.

## Bundled Libraries

**Phaser 3.90.0:**
- Source: npm package `phaser`
- Import: `import Phaser from 'phaser'` in `src/main.js` and all scene/entity files
- Provides: rendering (WebGL/Canvas), scene management, input handling, asset loader, particle system, Matter.js physics integration
- Bundled into: `dist/assets/index-*.js` at build time (no CDN link)

**Matter.js:**
- Source: embedded inside the Phaser 3 npm package — not a separate dependency
- Accessed via: Phaser's `this.matter.*` API within scenes and entities
- Not imported directly by game code; Phaser exposes it through `physics: { default: 'matter' }` config in `src/main.js`

## Data Storage

**Databases:** None
**File Storage:** None
**Caching:** None
**Local Storage:** Not detected in current source

## Authentication & Identity

**Auth Provider:** None — no login, accounts, or sessions

## Asset Pipeline

**Source assets:**
- Character head images: `heads/` directory (5 PNG files, Gemini-generated art)
  - `heads/Gemini_Generated_Image_*.png` — raw source files
- Deployed images: `assets/images/head_*.png` (referenced by `src/scenes/BootScene.js`)
  - Keys: `head_blaze`, `head_frost`, `head_bolt`, `head_shadow`, `head_tiny`

**Asset loading:**
- All images loaded in `src/scenes/BootScene.js` via `this.load.image(key, path)`
- Paths use `./assets/images/` prefix, served from Vite's `publicDir: '../assets'`
- One procedurally generated texture at runtime: `'__DEFAULT'` (4x4 white pixel, created in `BootScene.create()` for particle emitters)

**Build output:**
- `dist/index.html` — entry point
- `dist/assets/index-*.js` — single bundled JS file (all game code + Phaser)
- `dist/assets/images/` — copied from `assets/images/` by Vite's publicDir handling

**No audio assets detected** — no audio loading found in `BootScene.js` or other scenes

## Monitoring & Observability

**Error Tracking:** None
**Analytics:** None
**Logging:** None (no logging framework; browser console only)

## CI/CD & Deployment

**Hosting:** Not configured (static output in `dist/` is deployment-ready for any static host)
**CI Pipeline:** None detected — no `.github/workflows/`, no CI config files
**npm scripts:**
- `npm run dev` — Vite dev server at `localhost:5173`
- `npm run build` — production bundle to `dist/`
- `npm run preview` — preview production build locally

## Webhooks & Callbacks

**Incoming:** None
**Outgoing:** None

## Environment Configuration

**Required env vars:** None — no `.env` files present, no `import.meta.env` references detected
**Secrets:** None — fully client-side, no credentials required

## Third-Party Art Generation

**Gemini Image Generator** (Google):
- Used to generate character head art stored in `heads/`
- Files named `Gemini_Generated_Image_*.png`
- Not an active runtime integration — images are static files checked into the repo

---

*Integration audit: 2026-04-14*
