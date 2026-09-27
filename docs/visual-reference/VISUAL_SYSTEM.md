# Dungeon Logic visual system — approved direction

**Status:** approved visual direction and implementation contract. The exact approved desktop/phone pairs, now including **Home and Levels**, are listed in [approved/README.md](approved/README.md). Mockup content is illustrative; the current working tree and live game data determine actual behavior. The earlier blue glossy panels and intermediate mockups are not visual references for this pass.

## Material and style contract

- Cozy, slightly mysterious dungeon. Background remains atmospheric; the puzzle and functional information lead the eye.
- Main UI material: heavy **matte blue-gray slate** with modest depth, subtly hewn or chipped edges, irregular but restrained surface detail. No bright blue plastic, wide white bevels, polished gloss, gratuitous rivets or perimeter boulders.
- Reserve the darkest values for background and decoration. Functional surfaces, cell boundaries, clues, player marks, text and controls must also separate by **lightness**, not hue alone.
- Use gold for the main CTA and meaningful progress or selection accents. Red signals destructive actions; slate supports secondary actions. Do not spread gold as general trim.
- Shapes are simple and calm. A panel may have a subtle inner area or divider; avoid nested frames and special-purpose cavities. Keep recognizable monsters, chest, board materials and individual rank emblems unless an in-game scale test shows a real defect.
- Titles, body copy, secondary copy, button labels and clue digits form distinct, consistent type levels. Use runtime text for RU/EN; allow longer localized strings and changing values.

## Composition and responsive rules

- Desktop and phone portrait use the same material language but **different composition** when useful; never uniformly scale a desktop screen to fit a phone.
- Home follows the approved desktop/phone pair while keeping the real Continue, Levels, Daily, Mastery, Challenge and Settings actions, rank and progress. Preserve Daily **locked / unavailable / solved** and Challenge **locked / freeplay** states; the pictured state does not replace those runtime variants.
- Levels follows the approved desktop/phone pair while keeping campaign progression, row locking, Continue, progress, desktop scrolling and phone page navigation. The pictured scrollbar is illustrative: adapt its appearance and placement to the actual layout instead of copying it literally.
- The gameplay board is the main object. Keep the modular variable-size board frame and code-drawn clue digits. HUD, tutorial text and toolbar must fit around the board without clipping, covering controls or forcing an oversized background.
- Daily: calendar is the main object. Keep the date/streak/status area compact and make completed, today, unavailable and future states distinguishable.
- Rank Up: emblem leads, slab supports, CTA remains a separate full-size control. Mastery rank/progress elements must remain legible at phone size.
- Leaderboard: populated, empty and unavailable states share the same visual system. Rules uses the approved **second** version: one readable scrolling canvas with light dividers, not a stack of heavy slabs.
- Fit content and scrolling to actual safe space. Check desktop 1920×1080, 1366×768 and about 640 px high; phone portrait 390×844 and 412×915, plus a narrower phone if needed.

## Asset/code matrix

