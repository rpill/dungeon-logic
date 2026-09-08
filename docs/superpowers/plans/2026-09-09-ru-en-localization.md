# RU/EN Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all player-facing Dungeon Logic UI consistently Russian or English with Yandex language auto-detection on first launch and persisted manual override thereafter.

**Architecture:** Add a typed `src/i18n` copy boundary and keep game/content logic locale-neutral. Seed fresh profiles from the platform language through `PlayerProfileService.create(..., { defaultLanguage })`; scenes always render from the persisted profile setting. Localize Help/onboarding prose through language-aware factories while preserving their structural IDs and targets.

**Tech Stack:** TypeScript 6, Phaser 4, Yandex Games SDK, `tsx` sanity scripts.

**Spec:** `docs/superpowers/specs/2026-09-09-ru-en-localization-design.md`

## Global Constraints

- Supported languages are exactly `ru` and `en`.
- Raw `ru` / `ru-*` platform values map to Russian; all other/missing raw values map to English.
- Fresh profile language comes from the platform default; valid saved profile language always wins on later launches.
- Settings language changes persist immediately and Reset Progress preserves them.
- Campaign/Daily puzzle content, solver rules, coordinates, and curated snapshots remain locale-neutral and unchanged.
- Debug/dev/console strings are outside localization scope.
- RU and EN copy must satisfy one TypeScript interface so missing translations fail compilation.

---

### Task 1: Language model and profile default precedence

