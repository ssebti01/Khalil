# Head Soccer — Game Design Document

**Version**: 0.1  
**Engine**: Phaser 3.90 (Matter.js physics)  
**Target Platform**: Web browser (desktop)

---

## 1. Overview

A 2D physics-based soccer game where players control characters with oversized heads to kick a ball into the opponent's goal. Inspired by the original mobile game *Head Soccer* by D&D Dream. Fast, arcadey, and fun for 1v1 local multiplayer or vs CPU.

---

## 2. Core Gameplay Loop

```
Menu → Character Select → Match (90s) → Result → Rematch or Menu
```

1. Two players enter a single-screen arena
2. A ball is dropped from center-top
3. Players move, jump, and use special abilities
4. Ball goes into goal = 1 point
5. First to 7 goals **or** most goals at the end of 90 seconds wins
6. After result screen, players can rematch or return to menu

---

## 3. Arena

- **Width**: 1280px, **Height**: 720px
- **Goals**: 60px wide × 180px tall, one on each wall
- **Floor**: Grass pitch at y=640
- **Ceiling**: Solid (balls bounce off)
- **Goal posts**: Solid — balls must pass through the opening
- **Net**: Visual only, behind goal zone sensors

---

## 4. Characters

| ID | Name | Speed | Jump | Power | Ability |
|----|------|-------|------|-------|---------|
| fire | Blaze | 1.0 | 1.0 | 1.2 | Fireball — power kick toward opponent goal |
| ice | Frost | 0.9 | 1.1 | 0.9 | Freeze — opponent frozen 2s |
| thunder | Bolt | 1.2 | 0.9 | 1.0 | Thunder Rush — horizontal dash |
| ninja | Shadow | 1.3 | 1.2 | 0.8 | Teleport — instantly move to ball |

**Ability cooldown**: 8 seconds

---

## 5. Physics

- **Engine**: Matter.js (bundled in Phaser 3)
- **Gravity**: `y: 2` px/frame² (~120 px/sec² at 60 fps) — set in `src/main.js` Phaser config
- **Ball restitution**: 0.7 (bouncy)
- **Player restitution**: 0.1 (near-zero bounce)
- **Ball-head collision**: impulse applied based on relative velocity (Matter.js automatic)
- **Player movement**: direct velocity set (not force), for responsive feel
- **Ball max velocity**: 25 px/frame (clamped each frame to prevent physics instability)
- **Ball max angular velocity**: 0.3 rad/frame (clamped to prevent visual blurring)
- **Stuck-ball recovery**: ball resets to center if it travels <2 px for 5 seconds

### Surface Restitution Table

| Surface | Restitution | Intent |
|---------|-------------|--------|
| Floor (grass) | 0.2 | Absorbs energy — no vertical ping-pong |
| Ceiling | 0.5 | Moderate bounce — punishes high shots |
| Side walls | 0.3 | Soft deflection off outer walls |
| Goal back wall | 0.4 | Ball stays lively after entering goal |
| Goal posts / crossbar | 0.4–0.5 | Solid hit, clear deflection |
| Ball (own restitution) | 0.7 | Reactive, arcade-bouncy feel |

---

## 6. Controls

| Action | P1 | P2 |
|--------|----|----|
| Move left | A | ← |
| Move right | D | → |
| Jump | W | ↑ |
| Ability | Q | SHIFT |

---

## 7. Match Rules

- Duration: 90 seconds
- Max score: 7 goals (instant win)
- After a goal: 3-second freeze + reset
- Tie at full time: draw

---

## 8. Game Modes

- **2 Player**: Same keyboard, P1 left side, P2 right side
- **vs CPU**: P1 plays against AI opponent with state-machine behavior (CHASE / DEFEND / SHOOT)

---

## 9. AI Design (CPUPlayer)

Simple reactive state machine:

| State | Condition | Behavior |
|-------|-----------|----------|
| DEFEND | Ball near own goal | Move to stand in front of own goal |
| SHOOT | Ball close + low | Move toward ball, jump if needed |
| CHASE | Default | Move toward ball |

- Reaction delay: 80ms (not frame-perfect)
- Occasional ability use (40% chance every 10s)
- Difficulty tuning: adjust `reactionDelay` and `randomness` constants

---

## 10. Scenes

| Scene | Purpose |
|-------|---------|
| BootScene | Preload textures, launch Menu |
| MenuScene | Game mode toggle, character select (arrows), start |
| GameScene | Physics world, match loop, goal detection |
| UIScene | Score display, timer, ability cooldown bars (runs parallel) |
| ResultScene | Winner announcement, rematch / menu buttons |

---

## 11. Art Direction

- **Style**: Cartoonish, colorful, bold outlines
- **Characters**: Large circular heads, minimal body, distinct color palette per character
- **Arena**: Night stadium with crowd silhouettes, glowing pitch lines, goal nets
- **Effects**: Particle bursts on ability use, screen flash + text on goal

---

## 12. Future Scope

- [ ] More characters (Robot, Dragon, Viking…)
- [ ] Multiple arenas (snow, desert, space)
- [ ] Power-up items (speed boots, giant head, shrink ball)
- [ ] Tournament mode (bracket-style)
- [ ] Online multiplayer (WebSocket)
- [ ] Mobile controls (touch joystick + buttons)
- [ ] Sound effects and music
- [ ] Leaderboard / high scores
