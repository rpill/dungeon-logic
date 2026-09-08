# Dungeon Logic v1 Product/UI Implementation Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this roadmap plan-by-plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the agreed asset-free Dungeon Logic v1 product loop on desktop and mobile before final Silent Scriptorium art is integrated.

**Architecture:** Keep the generator/solver/content pipeline intact and build product systems around the existing Phaser runtime. Implement in six independently testable plans so gameplay/input, persistence/progression, level lifecycle, Yandex boundaries, Daily/meta, and monetization can be reviewed separately.

**Tech Stack:** TypeScript 6, Phaser 4.2, Vite 8, `tsx` sanity scripts, browser localStorage fallback, Yandex Games JS SDK adapters.

**Spec:** `docs/superpowers/specs/2026-09-08-dungeon-logic-v1-product-ui-design.md`

## Global Constraints

- v1 gameplay archetypes remain `monster-only`, `chest-one-room`, and `mixed-one-room`; add no new generator mechanic.
- Campaign target remains 30 levels across 4 real manuscripts; manuscripts V and VI are non-interactive future teasers and never count toward 100%.
- First 5 levels are protected onboarding; no interstitial opportunities there.
- No lives, energy, currency, shop, XP, battle pass, quests, leaderboard, Daily archive, or final Silent Scriptorium assets in the wireframe phase.
- Floor mark is an overlay on the same underlying floor.
- Hidden-solution mismatch must never be exposed unless it creates a visible-rule contradiction.
- Temporary runtime visuals use primitives/text only; no ORYX board terrain or custom board assets.
- Wide/Compact/Narrow behavior is viewport-based, not device-detection-based.

---

## Execution order

1. `2026-09-08-dungeon-logic-wireframe-puzzle-input.md`
   - Removes runtime board-asset dependency.
   - Adds active Wall/Floor tool model, touch/mouse drag, gesture-level Undo, Reset, and responsive board layout.

2. `2026-09-08-dungeon-logic-profile-manuscripts-navigation.md`
   - Replaces linear `highestUnlockedSlot` progression with manuscript thresholds + three-level frontier.
   - Introduces unified player profile persistence and Home/Archive navigation.

3. `2026-09-08-dungeon-logic-puzzle-session-lifecycle.md`
   - Autosave/resume, active timer, contextual onboarding, free hints, level result metadata, win overlays.

4. `2026-09-08-dungeon-logic-platform-boundary.md`
   - Adds local/Yandex PlayerStorage, TrustedClock, and Ads ports without coupling game logic to SDK globals.

5. `2026-09-08-dungeon-logic-daily-stats-settings.md`
   - Daily date selection, streak/calendar, Daily replay, Stats and Settings scenes.

6. `2026-09-08-dungeon-logic-monetization.md`
   - Interstitial eligibility policy and rewarded-hint integration; sticky remains disabled and IAP remains out of scope.

## Content work deliberately separate

The runtime plans must work with the currently promoted campaign subset. The release-content pass that promotes slots 006–030 and approximately 60 prevalidated Daily snapshots is a separate content-curation plan using the existing generator/acceptance/human-analysis pipeline. Product runtime must not fake those levels with nonfunctional cards.

## Final acceptance

Run after all six plans:

```bash
npm run sanity:generator
npm run sanity:human
npm run sanity:difficulty
npm run sanity:campaign
npm run sanity:campaign-theme
npm run sanity:campaign-runtime
npm run sanity:wireframe-ui
npm run sanity:profile
npm run sanity:puzzle-session
npm run sanity:platform
npm run sanity:daily
npm run sanity:monetization
npm run build
```

Then manually test at minimum:

- 1280×720 desktop viewport;
- ~900×700 compact viewport;
- ~390×844 portrait viewport;
- touch drag and mouse drag;
- leaving/resuming a half-solved puzzle;
- manuscript frontier after solving a non-first frontier level;
- Daily solved/replayed across a simulated date boundary;
- unavailable Yandex SDK fallback;
- ads unavailable fallback.
