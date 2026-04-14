# Changelog

All notable changes to Head Soccer are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.1.1.0] - 2026-04-14

### Added
- **Rabat map** — urban medina rooftop arena with terracotta night sky, minaret
  silhouettes, crenellated rooftop wall, and 3 physics obstacles: a center brick
  divider and two angled flank ramps near each goal
- **Bouskoura Forest map** — dark forest clearing with four tree silhouettes,
  two narrow trunk pillars, and a bouncy fallen log at center (restitution 0.5)
  on a slippery leaf-covered floor
- **Map selector** in the menu — cycle through Stadium, Rabat, and Bouskoura
  with arrow buttons; map choice persists when toggling 2P/CPU mode
- **Decoration hook** in `MapLoader.drawBackground()` — each map can define a
  `decoration(scene, g)` function for thematic silhouettes; hook is generic so
  adding map #4+ requires no MapLoader changes
- **Vitest test suite** — 19 tests covering map config correctness, decoration
  behavior, obstacle properties, and stadium regression

### Fixed
- Map selection now persists when toggling between 2 Player and VS CPU mode
  (previously always reset to Stadium)
- Ramp obstacle visuals now render as rotated polygons matching their physics
  bodies (previously drawn as unrotated rectangles, causing invisible collision edges)
- Graphics state is reset before decoration callbacks to prevent style bleed
  from goal post drawing into map-specific art
- Bouskoura floor friction raised from 0.001 to 0.01 to prevent CPU AI
  oscillation on near-frictionless surfaces
