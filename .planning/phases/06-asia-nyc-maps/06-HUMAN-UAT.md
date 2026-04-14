---
status: partial
phase: 06-asia-nyc-maps
source: [06-VERIFICATION.md]
started: 2026-04-14T22:57:00Z
updated: 2026-04-14T22:57:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Shanghai background visual fidelity
expected: Purple/magenta gradient sky, dark building silhouettes with antenna tips in crowd zone, grey concrete pitch with faint pitch lines, green bamboo scaffold platforms visible at x≈420 and x≈730, orange circle bumpers at x≈200 and x≈1080
result: [pending]

### 2. NYC background visual fidelity
expected: Deep blue twilight gradient, building silhouettes with lit windows, two yellow taxi shapes in crowd zone (x≈510 and x≈710), dark asphalt pitch with faint orange basketball court lines, street lamp at center, grey subway grate strip at x=560–720
result: [pending]

### 3. Shanghai physics — scaffold deflection and bumper bounce
expected: Angled scaffold causes directional deflection; circle bumper with restitution 0.7 produces sharp bounce
result: [pending]

### 4. NYC trampoline impulse behavior
expected: Ball receives upward impulse over subway grate (x 560–720); no double-boost if already moving upward
result: [pending]

### 5. CPU AI stability on both maps
expected: No JavaScript errors, no NaN positions, CPU navigates obstacles without getting stuck over 30+ seconds
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
