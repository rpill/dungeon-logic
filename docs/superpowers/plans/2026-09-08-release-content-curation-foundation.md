# Release Content Curation Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic v1 release-content curation contracts and shortlist tooling that can process reservoirs containing hundreds of generated candidates.

**Architecture:** Keep generic generation untouched. Add release-only allow-lists/policies above canonical generator acceptance, Human Solver, Difficulty Analyzer, and existing candidate ranking metrics. Technical campaign chapters remain separate from product manuscripts.

**Tech Stack:** TypeScript, existing generator/solver/Human Solver/Difficulty Analyzer, `tsx` sanity scripts.

**Spec:** `docs/superpowers/specs/2026-09-08-release-content-curation-foundation-design.md`

## Global Constraints

- Campaign remains 30 levels; 001–005 unchanged.
- Manuscripts: I=1–7, II=8–14, III=15–22, IV=23–30.
- Release archetypes only: `monster-only`, `chest-one-room`, `mixed-one-room`.
- Keep generic two-room generator support intact.
- Daily score proxy: 30–68 inclusive, bands medium/hard, sizes 7/8.
- No runtime generation or content promotion in this task.

---

### Task 1: Align campaign curation with final v1 manuscripts

**Files:**
- Modify: `src/content/campaign/types.ts`
- Modify: `src/content/campaign/curationPlan.ts`
- Modify: `src/dev/CampaignPromotion.ts`
- Test: `src/dev/releaseCurationSanity.ts`

**Interfaces:**
- Produces `CampaignCurationRule.manuscriptId: ManuscriptId`.
- `getCampaignCurationRule(slot)` remains the slot lookup API.

- [ ] Write a failing sanity asserting all 30 slots have correct manuscript ownership and only v1 archetypes.
- [ ] Run it and verify RED on the old curation contract.
- [ ] Add `manuscriptId`, re-author slots 006–030, and validate manuscript ownership during promotion.
- [ ] Run the sanity and existing campaign-promotion sanity.

### Task 2: Add Daily release eligibility policy

**Files:**
- Create: `src/content/release/DailyReleasePolicy.ts`
- Test: `src/dev/releaseCurationSanity.ts`

**Interfaces:**
- Produces `DailyReleaseCandidateFacts`.
- Produces `evaluateDailyReleaseEligibility(facts): { eligible: boolean; reasons: readonly string[] }`.

- [ ] Add failing cases for easy, expert, score edges, forbidden archetypes, unsupported size, blockers/doors, and unsolved Human Solver state.
- [ ] Run RED.
- [ ] Implement the narrow release policy.
- [ ] Run GREEN.

### Task 3: Add deterministic reservoir and shortlist engine

**Files:**
- Create: `src/content/release/ReleaseCuration.ts`
- Test: `src/dev/releaseCurationSanity.ts`

**Interfaces:**
- Produces `analyzeReleaseCandidates(candidates)`.
- Produces `rankCampaignSlotCandidates(reservoir, slot, limit)`.
- Produces `selectDailyReleaseShortlist(reservoir, limit)` with selected + remainder reservoir.

- [ ] Add failing tests for canonical revalidation, forbidden release mechanics, input-order independence, limit behavior, and Daily remainder preservation.
- [ ] Run RED.
- [ ] Implement with existing `evaluateCandidate`, `analyzeHumanSolvability`, `scoreCandidate`, and `candidateDistance`.
- [ ] Run GREEN.

### Task 4: Wire sanity command and verify regressions

**Files:**
- Modify: `package.json`
- Test: existing generator/campaign/human/difficulty sanity scripts.

- [ ] Add `sanity:release-curation`.
- [ ] Run release curation, campaign promotion, generator, human, difficulty, campaign and build checks.
- [ ] Package only Task 22 diff relative to the supplied current project.
