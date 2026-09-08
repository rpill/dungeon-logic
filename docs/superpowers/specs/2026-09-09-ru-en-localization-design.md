# RU/EN Localization Design

## Goal

Make every player-facing Dungeon Logic screen consistently Russian or English, choose the initial language from Yandex `environment.i18n.lang`, and preserve a player’s manual language choice across restarts and progression resets.

## Language ownership

Introduce a small `src/i18n` boundary as the only owner of supported locale mapping and player-facing copy.

- `SupportedLanguage` is exactly `'ru' | 'en'`.
- Raw platform languages are normalized with `resolveSupportedLanguage(raw)`: `ru`, `ru-RU`, and other `ru-*` values map to Russian; every other or missing value maps to English.
- The profile keeps one persisted supported language. There is no separate runtime language state and no schema-version bump.
- On a genuinely fresh profile, `PlayerProfileService.create(..., { defaultLanguage })` seeds the setting from the platform-resolved language.
- Existing profiles with a valid saved `ru` or `en` keep that value regardless of the current SDK language. That persisted value is therefore the manual-preference authority on later launches.
- Invalid or missing legacy language values normalize to the supplied default language.
- Reset Progress preserves settings exactly as today, therefore it also preserves the chosen language.

This avoids adding an `auto/manual` state machine while still satisfying the required precedence: platform language determines the first persisted choice; later explicit Settings changes win because they are already saved.

## Copy architecture

Create one typed copy module with matching RU and EN structures. It owns navigation labels, Home, Archive, Settings, Stats, Game completion/modal copy, manuscript display names, calendar names, and compact control labels.

Dynamic text remains typed functions in the copy object instead of ad-hoc template strings in scenes. Examples include archive progress, manuscript requirements, Daily streak detail, completion metadata, and statistics summary lines.

Domain content with significant prose is localized beside its structure:

- `HelpRules` exposes `getHelpRules(language)` with identical rule IDs/order in both languages.
- `OnboardingFlow` keeps one structural tutorial flow and localized message pairs; `createOnboardingFlow(levelId, language)` returns the same targets/cells with language-specific prose.
- campaign onboarding IDs in `GameLaunch` map through `createOnboardingMessages(data, language)` rather than a single English constant.

Puzzle rules, cell coordinates, completion logic, difficulty/content data, and curated campaign/Daily files never depend on locale.

## Manuscripts and view-models

Campaign manuscript definitions remain stable content IDs/roman numerals. UI-facing titles are resolved by manuscript ID in the i18n layer.

`getManuscriptViewModels(..., language)` returns localized title and requirement text. Sealed placeholders also use localized copy. Completion UI maps the unlocked manuscript ID back through the same copy instead of rendering the Russian title embedded in campaign metadata.

## Scene integration

Every player-facing scene derives the active language from `PlayerProfileService.getProfile().settings.language` during `create()` and uses localized copy consistently for that render:

- Home
- Archive
- Level Select
- Settings
- Help
- Stats
- Game

Changing language in Settings already restarts the Settings scene after persistence, so the new language appears immediately. Navigating to any other scene reads the same persisted setting. No event bus is required.

Brand names (`DUNGEON LOGIC`, `Daily`) and symbolic technical markers can remain language-neutral. Debug/dev-only messages, console errors, generator diagnostics, and internal exception strings are outside localization scope.

## Settings presentation

The language row remains a direct RU/EN toggle. Labels and ON/OFF values are localized. The current language value is shown as a human language name (`РУССКИЙ` / `ENGLISH`) rather than an unexplained locale code.

## Failure and fallback policy

- Unknown raw SDK language: English.
- Missing SDK language/local platform: English for a fresh profile.
- Existing supported saved profile language: always preserved.
- Invalid saved language: normalize to the platform-derived default for that launch.
- Missing translation is a TypeScript error because RU and EN must satisfy the same copy interface.

## Verification

Add `sanity:i18n` covering:

- raw SDK language normalization (`ru`, `ru-RU`, `en`, other, null);
- fresh-profile platform default and existing-profile persistence precedence;
- invalid legacy language fallback;
- Settings localization/toggle/reset preservation;
- RU and EN Help rules with identical IDs/order;
- RU and EN onboarding flows with identical structural targets/cells;
- campaign onboarding messages in both languages;
- manuscript view-model localization;
- representative dynamic Home/Stats/Game copy in both languages.

Existing settings, profile, meta-navigation, puzzle-session, Daily, campaign-runtime, and platform sanity checks must continue to pass. A final source audit must show no Russian player-facing literals left in scene files or player-facing runtime view-model modules except inside the localization/help/onboarding translation sources.
