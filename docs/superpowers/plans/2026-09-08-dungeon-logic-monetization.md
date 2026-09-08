# Dungeon Logic Monetization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add restrained v1 interstitial eligibility and rewarded-hint behavior without putting ads inside active solving or Daily completion.

**Architecture:** A pure monetization policy decides eligibility from profile/timestamps; GameScene/Home only request ads at explicit user transitions. AdsPort handles SDK availability; gameplay receives result enums rather than SDK callbacks.

**Tech Stack:** TypeScript 6, Phaser 4.2, PlatformServices AdsPort.

**Spec:** `docs/superpowers/specs/2026-09-08-dungeon-logic-v1-product-ui-design.md`

## Global Constraints

- No interstitial opportunity during levels 001–005.
- Never show interstitial during active solving, Reset, Undo, or automatic Daily completion.
- Initial opportunity cadence: after about 2 post-onboarding campaign completions and at least 4 minutes since the last successful display/opportunity timestamp used by policy.
- Rewarded is Hint only; one actual reward callback = one hint.
- Sticky banner disabled.
- Remove Ads/IAP not implemented in v1.

---

### Task 1: Pure interstitial policy

**Files:**
- Create: `src/monetization/InterstitialPolicy.ts`
- Create: `src/dev/monetizationSanity.ts`
- Modify: `package.json`

**Interfaces:**

```ts
export interface InterstitialState {
  readonly campaignCompletionsSinceOpportunity: number;
  readonly lastInterstitialAtMs: number | null;
}
export function isInterstitialEligible(input: {
  readonly completedSlot: number;
  readonly state: InterstitialState;
  readonly nowMs: number;
}): boolean;
```

- [ ] **Step 1: Write policy cases**

Assert slots <=5 false; one completion false; two completions true only when cooldown satisfied; Daily has no call path; unavailable/skipped ad does not trap navigation.

- [ ] **Step 2: Implement constants**

```ts
export const INTERSTITIAL_COMPLETION_INTERVAL = 2;
export const INTERSTITIAL_COOLDOWN_MS = 4 * 60 * 1000;
```

- [ ] **Step 3: Add `sanity:monetization` and run**

- [ ] **Step 4: Commit**

### Task 2: Campaign Next transition integration

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/profile/PlayerProfileService.ts`
- Create: `src/monetization/MonetizationService.ts`
- Extend: `src/dev/monetizationSanity.ts`

**Interfaces:**
- `MonetizationService.maybeShowCampaignInterstitial(completedSlot): Promise<void>`.
- Navigation always continues whether result is `shown`, `skipped`, or `unavailable`.

- [ ] **Step 1: Count post-onboarding completions**

Completion persistence increments counter; eligibility is evaluated only when player deliberately presses `Next`. `To manuscript` never forces an ad.

- [ ] **Step 2: Pause active timer around ad port call**

Puzzle is already solved, but keep shared timer lifecycle correct for future use.

- [ ] **Step 3: After ad promise resolves, start recommended next puzzle**

No artificial delay and no separate "ad incoming" screen.

- [ ] **Step 4: Run sanity/build and commit**

### Task 3: Rewarded hint integration

**Files:**
- Modify: `src/gameplay/HintService.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/monetization/MonetizationService.ts`
- Extend: `src/dev/monetizationSanity.ts`

**Interfaces:**
- `requestHint(): Promise<'delivered'|'cancelled'|'unavailable'|'none'>`.

- [ ] **Step 1: Preserve free-hint path**

When free hints remain, no ad call occurs.

- [ ] **Step 2: Rewarded path**

Show dialog copy explaining one ad gives one hint. Call `AdsPort.showRewarded()`. Only result `rewarded` consumes/delivers one hint. `closed` and `unavailable` consume nothing.

- [ ] **Step 3: Daily uses identical explicit rewarded path**

No difference in streak eligibility.

- [ ] **Step 4: Verify no sticky/IAP code was added**

Search:

```bash
grep -R "sticky\|purchase\|payments\|currency" -n src/monetization src/scenes || true
```

Review any hits; v1 monetization code should contain none except explanatory comments.

- [ ] **Step 5: Full verification**

```bash
npm run sanity:monetization
npm run sanity:platform
npm run sanity:puzzle-session
npm run sanity:daily
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/monetization src/gameplay/HintService.ts src/scenes/GameScene.ts src/profile src/dev/monetizationSanity.ts package.json
git commit -m "feat: add restrained ad monetization"
```