**Files:**
- Create: `src/i18n/Language.ts`
- Modify: `src/profile/types.ts`
- Modify: `src/profile/PlayerProfile.ts`
- Modify: `src/profile/PlayerProfileService.ts`
- Modify: `src/scenes/BootScene.ts`
- Test: `src/dev/localizationSanity.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `SupportedLanguage = 'ru' | 'en'`
- Produces: `resolveSupportedLanguage(raw: string | null | undefined): SupportedLanguage`
- Produces: optional `defaultLanguage` profile creation/normalization behavior.

- [ ] **Step 1: Write RED language/profile sanity**

Assert raw `ru`, `ru-RU`, `RU-ru` resolve to `ru`; `en`, `de`, empty, and null resolve to `en`. Create fresh profile services with `defaultLanguage: 'en'` and assert English is seeded. Load a saved profile whose language is `ru` while default is `en` and assert Russian survives. Load an invalid language and assert it falls back to English.

- [ ] **Step 2: Run RED**

Run: `npx tsx src/dev/localizationSanity.ts`
Expected: module/type failures because the language boundary/default option does not exist.

- [ ] **Step 3: Implement minimal language/profile support**

Create `Language.ts`; type `PlayerSettings.language` as `SupportedLanguage`; add optional default-language arguments to fresh/normalize/migration/profile-service creation; normalize only `ru`/`en`; pass `resolveSupportedLanguage(platformServices.environment.language)` from Boot.

- [ ] **Step 4: Run GREEN**

Run: `npx tsx src/dev/localizationSanity.ts`
Expected: language/profile assertions pass.

---

### Task 2: Typed copy, Help, onboarding, and manuscript localization

**Files:**
- Create: `src/i18n/UiCopy.ts`
- Modify: `src/help/HelpRules.ts`
- Modify: `src/onboarding/OnboardingFlow.ts`
- Modify: `src/runtime/GameLaunch.ts`
- Modify: `src/runtime/MetaSelectors.ts`
- Test: `src/dev/localizationSanity.ts`

**Interfaces:**
- Produces: `getUiCopy(language)` returning identical typed RU/EN copy structures.
- Produces: `getHelpRules(language)`.
- Produces: `createOnboardingFlow(levelId, language)` with structurally identical localized steps.
- Produces: `createOnboardingMessages(data, language)`.
- Produces: `getManuscriptViewModels(manifest, profile, language)`.

- [ ] **Step 1: Extend RED sanity**

Assert representative RU/EN copy differs appropriately, Help rule IDs/order are equal, onboarding step counts/targets/cells are equal while messages differ, campaign onboarding messages exist in both languages, and manuscript titles/requirements are localized without changing IDs/progress.

- [ ] **Step 2: Run RED**

Run: `npx tsx src/dev/localizationSanity.ts`
Expected: missing copy/factory signatures.

- [ ] **Step 3: Implement typed translations**

Add grouped Home/Archive/Settings/Stats/Game/common/manuscript copy with dynamic formatter functions. Replace one-language Help/onboarding/campaign-onboarding prose with language-aware factories and pass language into manuscript view models.

- [ ] **Step 4: Run GREEN**

Run: `npx tsx src/dev/localizationSanity.ts`
Expected: domain localization assertions pass.

---

### Task 3: Settings localization and persisted manual switch

**Files:**
- Modify: `src/settings/SettingsService.ts`
- Modify: `src/settings/SettingsViewModel.ts`
- Modify: `src/scenes/SettingsScene.ts`
- Modify: `src/dev/settingsSanity.ts`
- Test: `src/dev/localizationSanity.ts`

**Interfaces:**
- Consumes: `SupportedLanguage`, `getUiCopy`.
- Produces: `getSettingsRows(settings, vibrationSupported, language)`.

- [ ] **Step 1: Add RED Settings assertions**

Require Russian and English row labels/ON-OFF values, human language-name display, immediate persisted toggle from RU to EN, and reset preservation.

- [ ] **Step 2: Run RED**

Run: `npx tsx src/dev/settingsSanity.ts && npx tsx src/dev/localizationSanity.ts`
Expected: localized row signature/assertions fail.

- [ ] **Step 3: Implement Settings wiring**

Move `SupportedLanguage` ownership to i18n (re-export from SettingsService for compatibility), pass active language into row generation, localize SettingsScene navigation/title/reset dialog, and keep existing restart-after-persist behavior.

- [ ] **Step 4: Run GREEN**

Run: `npx tsx src/dev/settingsSanity.ts && npx tsx src/dev/localizationSanity.ts`
Expected: both pass.

---

### Task 4: Localize all player-facing scenes

**Files:**
- Modify: `src/scenes/HomeScene.ts`
- Modify: `src/scenes/ArchiveScene.ts`
- Modify: `src/scenes/LevelSelectScene.ts`
- Modify: `src/scenes/HelpScene.ts`
- Modify: `src/scenes/StatsScene.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/runtime/PuzzleUiState.ts`
- Test: `src/dev/localizationSanity.ts`

**Interfaces:**
- Each scene reads `profile.settings.language` once per create/render cycle and uses the typed copy/factories.
- `PuzzleUiState` accepts language/copy input rather than emitting fixed English button labels.

- [ ] **Step 1: Add RED representative UI assertions**

Require Home, Stats, Game tool/help/completion, Level Select, Archive, and Help copy to be available in both languages; require PuzzleUiState hint labels to be localized.

- [ ] **Step 2: Run RED**

Run: `npx tsx src/dev/localizationSanity.ts`
Expected: scene/runtime player copy is still hard-coded.

- [ ] **Step 3: Wire scenes to copy**

Replace hard-coded player-facing strings and dynamic templates with `getUiCopy(language)`/localized factories. Keep brand text, symbols, console/errors, and dev-only copy unchanged. Translate desktop control hints (`LMB/RMB`) and touch/help labels.

- [ ] **Step 4: Source audit**

Run a production-source grep for Cyrillic literals outside `src/i18n`, `src/help`, and `src/onboarding`; inspect remaining hits and allow only internal/non-player diagnostics or content metadata that is no longer rendered directly.

- [ ] **Step 5: Run localization GREEN**

Run: `npx tsx src/dev/localizationSanity.ts`
Expected: all localization assertions pass.

---

### Task 5: Regression, strict build gate, and patch packaging

**Files:**
- Review only Task 27 diff files.

- [ ] **Step 1: Run regressions**

Run:

```bash
npx tsx src/dev/localizationSanity.ts
npx tsx src/dev/settingsSanity.ts
npx tsx src/dev/playerProfileSanity.ts
npx tsx src/dev/metaNavigationSanity.ts
npx tsx src/dev/puzzleSessionSanity.ts
npx tsx src/dev/dailySanity.ts
npx tsx src/dev/campaignRuntimeSanity.ts
npx tsx src/dev/platformSanity.ts
```

Expected: all exit 0.

- [ ] **Step 2: Run strict/build verification**

Run `npm run build` when dependencies are intact. If the known container install is incomplete before project code, run focused strict `tsc`/syntax gates for changed files and report the environment limitation without claiming a full build.

- [ ] **Step 3: Verify content isolation**

Diff against Task 26 baseline and ensure no curated campaign/Daily level files, generator logic, monetization policy, or puzzle rules changed.

- [ ] **Step 4: Package Task 27 diff**

Create `dungeon-logic-product-task27-ru-en-localization.zip`, verify archive paths, and compute SHA256.
