# Task 30 — Onboarding Polish Design

## Scope

Improve only the existing campaign onboarding. Do not add victory animations, chapter-complete screens, audio, or final visual assets in this task.

## Decisions

- Campaign levels 001 and 002 are fully guided from a fresh board through the solved state. The player still performs every mark; onboarding only restricts/highlights the currently justified cells.
- Campaign level 003 is strongly guided through the first use of the open-2x2 rule, then hands the player a small remainder to finish independently.
- Campaign levels 004 and 005 keep their current teaching roles.
- Long handoff/reminder messages do not disappear on timers. They remain visible until the player clicks the onboarding message panel.
- Long handoff/reminder messages are acknowledgement gates: board input and the level timer remain paused until the player clicks the message panel.
- Tutorial `focusCells` are contextual references, not errors. They use a neutral outline with no red fill. Red remains reserved for actual conflict/error feedback.
- Existing promoted campaign puzzles remain unchanged; this task changes teaching flow, not puzzle solutions or campaign curation.
- Russian and English onboarding copy remain aligned step-for-step.

## Success criteria

1. Every mutable cell of campaign-001 and campaign-002 is covered by a guided board-cell step whose expected state matches the canonical solution.
2. Campaign-003 includes an explicit guided open-2x2 deduction before a persistent click-to-dismiss handoff.
3. No message onboarding step relies on automatic timeout dismissal.
4. Clicking the visible message panel advances/dismisses a click-dismiss step.
5. `focusCells` never receive the red conflict fill.
6. Existing campaign/hint/settings/completed-level regression gates remain green.