| Component | Implementation | Boundary |
| --- | --- | --- |
| `SlateSurface` | New neutral 9-slice raster skin (PNG or lossless WebP after export validation) | Reusable material only; no baked title, text, statistics, button locations or slots. Prove corners and cracks survive several aspect ratios. Use a distinct compact skin only if one source cannot scale cleanly. |
| `QuietInset` / info area | Runtime rectangle, subtle border and/or a separately tested small scalable slate inset skin | No content baked into the surface; avoid an extra nested frame if spacing alone is clearer. |
| `ActionButton` gold/slate/red | Three separate 9-slice skins plus shared runtime layout/states | Runtime label/icon/callback. Same family dimensions and centering; disabled stays fully opaque using a darkened version of its own skin. |
| `SquareActionButton` | Scalable square skin per needed material/state; runtime icon and hit area | Back/menu/settings share visual size; no enlarged image with a tiny hit target. |
| Button/HUD/status icons | Separate icon assets when existing icons fit; replace only visually incompatible ones | Icons never contain labels or counters. Validate at final displayed size. |
| Title, body, clues, counters, timer | Runtime text with shared type/color tokens | Localized RU/EN content and values remain independent of image files. |
| `PuzzleBoard` and modular frame | Existing board textures and reusable frame pieces; runtime assembly | Board size, clues, walls, floor, monsters, chest and marks remain game-driven. No fixed-size board image or baked numbers. |
| `TutorialNote` / hint explanation | Runtime text on a light-weight contextual surface | Desktop may sit beside the board; phone sits above it without making the board secondary. |
| `Dialog` (Hint/Reset/Skip/menu) | `SlateSurface` + runtime title/body + separate `ActionButton` instances | Existing action semantics, confirmation and availability rules stay intact. |
| `CompletionView` / Rank Up | `SlateSurface` + runtime heading/stats/message + separate emblem/monster illustration and buttons | No victory or rank-up PNG with pre-drawn holes, shelves or button seats. |
| Progress bar | Runtime track/fill with shared colors and optional separate end-cap asset only if needed at real size | Actual progress and numbers are data; no baked fill length. |
| `MasteryRequirementRow` | Runtime row layout, icon, label, current/target text and progress bar on the shared surface/inset | No dedicated glossy row plaque that clashes with the main slab. |
| Rank track | Runtime line, nodes, state colors and rank labels; existing rank emblems where appropriate | Unlock/current/completed states come from mastery data. Confirm small phone readability. |
| Calendar day | Runtime component with day number, state styling, selection/focus and optional `LevelThumbnail` | Month structure and day availability come from Daily data, not PNG. |
| Level thumbnail frame | Reusable scalable surface/border if needed | Decorative frame only; never contains a static puzzle grid. |
| Level thumbnail content | Existing runtime renderer from level and saved game data | Started = actual saved **walls**; completed = solved board; unstarted = current neutral/hidden rule. The miniature grids pictured in the Levels mockup are illustrative, **not production assets**. Do **not** add FLOOR marks in this pass or change save schema. |
| Leaderboard row | Runtime row with rank, name, result, own-row state and shared inset/divider styling | Handles variable names, values, populated/empty/unavailable states. |
| Rules canvas and dividers | Shared surface/spacing; runtime text and simple runtime line dividers | Phone content scrolls. Examples use separate existing board/cell visuals, not text baked into a page PNG. |
| Dungeon background | Keep existing background asset, with crop/brightness treatment in layout if needed | Supports UI; does not compete with the board. No screen-specific replacement without an observed need. |

**No giant screen-specific PNGs.** Source asset size, alpha crop, 9-slice caps and texture filtering are validated at intended desktop and phone display sizes before a skin is integrated. Asset generation uses the approved pairs as visual references; a generated skin is accepted only after an in-game screenshot confirms its material and scaling.

## Contrast and readability QA

Automated screenshots and simulations are **screening tools**, not proof that OLED, IPS or a physical phone passes. During implementation, capture the real game at the viewports above for every relevant state, including leaderboard empty/unavailable, long Rules text, variable-size boards and small Mastery/rank elements. Compare normal captures and simulated reduced-brightness / crushed-shadow versions; inspect luminance separation of text, board cells, clues, selected marks, buttons and panel boundaries. Fix functional distinctions that disappear while keeping the background dark.

### Manual device checklist — record pass/fail separately

- [ ] OLED phone, normal brightness: puzzle cells, clues, walls/FLOOR marks, monsters, selected state and controls remain identifiable at a glance.
- [ ] OLED phone, reduced brightness: the same elements remain distinct when dark tones compress; text and touch targets remain clear.
- [ ] IPS phone, normal and reduced brightness: repeat the functional checks; note washed blacks or merged blue-gray surfaces.
- [ ] Desktop monitor at 1920×1080, 1366×768 and short height: composition, text, modals and controls are readable with no overlap or clipping.
- [ ] Rules can be read and scrolled on phone; Leaderboard populated, empty and unavailable messages are clear; Mastery progress/rank track is legible.
- [ ] Record device model, display type, brightness setting, OS/browser, screen/state, issue and screenshot/photo. Do not label physical-device QA complete from automated screenshots alone.

## Implementation boundary

This contract authorizes visual-layer work after review. Preserve puzzle rules, saved data, Daily/campaign/mastery/leaderboard behavior, controls and unlocks. The level preview remains dynamic, and FLOOR in preview is explicitly outside this pass unless separately approved. Work on the **current working tree**; do not restore old UI or commit without request.
