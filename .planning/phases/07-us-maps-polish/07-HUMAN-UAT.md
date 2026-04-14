---
status: partial
phase: 07-us-maps-polish
source: [07-VERIFICATION.md]
started: 2026-04-14T23:09:00Z
updated: 2026-04-14T23:09:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Chicago wind feel
expected: Ball visibly drifts horizontally every ~4 seconds during a Chicago match, drift lasts ~0.5s, then stops. Cycle repeats.
result: [pending]

### 2. Houston bounce feel
expected: Ball dropped from height onto Houston floor bounces noticeably higher than on default Stadium floor (floorRestitution 0.45 vs 0.2)
result: [pending]

### 3. PauseScene restart preserves map
expected: Starting a match on Houston, pressing ESC, then Restart Match — game restarts on Houston (not the default Stadium map)
result: [pending]

### 4. Map selector cycles all 7
expected: Clicking through map selector in MenuScene cycles through all 7 maps (Stadium, Rabat, Bouskoura, Shanghai, Chicago, Houston, NYC) without crash or blank entries
result: [pending]

### 5. Full regression across all 7 maps
expected: Each map can be played to ResultScene in 1P vs CPU mode with zero JS console errors. Goal scoring, pause/resume, and match end all work correctly on every map.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
