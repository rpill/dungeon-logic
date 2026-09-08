# Dungeon Logic v1 Release Content Curation Foundation

**Date:** 2026-09-08  
**Status:** approved in chat

## Goal

Prepare the existing offline generator/solver pipeline to curate release content from reservoirs containing hundreds of candidates without changing the v1 runtime scope.

## Product constraints

- Campaign remains exactly 30 levels.
- Campaign 001–005 remain unchanged.
- Real manuscript ownership remains I=1–7, II=8–14, III=15–22, IV=23–30.
- Technical visual chapters/themes remain unchanged and independent from manuscripts.
- v1 release content uses only `monster-only`, `chest-one-room`, and `mixed-one-room`.
- `chest-two-rooms` and `mixed-two-rooms` remain generator capabilities for experiments/future content but are excluded from v1 release curation.
- Blockers and Directional Doors remain excluded from v1 release content.
- Runtime never generates Daily puzzles.
- Release target is approximately 60 prevalidated Daily snapshots.

## Campaign curation contract

`CampaignCurationRule` gains explicit `manuscriptId`. Every slot must agree with both its existing technical chapter ownership and the product manuscript ownership from `manuscripts.ts`.

Slots 006–030 are re-authored to the final v1 product thesis:

- Manuscript I, 006–007: easy/medium reinforcement using existing v1 archetypes.
- Manuscript II, 008–014: mostly `monster-only`, 7×7, rising easy → medium → hard.
- Manuscript III, 015–022: mostly `chest-one-room`, progressively mixing `mixed-one-room`, medium → hard.
- Manuscript IV, 023–030: strongest hard candidates across all three v1 archetypes, normally 7×7 with 8×8 allowed where useful.

The curation plan is an allow-list, not an automatic final authoring decision.

## Daily release policy

Daily eligibility is deliberately narrower than generic generator acceptance:

- v1 archetypes only;
- board size 7×7 or 8×8;
- no Blockers or Directional Doors;
- Human Solver must solve the puzzle;
- difficulty band must be `medium` or `hard`;
- difficulty score must be 30–68 inclusive.

The score range is an offline curation proxy for the product target of roughly 3–8 active minutes, not a claim that score maps exactly to minutes. Human review remains required before promotion.

## Reservoir and shortlist engine

The release-curation engine accepts an arbitrary ordered or unordered collection of generated candidates and:

1. re-runs canonical `evaluateCandidate` acceptance;
2. re-runs Human Solver for human status;
3. excludes non-v1 mechanics/archetypes;
4. records deterministic rejection reasons;
5. creates an accepted v1 reservoir;
6. ranks candidates for individual campaign slots against `campaignCurationPlan`;
7. ranks Daily-eligible candidates with diversity-aware greedy selection using existing `scoreCandidate` and `candidateDistance`;
8. retains non-selected accepted candidates as reservoir rather than discarding them.

All ranking must be deterministic and independent of input order. Candidate id is the final tie-breaker.

## Non-goals

- Do not promote campaign006–030 in this task.
- Do not replace Daily fixture dates in this task.
- Do not change campaign count, manuscripts, UI, progression, monetization, or runtime gameplay.
- Do not remove two-room archetypes from the generic generator.
