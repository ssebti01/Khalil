# Claude Code Game Studios -- Game Studio Agent Architecture

Indie game development managed through 48 coordinated Claude Code subagents.
Each agent owns a specific domain, enforcing separation of concerns and quality.

## Technology Stack

- **Game**: Head Soccer (web-based clone)
- **Engine**: Phaser 3.90 (Matter.js physics)
- **Language**: JavaScript (ES Modules)
- **Version Control**: Git with trunk-based development
- **Build System**: Vite (`npm run dev` → localhost:5173, `npm run build` → dist/)
- **Asset Pipeline**: Static assets in `/assets/`, loaded via Phaser preload

### Engine Notes
This project uses **Phaser 3** (web browser target), NOT Godot/Unity/Unreal.
- Physics: Matter.js (bundled in Phaser 3)
- Rendering: WebGL with Canvas fallback
- Entry point: `src/index.html` → `src/main.js`
- Scenes: BootScene → MenuScene → GameScene + UIScene → ResultScene

### Controls
- **P1**: A/D (move), W (jump), Q (ability)
- **P2 / CPU**: ←/→ (move), ↑ (jump), SHIFT (ability)

## Project Structure

@.claude/docs/directory-structure.md

## Source Layout

```
src/
  main.js              Phaser game boot config
  index.html           Entry point
  scenes/              BootScene, MenuScene, GameScene, UIScene, ResultScene
  entities/            Ball.js, Player.js
  ai/                  CPUPlayer.js (state machine AI)
  config/              constants.js, characters.js
assets/                Static images/audio
heads/                 Character head art (Gemini-generated)
```

## Technical Preferences

@.claude/docs/technical-preferences.md

## Coordination Rules

@.claude/docs/coordination-rules.md

## Collaboration Protocol

**User-driven collaboration, not autonomous execution.**
Every task follows: **Question -> Options -> Decision -> Draft -> Approval**

- Agents MUST ask "May I write this to [filepath]?" before using Write/Edit tools
- Agents MUST show drafts or summaries before requesting approval
- Multi-file changes require explicit approval for the full changeset
- No commits without user instruction

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for full protocol and examples.

> **First session?** If the project has no engine configured and no game concept,
> run `/start` to begin the guided onboarding flow.

## Coding Standards

@.claude/docs/coding-standards.md

## Context Management

@.claude/docs/context-management.md
