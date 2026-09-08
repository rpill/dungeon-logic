# Dungeon Logic v1 — Yandex Release Acceptance Checklist

Last reviewed against Yandex Games documentation: **2026-09-09**.

This is the final manual gate after the automated command succeeds:

```bash
npm run sanity:release
```

Do not submit the game for moderation until every applicable checkbox below is complete.

## 1. Automated gate and upload root

- [ ] `npm run sanity:release` exits with code 0.
- [ ] The final line reports `Release acceptance passed`.
- [ ] `dist/index.html` exists.
- [ ] The audited uncompressed `dist/` size is below 100,000,000 bytes.
- [ ] No file/folder path under `dist/` contains spaces or Cyrillic characters.
- [ ] `dist/index.html` loads `/sdk.js` as a synchronous classic script and contains the generated app module entry.
- [ ] `dist/index.html` does **not** use `https://sdk.games.s3.yandex.net/sdk.js` for archive deployment.

### Creating the upload ZIP

Create the ZIP from the **contents of `dist/`**, not from the `dist` directory itself.

Correct archive root:

```text
index.html
assets/
...
```

Incorrect archive root:

```text
dist/
  index.html
  assets/
```

After creating the ZIP, open it once and verify that `index.html` is directly at archive root.

## 2. Developer Console draft flags

- [ ] Supported platforms match what was actually tested. For v1, declare desktop and mobile only if both matrices below pass.
- [ ] Orientation matches actual support. If both portrait and landscape are declared, both must pass manual acceptance.
- [ ] `Game translated into` includes **Russian** and **English**.
- [ ] `The game use cloud save` is enabled because Dungeon Logic persists the player profile via the Yandex Player data API.
- [ ] Monetization is enabled and configured for the SDK ad flow used by the game.
- [ ] No in-app purchases are declared; Dungeon Logic v1 does not implement purchases.
- [ ] The uploaded build version is updated from the previously moderated version.

## 3. Yandex debug panel — startup and SDK

Open the uploaded draft using the Yandex debug panel.

Official debug-panel path: Developer Console → game draft → **Open with debug panel**. The address-bar `debug-mode=16` method can also be used when appropriate.

- [ ] SDK initialization indicator is healthy and shows the current loader state expected by the current Yandex SDK documentation. If the panel reports an old-loader state, stop and investigate before moderation.
- [ ] No SDK initialization error appears in the browser console.
- [ ] **Game Ready** changes to ready/green only when the first interactive game screen is actually usable.
- [ ] Repeat startup after manually dismissing the Yandex loading screen; Game Ready still changes at the correct moment.
- [ ] Repeat startup without manually dismissing the Yandex loading screen; Game Ready still changes at the correct moment.
- [ ] The debug panel language indicator reports **`I18N is used`**.

## 4. Language acceptance

Test with the debug-panel/SDK language mock or equivalent Yandex draft environment.

### Russian platform language

- [ ] Fresh profile starts in Russian when SDK language is `ru`/Russian.
- [ ] Home, Settings, Level Select, Archive, Help, Statistics, Daily, onboarding, puzzle HUD, dialogs and completion copy are Russian.
- [ ] Settings is visible from the **first launch**; it is not gated by campaign progress.

### Non-Russian platform language

- [ ] Fresh profile starts in English for a non-Russian SDK language.
- [ ] The same surfaces are fully English with no mixed Russian UI.

### Manual override

- [ ] Switch Russian → English in Settings; the Settings scene updates immediately.
- [ ] Navigate through Home → Archive → Help → Statistics → puzzle; the chosen language remains consistent.
- [ ] Reload the page; English remains selected.
- [ ] Switch English → Русский; reload again; Russian remains selected.
- [ ] Reset progress; the selected language is preserved.

## 5. Gameplay markup and platform pause/resume

Use the Yandex debug-panel gameplay controls while watching the gameplay indicator.

- [ ] Home/menu state is not marked as active gameplay.
- [ ] Starting a Campaign or Daily puzzle changes gameplay markup to active/green.
- [ ] Completing the puzzle changes gameplay markup to stopped/red.
- [ ] Opening Help from a puzzle stops gameplay markup and freezes puzzle interaction/timing.
- [ ] Closing Help resumes gameplay only if no other pause condition remains.
- [ ] Opening reset/hint/completion states does not leave gameplay incorrectly active.

### Platform pause/resume

- [ ] While actively solving, trigger `game_api_pause` from the debug panel: board input and active timer stop immediately.
- [ ] Trigger `game_api_resume`: board input and active timer resume when the puzzle itself is otherwise active.
- [ ] Trigger pause while Help is open, then resume: Help remains the blocker and puzzle input does not resume behind it.
- [ ] Switch to another browser tab/window: puzzle gameplay pauses.
- [ ] Return to the game: puzzle gameplay resumes correctly.
- [ ] Reload with a startup fullscreen ad: gameplay/timer do not start behind the ad; they begin only after platform resume.

## 6. Ads

### Rewarded hint

- [ ] Request the rewarded hint only through the explicit hint/reward UI.
- [ ] The UI clearly states that an ad is being watched in exchange for a hint/reward.
- [ ] Gameplay is stopped while the rewarded ad is open.
- [ ] Reward is granted only after the rewarded callback.
- [ ] Closing/failing an ad without a reward does not grant the hint.
- [ ] Returning from the ad preserves puzzle state and progress.

### Interstitial

- [ ] Interstitials appear only at the implemented logical campaign pause points, never mid-move.
- [ ] Gameplay is stopped while an interstitial is open.
- [ ] Returning from the ad preserves campaign/profile state.

If audio assets are added later, re-run these checks and verify music/SFX are silent during ads and while the game is unfocused.

