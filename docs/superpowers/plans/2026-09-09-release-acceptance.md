# Dungeon Logic v1 Release Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one deterministic release gate plus a Yandex moderation acceptance checklist for Dungeon Logic v1.

**Architecture:** Node-only release tooling lives under `scripts/` so package auditing does not depend on Phaser or the TypeScript runtime. `sanity:release` orchestrates existing product sanities, the production build, and a pure `dist/` audit. Manual browser/debug-panel checks live in `docs/release/`.

**Tech Stack:** Node.js ESM, npm scripts, existing TypeScript/tsx sanity suites, Vite production build.

**Spec:** `docs/superpowers/specs/2026-09-09-release-acceptance-design.md`

## Global Constraints

- Do not change Campaign or Daily snapshots.
- Do not change gameplay, progression, localization, or ad policy.
- Treat `dist/` as the future upload ZIP root.
- Enforce a conservative 100,000,000-byte uncompressed package ceiling.
- The Yandex SDK archive path remains `/sdk.js`; absolute Yandex SDK S3 URLs are forbidden for this archive deployment.
- `sanity:release` must stop at the first failing check and propagate a non-zero exit status.

---

### Task 1: Release package audit

**Files:**
- Create: `scripts/release-audit-lib.mjs`
- Create: `scripts/release-audit.mjs`
- Create: `scripts/release-audit-sanity.mjs`

**Interfaces:**
- Produces: `auditReleaseDirectory(rootPath)` returning file count and byte size or throwing on a hard package violation.
- Produces: CLI `node scripts/release-audit.mjs [distPath]`.

- [x] **Step 1: Write the failing self-test**

Create fixtures in a temporary directory and assert that a valid release root passes while missing `index.html`, whitespace/Cyrillic paths, oversized content, an asynchronous/deferred SDK tag, and the absolute SDK S3 URL fail.

- [x] **Step 2: Run the self-test and verify RED**

Run: `node scripts/release-audit-sanity.mjs`
Expected: failure because `release-audit-lib.mjs` does not exist.

- [x] **Step 3: Implement the minimal audit library and CLI**

Recursively enumerate release files with `node:fs/promises`, validate path segments and total size, then inspect built `index.html` for SDK path/bootstrap.

- [x] **Step 4: Run the self-test and verify GREEN**

Run: `node scripts/release-audit-sanity.mjs`
Expected: `Release package audit sanity ... passed`.

### Task 2: Unified release command

**Files:**
- Create: `scripts/release-acceptance.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `npm run sanity:release`.
- Produces: `npm run sanity:release-audit` and `npm run audit:release-package`.

- [x] **Step 1: Extend release-audit sanity with orchestration assertions**

Import the release sanity list and assert that it contains platform lifecycle, localization, profile/settings, campaign/daily, responsive UI, puzzle lifecycle, monetization, Human Solver, and difficulty gates, with build/audit kept as final steps.

- [x] **Step 2: Verify RED**

Run: `node scripts/release-audit-sanity.mjs`
Expected: failure because `release-acceptance.mjs` does not exist.

- [x] **Step 3: Implement the orchestrator and package scripts**

Use `spawnSync` with `npm.cmd` on Windows and `npm` elsewhere. Run each configured sanity in order, then `npm run build`, then `auditReleaseDirectory('dist')`. Propagate the failing child exit code.

- [x] **Step 4: Verify GREEN without running the unavailable full dependency stack**

Run: `node scripts/release-audit-sanity.mjs`
Expected: orchestration contract passes.

### Task 3: Manual Yandex acceptance checklist

**Files:**
- Create: `docs/release/yandex-release-acceptance-v1.md`

**Interfaces:**
- Produces: a single human checklist for pre-moderation testing and archive upload.

- [x] **Step 1: Write the checklist from current official requirements**

Cover debug-panel indicators, language, Game Ready, gameplay markup, pause/resume, ads, persistence, three viewport classes, resize/orientation, console errors, draft flags, and ZIP-root procedure.

- [x] **Step 2: Cross-check the checklist against the spec**

Ensure every manual-only requirement in the spec has an explicit checkbox and expected outcome.

### Task 4: Final verification and patch packaging

**Files:**
- Verify all Task 28 files only.

**Interfaces:**
- Produces: a Task 28 ZIP patch relative to Task 27.1.

- [x] **Step 1: Run fresh Node self-test**

Run: `node scripts/release-audit-sanity.mjs`.

- [x] **Step 2: Audit a synthetic valid release root**

Run the CLI against the self-test fixture or an equivalent generated fixture and verify a success summary.

- [x] **Step 3: Attempt the real project gate**

Run: `npm run sanity:release`.
If the container cannot execute project dependencies, record the environment failure exactly and do not claim the full gate passed.

- [x] **Step 4: Review diff against Task 27.1**

Confirm no Campaign/Daily snapshot or production gameplay source changed.

- [x] **Step 5: Package only the Task 28 diff**

Create `dungeon-logic-product-task28-release-acceptance.zip` and verify file list and SHA256.
