# Phase 8: Ability System Polish - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit and fix the power-up logic for all five abilities (fire/ice/thunder/ninja/tiny), and redesign the in-game ability HUD with improved icons, cooldown display, and activation visual feedback.

Two distinct deliverables:
1. **Logic fixes** — Ensure each ability fires correctly, hits the right target, and behaves as designed
2. **HUD redesign** — Replace the plain horizontal bars at the bottom corners with a more expressive ability display

</domain>

<decisions>
## Implementation Decisions

### Ability HUD layout
- **D-01:** Replace the current bottom-corner plain bars with a new HUD element positioned **below the score bar** (top center area), split left/right for each player
- **D-02:** Display format: **large emoji icon** (from `char.emoji`) + **countdown number** (seconds remaining). When ability is ready, number disappears
- **D-03:** When cooldown is ready, the icon **pulses/glows** using the character's `accentColor` to indicate availability

### Ability logic audit scope
- **D-04:** All five abilities must be audited for correctness: `fire`, `ice`, `thunder`, `ninja`, `tiny`
- **D-05:** Ability IDs are matched by `char.id` in `Player._useAbility()` — the character roster maps: `khalil→fire`, `beboush→ice`, `lilya→thunder`, `fafa→ninja`, `sara→tiny`

### Claude's Discretion
- Exact size, spacing, and positioning of the HUD element relative to the score bar
- Whether the countdown number shows seconds or a progress value
- How "ready" pulse is implemented (tween alpha/scale oscillation vs color flash)
- Frozen player visual state (ice tint, particles, etc.) — not discussed, implement reasonably
- Activation feedback on ability fire — not discussed, implement reasonably (can extend existing `_emitParticles`)
- Whether per-character cooldown durations vary — not discussed, keep uniform at 8s unless a bug warrants change

</decisions>

<specifics>
## Specific Ideas

- "Big icon + number" was specifically chosen — the emoji should be prominent, readable at a glance during gameplay
- Position "below score bar (top center)" keeps it near score + timer, not cluttering the play field corners
- Pulse/glow on ready state — use character `accentColor` so each player's indicator feels distinct

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs or ADRs — requirements are fully captured in decisions above and the source files below.

### Ability system source files
- `src/entities/Player.js` — `_useAbility()` (all 5 ability branches), `freeze()`, `getAbilityCooldownRatio()`, `abilityCooldown` state
- `src/scenes/UIScene.js` — Current HUD implementation: `_buildAbilityBar()`, `_drawAbilBar()`, `update()` cooldown polling
- `src/scenes/GameScene.js` — `player-ability` event handler (freeze target logic)
- `src/config/constants.js` — `ABILITIES`, `ABILITY_COOLDOWN` (8000ms), `PLAYER` constants
- `src/config/characters.js` — Character roster with `emoji`, `color`, `accentColor`, `ability.name`, `ability.description`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `char.emoji` — already on every character, ready to use as HUD icon
- `char.accentColor` — already used by UIScene for bar color; use for glow/pulse tint
- `char.ability.name` — ability name string, available if tooltip or label is wanted
- `_emitParticles(color)` — burst particle helper on Player; can be extended or called with ability-specific color for activation feedback

### Established Patterns
- UIScene reads game state in `update()` by calling `gs.p1.getAbilityCooldownRatio(now)` — this ratio (0–1) is already computed correctly; new HUD can use it to drive countdown number
- All HUD Phaser objects are created in `create()`, then mutated in `update()` — follow same pattern for new elements
- `_buildAbilityBar()` creates graphics objects and stores references (`this._p1AbilBar`) for update-time mutation

### Integration Points
- New HUD element lives entirely in UIScene — no changes to Player or GameScene needed for display
- To show countdown seconds: derive from `getAbilityCooldownRatio(now)` and `ABILITY_COOLDOWN` constant
- `ABILITY_COOLDOWN` is 8000ms — countdown number = `Math.ceil(ratio_remaining * 8)`

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-ability-system-polish*
*Context gathered: 2026-04-14*
