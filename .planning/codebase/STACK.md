# Technology Stack

**Analysis Date:** 2026-04-14

## Languages

**Primary:**
- JavaScript (ES Modules) — all game source code in `src/`

**Secondary:**
- HTML5 — entry point `src/index.html`
- CSS (inline in HTML) — minimal reset and canvas centering only

## Runtime

**Environment:**
- Browser (WebGL primary, Canvas 2D fallback via `Phaser.AUTO`)
- Target resolution: 1280x720 (`src/config/constants.js`)
- Scale mode: `Phaser.Scale.FIT` with `CENTER_BOTH` — responsive to viewport

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present (lockfileVersion 3)

## Frameworks

**Core:**
- Phaser 3.90.0 — game engine (rendering, scene management, input, physics integration, asset loading)
  - Installed via npm: `node_modules/phaser`
  - Imported as ES Module: `import Phaser from 'phaser'`

**Physics:**
- Matter.js — bundled inside Phaser 3, not a separate npm dependency
  - Configured in `src/main.js`: `physics: { default: 'matter', matter: { gravity: { y: 2 } } }`
  - Used directly in `src/entities/Ball.js` and `src/entities/Player.js`

**Build/Dev:**
- Vite 8.0.8 — dev server and bundler
  - Config: `vite.config.js`
  - Root: `src/`
  - Public assets dir: `../assets` (relative to root, maps to `/assets/` at runtime)
  - Build output: `dist/`
  - Dev server: `localhost:5173` with `open: true`
  - Bundler backend: Rolldown (`@rolldown/binding-*` 1.0.0-rc.15, native bindings per platform)
  - CSS processing: LightningCSS 1.32.0 (bundled with Vite 8)
  - PostCSS 8.5.9 (Vite dependency)

## Key Dependencies

**Runtime (production):**
- `phaser` 3.90.0 — entire game engine and physics; no other runtime npm deps

**Development only:**
- `vite` 8.0.8 — build tooling, dev server, HMR
- `@rolldown/binding-*` 1.0.0-rc.15 — native bundler binaries (platform-specific, auto-selected)
- `lightningcss` 1.32.0 — CSS transformation
- `postcss` 8.5.9 — CSS pipeline
- `nanoid` 3.3.11 — ID generation (Vite internal)
- `picocolors` 1.1.1 — terminal colors (Vite internal)
- `picomatch` / `tinyglobby` — glob matching (Vite internal)
- `eventemitter3` 5.0.4 — event system (Vite/Rolldown internal)
- `fsevents` 2.3.3 — macOS file watching (optional native dep)

## Configuration

**Build config:**
- `vite.config.js` — root, publicDir, outDir, dev server port

**Game constants:**
- `src/config/constants.js` — all gameplay tuning values (physics, player stats, ball, goal, match timing, abilities)
- `src/config/characters.js` — character roster and stat multipliers

**No TypeScript config** — plain JavaScript, no `tsconfig.json`
**No ESLint/Prettier config** — no linting or formatting tooling detected
**No test framework** — no jest/vitest config found

## Platform Requirements

**Development:**
- Node.js (version unspecified — no `.nvmrc` or `.node-version` file)
- npm
- `npm run dev` → Vite dev server at `localhost:5173`

**Production:**
- Static file hosting (output is a single `dist/index.html` + `dist/assets/index-*.js`)
- No server-side runtime required
- Browser must support WebGL (Canvas fallback available via Phaser.AUTO)

---

*Stack analysis: 2026-04-14*
