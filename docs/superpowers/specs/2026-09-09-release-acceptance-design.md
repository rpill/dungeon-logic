# Dungeon Logic v1 Release Acceptance Design

## Goal

Create one repeatable release gate that verifies the shippable Dungeon Logic v1 build before a Yandex Games moderation submission, plus a concise manual acceptance matrix for checks that cannot be proven from source code alone.

## Scope

Task 28 does not add game mechanics, content, monetization rules, or new UI. It adds release tooling and documentation around the already implemented v1 product.

The automated gate must:

1. run the release-relevant existing sanity suites;
2. run the production TypeScript/Vite build;
3. audit the resulting `dist` directory as the exact root that will be zipped for Yandex Games;
4. fail if the release root violates hard package requirements;
5. print a concise package summary on success.

The manual acceptance checklist must cover:

- Yandex debug-panel SDK initialization and current-loader status;
- Game Ready timing;
- automatic language detection and manual language persistence;
- GameplayAPI state transitions;
- `game_api_pause` / `game_api_resume` including startup ads and tab focus;
- ads, cloud save, settings, Daily/Campaign entry points;
- desktop, compact landscape, and mobile portrait layouts;
- live resize/orientation changes;
- browser console errors;
- final Developer Console draft flags and upload procedure.

## Current Yandex Requirements Used by This Gate

Checked against the Yandex Games documentation on 2026-09-09:

- The game archive must contain `index.html` at archive root.
- Total uncompressed game files must not exceed 100 MB.
- File and folder names must not contain spaces or Cyrillic characters.
- The SDK must be initialized according to the current SDK documentation.
- `LoadingAPI.ready()` must correspond to actual user readiness.
- Gameplay markup must correspond to actual gameplay start/stop.
- `game_api_pause` / `game_api_resume` must pause/resume the game correctly.
- Automatic language detection must use `environment.i18n.lang` at launch.
- Cloud-save use must be declared in the draft when cloud saves are used.
- Ads must be called only through Yandex Games SDK and shown at logical pauses.
- On fullscreen/rewarded ads, gameplay and sound must be paused.
- The game must render correctly during resize/orientation changes and must not expose browser scrolling or context-menu interactions through the game field.

Primary references:

- https://yandex.com/dev/games/doc/en/concepts/requirements
- https://yandex.com/dev/games/doc/en/requirements/1/19
- https://yandex.com/dev/games/doc/en/requirements/2/14
- https://yandex.com/dev/games/doc/en/sdk/sdk-events
- https://yandex.com/dev/games/doc/en/console/debug-panel
- https://yandex.com/dev/games/doc/en/console/add-new-game/draft

## Automated Release Directory Audit

The release audit treats `dist/` as the future ZIP root. It fails when:

- `dist/` is missing or is not a directory;
- `dist/index.html` is missing;
- any relative path segment contains whitespace;
- any relative path segment contains Cyrillic characters;
- total uncompressed file size is greater than 100,000,000 bytes;
- the built `index.html` does not contain the relative Yandex SDK path `/sdk.js`;
- the relative `/sdk.js` tag is marked `async` or `defer`, which would race the current bootstrap;
- the build contains the forbidden absolute Yandex SDK S3 URL `sdk.games.s3.yandex.net`.

The 100,000,000-byte threshold is intentionally conservative compared with binary MiB interpretation.

The audit does not attempt to create a ZIP. The upload ZIP must be created from the *contents* of `dist/`, so `index.html` remains at the archive root. This avoids adding a packaging dependency solely for archive creation.

## Unified `sanity:release`

`npm run sanity:release` is the only command needed before preparing the upload ZIP. It:

1. runs the release-audit self-test;
2. runs all release-relevant existing product sanities;
3. runs `npm run build`;
4. audits `dist/`;
5. exits non-zero immediately on the first failure.

Generator benchmarking/analysis CLIs are excluded because curated Campaign and Daily release snapshots are already independently revalidated by release-specific sanities.

## Manual Acceptance

Automation cannot prove browser-specific layout, visual overlap, debug-panel indicators, ad UX, or the absence of console errors in the hosted Yandex environment. A release checklist therefore remains mandatory after `sanity:release` passes.

The checklist uses three primary viewport classes already covered by product layout logic:

- desktop: `1280×720`;
- compact landscape: `844×390`;
- mobile portrait: `390×844`.

Manual acceptance is performed in Yandex draft/prod testing with the debug panel before moderation submission.

## Non-goals

- generating icons, covers, screenshots, or store copy;
- changing the release date of the 60-day Daily schedule;
- adding audio assets;
- changing ad frequency;
- adding analytics;
- creating a new deployment system.
