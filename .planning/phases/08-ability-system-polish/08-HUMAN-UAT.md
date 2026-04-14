---
status: partial
phase: 08-ability-system-polish
source: [08-VERIFICATION.md]
started: 2026-04-15T00:07:00Z
updated: 2026-04-15T00:07:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Khalil fire ability + HUD countdown
expected: Orange fire particles appear, ball receives impulse toward opponent's goal. P1 icon stops pulsing, countdown ticks 8→1, then pulse resumes.
result: [pending]

### 2. Beboush ice ability + opponent freeze
expected: Beboush emits ice particles, P1 (opponent) gains blue tint and is immobile for ~2 seconds. P2 icon stops pulsing and shows countdown.
result: [pending]

### 3. Lilya thunder dash + Fafa ninja teleport
expected: Lilya dashes horizontally toward ball. Fafa teleports to ball position (clamped, offset -60px). Respective emoji icons show cooldown countdown.
result: [pending]

### 4. Sara tiny near-center guard (350ms window)
expected: No ball lurch at center after goal reset. The tiny near-center guard prevents the delayed impulse from firing when ball resets within 350ms window.
result: [pending]

### 5. HUD visual layout — emoji icons below score bar
expected: P1 icon (e.g., 🔥) at ~x=500, P2 icon (e.g., ❄️) at ~x=780, both at y=97 below score bar. Each has a translucent accentColor glow circle. Both pulse on match start.
result: [pending]

### 6. Old bottom-corner ability bars removed
expected: No horizontal bars visible at bottom-left or bottom-right corners of the game canvas.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