## 7. Persistence and cloud profile

- [ ] Complete at least one Campaign level; reload the page; completion remains saved.
- [ ] Confirm the next Campaign frontier remains unlocked after reload.
- [ ] Change language/settings; reload; preferences remain saved.
- [ ] Complete a Daily; reload; Daily history/streak data remains saved.
- [ ] In the Yandex draft with cloud save enabled, verify the same profile is restored after a fresh game session.
- [ ] If testing on a second device/browser with the same authorized Yandex account, verify cloud profile data is recovered there as expected.
- [ ] Guest play remains possible; the game does not force third-party registration.

## 8. Desktop acceptance — 1280×720

- [ ] Home fits the active area; no browser scrollbar appears.
- [ ] Settings is immediately reachable.
- [ ] Level Select shows all 30 cards via the game's own scrolling; final level can be reached.
- [ ] Mouse-wheel scroll works without moving the browser page.
- [ ] Dragging Level Select does not accidentally launch a level.
- [ ] Fixed Level Select header/Continue area stays fixed while cards scroll underneath.
- [ ] Archive, Help and Statistics do not overlap or clip text.
- [ ] Puzzle board, clues and all puzzle controls are visible without browser-page scrolling.
- [ ] Mouse interaction does not select webpage text or open the browser context menu over the game.
- [ ] Resize the browser while a puzzle is active; the same puzzle state remains and the board relayouts rather than restarting.

Also test at least one narrower desktop window. The active game area must remain usable without disproportionate stretching or clipped controls.

## 9. Compact landscape acceptance — 844×390

- [ ] Home/navigation controls remain readable and clickable.
- [ ] Settings and language switch fit without clipping.
- [ ] Level Select scroll remains usable.
- [ ] Puzzle board plus required controls fit the active gameplay view.
- [ ] Help/reset/hint/completion dialogs fit without covering required confirmation controls.
- [ ] No browser scrollbar or swipe-to-refresh interaction is exposed through the game surface.
- [ ] Rotate/resize away from and back to this size; current puzzle state is preserved.

## 10. Mobile portrait acceptance — 390×844

- [ ] All primary navigation controls have comfortable touch targets.
- [ ] Long press does not select the game surface or open a context menu.
- [ ] Level Select uses two columns and exposes all 30 levels through internal vertical scrolling.
- [ ] Touch drag scrolling does not accidentally activate a level card.
- [ ] Puzzle can be played entirely by touch.
- [ ] Main puzzle screen does not require browser-page scrolling.
- [ ] All puzzle controls required for play are immediately available.
- [ ] Modals fit inside the viewport with confirmation/cancel controls visible.
- [ ] Portrait → landscape → portrait preserves puzzle state and restores a usable layout.

## 11. Content smoke

- [ ] Campaign `001–005` onboarding is understandable in both languages.
- [ ] Campaign can continue beyond `005`; Level Select contains `001–030`.
- [ ] Spot-check early, middle and late Campaign boards for visual/logic correctness.
- [ ] Daily entry uses the immutable curated schedule and does not generate a runtime board.
- [ ] Daily outside the scheduled release calendar is shown as unavailable rather than as a missed result.
- [ ] Statistics calendar correctly distinguishes unavailable, available, completed and missed dates.
- [ ] Help describes the mechanics that actually exist in the shipped build.

## 12. Browser/console smoke

At minimum test the browsers/platforms you declare in the Yandex draft.

- [ ] Yandex Browser: launch, start puzzle, resize, settings, ad smoke, reload.
- [ ] Google Chrome: same basic smoke.
- [ ] Mobile Yandex environment/app or representative Android browser: touch, rotation, ad smoke, reload.
- [ ] No uncaught exceptions appear during startup.
- [ ] No uncaught exceptions appear during Campaign/Daily play, navigation, resize/orientation, ads, tab switching or reload.
- [ ] No failed requests exist for required game assets.

If Firefox/Safari/Opera are included in the actual supported-platform scope or are available for final QA, run the same smoke there before submission.

## 13. Final moderation submission gate

- [ ] `npm run sanity:release` was rerun after the **last code/content change**.
- [ ] The ZIP was created from the final audited `dist/` contents.
- [ ] The uploaded ZIP was opened and `index.html` verified at root.
- [ ] The uploaded Yandex draft itself, not only localhost, passed the debug-panel checks.
- [ ] Developer Console languages, cloud-save flag, monetization, supported platforms and orientation match the tested build.
- [ ] Required title, description, how-to-play, icon, cover and screenshots are prepared separately and match the actual game.
- [ ] At least two screenshots/instruction images required by the draft are prepared for the declared device variants.
- [ ] Screenshots/promotional media show the actual Dungeon Logic game and are not simply reused as the icon/cover.
- [ ] No temporary debug UI, generated candidate reports, dev-only text or test data is visible in the uploaded build.

Only after all applicable checks are complete should the draft be submitted for moderation.

## Official references

- Game requirements: https://yandex.com/dev/games/doc/en/concepts/requirements
- SDK methods / moderation checks: https://yandex.com/dev/games/doc/en/requirements/1/19
- Automatic language detection: https://yandex.com/dev/games/doc/en/requirements/2/14
- Pause/resume events: https://yandex.com/dev/games/doc/en/sdk/sdk-events
- Game loading/gameplay markup: https://yandex.com/dev/games/doc/en/sdk/sdk-game-events
- Debug panel: https://yandex.com/dev/games/doc/en/console/debug-panel
- Draft/archive requirements: https://yandex.com/dev/games/doc/en/console/add-new-game/draft
- Testing: https://yandex.com/dev/games/doc/en/console/test-game
