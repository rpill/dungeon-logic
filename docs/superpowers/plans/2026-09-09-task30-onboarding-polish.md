# Task 30 Onboarding Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make the first two campaign tutorials fully guided, make level 003 a short guided-to-independent bridge, keep long handoff messages until clicked, and remove error-red from tutorial focus highlighting.

**Architecture:** Keep all behavior inside the existing `OnboardingFlow` + `GameScene` path. Extend the declarative message-step contract for click dismissal, update flow data to match existing human-solvable deductions, and add regression assertions to the existing onboarding/game sanity gates.

**Tech Stack:** TypeScript 6, Phaser 4, existing custom sanity scripts.

**Spec:** `docs/superpowers/specs/2026-09-09-onboarding-polish-design.md`

## Global Constraints

- Do not change promoted puzzle solutions or campaign curation.
- Player performs every guided mark manually.
- Red remains reserved for actual conflict/error feedback.
- RU and EN flow arrays remain structurally aligned.

---

### Task 1: Lock the desired onboarding behavior with failing sanity checks

**Files:**
- Modify: `src/dev/onboardingSanity.ts`
- Modify: `src/dev/gameRegressionSanity.ts`

**Interfaces:**
- Consumes: `createOnboardingFlow`, campaign manifest, `GameScene.ts` source.
- Produces: regression expectations for full guided coverage, level-003 open-2x2 bridge, click-dismiss messages, and neutral focus styling.

- [x] Add coverage assertions for every mutable cell in campaign-001/002.
- [x] Assert campaign-003 contains a guided open-2x2 wall step before its handoff.
- [x] Assert message steps use click dismissal rather than auto-advance timers.
- [x] Assert `GameScene` wires the message panel click and neutral focus outline.
- [x] Run the two sanity scripts and confirm they fail for the intended missing behavior.

### Task 2: Update declarative onboarding flows

**Files:**
- Modify: `src/onboarding/OnboardingFlow.ts`

**Interfaces:**
- Consumes: immutable campaign solutions and `CellState`.
- Produces: `MessageOnboardingStep.dismissOnClick`, fully guided 001/002 flows, guided 003 bridge, aligned RU/EN copy.

- [x] Replace timeout-only message semantics with optional click-dismiss semantics.
- [x] Rewrite campaign-001 steps to cover the complete solver-direct sequence.
- [x] Rewrite campaign-002 steps to cover the complete solver-direct sequence.
- [x] Add campaign-003 guided steps through the first open-2x2 deduction, then a click-dismiss handoff.
- [x] Convert campaign-004/005 final handoffs to click-dismiss.
- [x] Update English copy arrays to match every step.
- [x] Run onboarding sanity until green.

### Task 3: Implement persistent message dismissal and neutral focus visuals

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/i18n/UiCopy.ts`

**Interfaces:**
- Consumes: `MessageOnboardingStep.dismissOnClick`, existing onboarding panel objects.
- Produces: click-to-dismiss message panel and neutral outline-only focus guides.

- [x] Add localized "click to close" action copy.
- [x] Make the onboarding panel interactive and advance only click-dismiss message steps.
- [x] Remove scheduled auto-advance for persistent messages.
- [x] Render `focusCells` as transparent neutral outlines rather than red fills.
- [x] Run onboarding + game regression sanity until green.

### Task 4: Verify and package

**Files:**
- Modify: `CURRENT_STATE.md`
- Package: `/mnt/data/dungeon-logic-product-task30-onboarding-polish.zip`

**Interfaces:**
- Produces: final distributable archive with updated docs and regression gates.

- [x] Document Task 30 behavior in `CURRENT_STATE.md`.
- [x] Run targeted sanity scripts plus TypeScript/build checks available in the environment.
- [x] Re-extract the final archive and re-run targeted sanity checks against the packaged copy.
- [x] Compute SHA256 of the final archive.
