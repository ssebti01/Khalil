---
phase: 8
slug: ability-system-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none (browser game — Phaser 3/Vite; no test runner configured) |
| **Config file** | none |
| **Quick run command** | `npm run build` (build check) |
| **Full suite command** | `npm run build && open dist/index.html` |
| **Estimated runtime** | ~5 seconds (build only) |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build` + manual smoke test in browser
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds (build time)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 8-01-01 | 01 | 1 | D-04/D-05 | build | `npm run build` | ✅ | ⬜ pending |
| 8-01-02 | 01 | 1 | D-04/D-05 | build | `npm run build` | ✅ | ⬜ pending |
| 8-02-01 | 02 | 1 | D-01/D-02 | build | `npm run build` | ✅ | ⬜ pending |
| 8-02-02 | 02 | 1 | D-02/D-03 | build | `npm run build` | ✅ | ⬜ pending |
| 8-02-03 | 02 | 2 | D-01/D-03 | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* No test files to scaffold — this project uses build verification and manual browser testing as its primary QA mechanism.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| HUD emoji+countdown renders below score bar | D-01/D-02 | Browser rendering | Launch game, pick any two characters, verify HUD appears top-center below score |
| Pulse/glow on ready state uses accentColor | D-03 | Visual inspection | Wait 8s after ability use — icon should pulse with character's accent color |
| fire ability fires correctly | D-04 | Runtime behavior | Select Khalil, press Q, verify fireball launches |
| ice ability freezes opponent | D-04 | Runtime behavior | Select Beboush, press Q, verify opponent freezes |
| thunder ability dashes | D-04 | Runtime behavior | Select Lilya, press Q, verify horizontal dash |
| ninja ability vanishes | D-04 | Runtime behavior | Select Fafa, press Q, verify invisibility/ghost |
| tiny ability shrinks ball | D-04 | Runtime behavior | Select Sara, press Q, verify ball shrinks without stale impulse bug |
| Countdown disappears when ability is ready | D-02 | Visual inspection | After full 8s cooldown, number should disappear (icon only) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
