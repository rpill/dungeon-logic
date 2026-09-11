# Dungeon Logic — Asset Production Plan

> **Status:** active production checklist  
> **Visual rules:** `docs/visual/VISUAL_STYLE_GUIDE.md`

## 1. Production strategy

Do not generate the entire game's asset library at once.

Production is split into three packs:

1. **Gameplay Core** — make one real puzzle screen look production-ready.
2. **Meta UI** — Home, Levels, Daily, Statistics, Settings, Tutorial/How to Play.
3. **Animation & FX** — monster reactions, chest opening, torch/solve polish.

Each pack must be integrated into the actual game before the next large pack is produced.

## 2. Global rules

- [ ] Do not cut final assets out of concept screenshots.
- [ ] Do not bake Russian/English interface text into PNG files.
- [ ] Prefer reusable component bases over unique assets per screen.
- [ ] Prefer NineSlice-compatible buttons/panels where possible.
- [ ] Use transparent PNG for standalone UI icons/entities.
- [ ] Keep source/master assets larger than final display size.
- [ ] Use the same miniature renderer language for Levels and Daily.
- [ ] Keep mobile readability as a first-class requirement.
- [ ] No asset is considered final before in-game review.

## 3. Naming convention

Use:

```text
[category]_[name]_[state]_[variant].png
```

Examples:

```text
tile_wall_base.png
monster_ghost_mint_idle_01.png
monster_ghost_mint_react_02.png
button_primary_pressed.png
panel_modal_base.png
level_card_locked_overlay.png
chest_opening_02.png
```

## 4. Recommended folder structure

```text
assets/
  gameplay/
    tiles/
    markers/
    entities/
    fx/
  ui/
    buttons/
    panels/
    icons/
  meta/
    level_card/
    calendar/
  backgrounds/
    gameplay/
    meta/
  animation/
    monsters/
    chest/
    torches/
    fx/
```

## 5. Master-size guidance

These are production starting points, not hard runtime sizes.

| Asset type | Suggested master size |
|---|---:|
| Gameplay tile | 128 × 128 |
| Marker | 64 × 64 or 80 × 80 |
| Monster | 128 × 128 |
| Chest | 128 × 128 or 160 × 160 |
| Icon master | 128 × 128 |
| Long button | 512 × 128 |
| Small button | 220 × 84 |
| Icon button | 96 × 96 |
| Large panel | 960 × 540 |
| Medium panel | 640 × 320 |
| Small panel | 384 × 192 |
| Modal panel | 900 × 700 |

## 6. PACK A — Gameplay Core

Goal: replace the wireframe look of the gameplay screen before producing the rest of the game UI.

### A1. Board tiles

- [ ] `assets/gameplay/tiles/tile_floor_base.png`
- [ ] `assets/gameplay/tiles/tile_wall_base.png`
- [ ] `assets/gameplay/tiles/tile_clue_base.png`
- [ ] `assets/gameplay/tiles/tile_blocked_base.png`
- [ ] `assets/gameplay/tiles/tile_unknown_base.png`

### A2. Board overlays

- [ ] `assets/gameplay/tiles/overlay_hover.png`
- [ ] `assets/gameplay/tiles/overlay_pressed.png`
- [ ] `assets/gameplay/tiles/overlay_hint.png`
- [ ] `assets/gameplay/tiles/overlay_conflict.png`
- [ ] `assets/gameplay/tiles/overlay_solved.png`

Only add `overlay_completed_glow.png` if the in-game solve sequence genuinely benefits from it.

### A3. Markers

- [ ] `assets/gameplay/markers/marker_floor.png`
- [ ] `assets/gameplay/markers/marker_cross.png`
- [ ] `assets/gameplay/markers/marker_hint_arrow.png`
- [ ] `assets/gameplay/markers/marker_check.png`
- [ ] `assets/gameplay/markers/marker_question.png`
- [ ] `assets/gameplay/markers/marker_lock.png`

### A4. Gameplay entities

Initial static states:

- [ ] `assets/gameplay/entities/monster_ghost_mint_idle_01.png`
- [ ] `assets/gameplay/entities/monster_demon_pink_idle_01.png`
- [ ] `assets/gameplay/entities/monster_blob_yellow_idle_01.png`
- [ ] `assets/gameplay/entities/chest_closed_01.png`

Create additional gameplay entities only when supported by existing mechanics:

- [ ] `assets/gameplay/entities/door_closed_01.png`
- [ ] `assets/gameplay/entities/door_open_01.png`
- [ ] `assets/gameplay/entities/blocker_01.png`

### A5. Gameplay buttons

NineSlice-compatible bases:

- [ ] `assets/ui/buttons/button_primary_base.png`
- [ ] `assets/ui/buttons/button_secondary_base.png`
- [ ] `assets/ui/buttons/button_danger_base.png`
- [ ] `assets/ui/buttons/button_small_base.png`
- [ ] `assets/ui/buttons/button_icon_base.png`

Only create separate pressed/disabled raster states when runtime tint/scale/alpha cannot reproduce the desired result cleanly.

Possible explicit states:

- [ ] `button_primary_pressed.png`
- [ ] `button_primary_disabled.png`
- [ ] `button_secondary_pressed.png`
- [ ] `button_secondary_disabled.png`
- [ ] `button_danger_pressed.png`
- [ ] `button_danger_disabled.png`

### A6. Core gameplay icons

- [ ] `assets/ui/icons/icon_back.png`
- [ ] `assets/ui/icons/icon_menu.png`
- [ ] `assets/ui/icons/icon_undo.png`
- [ ] `assets/ui/icons/icon_reset.png`
- [ ] `assets/ui/icons/icon_hint.png`
- [ ] `assets/ui/icons/icon_play.png`
- [ ] `assets/ui/icons/icon_check.png`
- [ ] `assets/ui/icons/icon_lock.png`
- [ ] `assets/ui/icons/icon_question.png`

### A7. Shared scene background

Gameplay and meta screens use the same background family. Do not create a separate gameplay background.

Required first pass:

- [ ] `assets/backgrounds/meta/bg_meta_desktop.png`
- [ ] `assets/backgrounds/meta/bg_meta_mobile.png`

Optional modular decoration after the first in-game review:

- [ ] `decor_left_arch.png`
- [ ] `decor_right_arch.png`
- [ ] `banner_left_crown.png`
- [ ] `banner_right_skull.png`
- [ ] `torch_left.png`
- [ ] `torch_right.png`
- [ ] `decor_bottom_left_chest.png`
- [ ] `decor_bottom_left_skull.png`
- [ ] `decor_bottom_right_shadow_monster.png`
- [ ] `decor_plants_set_01.png`

### A8. Gameplay Core acceptance gate

Before starting Pack B:

- [ ] Board remains the dominant central object.
- [ ] Clue numbers are readable at desktop and target mobile size.
- [ ] WALL and FLOOR states cannot be confused.
- [ ] Monsters/chest read clearly at cell size.
- [ ] Hint/conflict states are obvious.
- [ ] Buttons work with live text.
- [ ] Background does not reduce puzzle readability.
- [ ] Gameplay screen is reviewed in the actual running game.

---

## 7. PACK B — Meta UI

Goal: apply the approved visual language to Home, Levels, Daily, Statistics, Settings, and Tutorial/How to Play.

### B1. Panels

NineSlice-compatible where practical:

- [ ] `assets/ui/panels/panel_large_base.png`
- [ ] `assets/ui/panels/panel_medium_base.png`
- [ ] `assets/ui/panels/panel_small_base.png`
- [ ] `assets/ui/panels/panel_modal_base.png`
- [ ] `assets/ui/panels/panel_highlight_base.png`
- [ ] `assets/ui/panels/panel_danger_base.png`

### B2. Level cards

Prefer a base + overlays instead of complete duplicated cards.

- [ ] `assets/meta/level_card/level_card_base.png`
- [ ] `assets/meta/level_card/level_card_active_overlay.png`
- [ ] `assets/meta/level_card/level_card_started_overlay.png`
- [ ] `assets/meta/level_card/level_card_solved_overlay.png`
- [ ] `assets/meta/level_card/level_card_locked_overlay.png`

The puzzle drawing inside the card is runtime-rendered, not baked into these assets.

### B3. Daily calendar

Reuse level-card language.

- [ ] `assets/meta/calendar/calendar_today_highlight.png`
- [ ] `assets/meta/calendar/calendar_future_overlay.png`
- [ ] `assets/meta/calendar/calendar_completed_badge.png`

The calendar preview itself is runtime-rendered using the shared miniature renderer.

### B4. Meta icons

- [ ] `assets/ui/icons/icon_levels.png`
- [ ] `assets/ui/icons/icon_daily.png`
- [ ] `assets/ui/icons/icon_statistics.png`
- [ ] `assets/ui/icons/icon_settings.png`
- [ ] `assets/ui/icons/icon_rules.png`
- [ ] `assets/ui/icons/icon_book.png`
- [ ] `assets/ui/icons/icon_music.png`
- [ ] `assets/ui/icons/icon_sound.png`
- [ ] `assets/ui/icons/icon_vibration.png`
- [ ] `assets/ui/icons/icon_language.png`
- [ ] `assets/ui/icons/icon_calendar_prev.png`
- [ ] `assets/ui/icons/icon_calendar_next.png`
- [ ] `assets/ui/icons/icon_home.png`
- [ ] `assets/ui/icons/icon_tutorial.png`
- [ ] `assets/ui/icons/icon_crown.png`
- [ ] `assets/ui/icons/icon_chest.png`
- [ ] `assets/ui/icons/icon_skull.png`

### B5. Shared meta background

The same meta background is used on gameplay screens as well.

First pass:

- [ ] `assets/backgrounds/meta/bg_meta_desktop.png`
- [ ] `assets/backgrounds/meta/bg_meta_mobile.png`

Optional modular pieces:

- [ ] `decor_arch_left.png`
- [ ] `decor_arch_right.png`
- [ ] `decor_banner_crown.png`
- [ ] `decor_banner_skull.png`
- [ ] `decor_torch_left.png`
- [ ] `decor_torch_right.png`
- [ ] `decor_ghost_left.png`
- [ ] `decor_shadow_right.png`
- [ ] `decor_plants_misc.png`
- [ ] `decor_floor_stones.png`

### B6. Screen integration order

- [ ] Home
- [ ] Levels
- [ ] Daily
- [ ] Gameplay menu modal
- [ ] Settings
- [ ] Statistics
- [ ] Tutorial / How to Play

### B7. Meta acceptance gate

- [ ] Home uses current product structure, not old Archive/Manuscript concepts.
- [ ] Levels keeps the 64-level 8×8 desktop structure.
- [ ] Level preview states match real saved progress.
- [ ] Daily month view remains usable after many months.
- [ ] Daily future dates reveal no puzzle geometry.
- [ ] Navigation remains obvious with the final art applied.
- [ ] All screens feel like one UI system.

---

## 8. PACK C — Animation & FX

Goal: add life and solve payoff without creating an expensive animation pipeline.

### C1. Monster animation

Minimum recommended frames per monster:

#### Mint ghost

- [ ] `monster_ghost_mint_idle_01.png`
- [ ] `monster_ghost_mint_idle_02.png`
- [ ] `monster_ghost_mint_blink_01.png`
- [ ] `monster_ghost_mint_react_01.png`
- [ ] `monster_ghost_mint_react_02.png`

#### Pink demon

- [ ] `monster_demon_pink_idle_01.png`
- [ ] `monster_demon_pink_idle_02.png`
- [ ] `monster_demon_pink_blink_01.png`
- [ ] `monster_demon_pink_react_01.png`
- [ ] `monster_demon_pink_react_02.png`

#### Yellow creature

- [ ] `monster_blob_yellow_idle_01.png`
- [ ] `monster_blob_yellow_idle_02.png`
- [ ] `monster_blob_yellow_blink_01.png`
- [ ] `monster_blob_yellow_react_01.png`
- [ ] `monster_blob_yellow_react_02.png`

If the result works with fewer frames, prefer fewer frames plus tweens.

### C2. Chest animation

- [ ] `chest_closed_01.png`
- [ ] `chest_opening_01.png`
- [ ] `chest_opening_02.png`
- [ ] `chest_opening_03.png`
- [ ] `chest_open_01.png`

Optional FX:

- [ ] `fx_chest_glow_01.png`
- [ ] `fx_chest_glow_02.png`
- [ ] `fx_sparkle_01.png`
- [ ] `fx_sparkle_02.png`
- [ ] `fx_sparkle_03.png`

### C3. Torch animation

Optional polish:

- [ ] `torch_flame_01.png`
- [ ] `torch_flame_02.png`
- [ ] `torch_flame_03.png`
- [ ] `torch_flame_04.png`

### C4. UI / solve effects

Only add effects that improve feedback:

- [ ] `fx_hint_pulse_01.png`
- [ ] `fx_solved_flash_01.png`
- [ ] `fx_tile_pop_01.png`
- [ ] `fx_reward_burst_01.png`

### C5. Solve animation implementation target

Use asset frames + engine tweens.

Target sequence:

```text
final correct action
→ 150–250 ms pause
→ soft board success pulse
→ monster reaction
→ chest bounce/open
→ glow/sparkles
→ solved result line
→ continue action
```

Recommended tween effects:

- bounce `6–12 px`;
- squash/stretch;
- tiny rotation;
- scale pulse;
- alpha pulse.

Do not create long frame-by-frame cinematics.

---

## 9. FIRST BATCH — immediate production milestone

Produce these assets before anything else:

### Board

- [ ] `tile_floor_base.png`
- [ ] `tile_wall_base.png`
- [ ] `tile_clue_base.png`
- [ ] `marker_floor.png`

### Entities

- [ ] `monster_ghost_mint_idle_01.png`
- [ ] `monster_demon_pink_idle_01.png`
- [ ] `monster_blob_yellow_idle_01.png`
- [ ] `chest_closed_01.png`

### Buttons

- [ ] `button_primary_base.png`
- [ ] `button_secondary_base.png`
- [ ] `button_danger_base.png`

### Icons

- [ ] `icon_back.png`
- [ ] `icon_menu.png`
- [ ] `icon_undo.png`
- [ ] `icon_reset.png`
- [ ] `icon_hint.png`

### Background

- [ ] `bg_meta_desktop.png`
- [ ] `bg_meta_mobile.png`

### First Batch done when

- [ ] Every asset above has been generated/redrawn as a standalone production asset.
- [ ] No text is baked into button assets.
- [ ] Gameplay Core has been integrated into the real game.
- [ ] Desktop screenshot reviewed.
- [ ] Landscape mobile screenshot reviewed.
- [ ] Readability problems fixed before producing the full meta pack.

## 10. Generation workflow

For each logical family:

1. Use approved concept screens only as style references.
2. Generate/redraw the family as standalone assets.
3. Check transparency, padding, alignment, and scale.
4. Normalize family members so they share line weight and material language.
5. Integrate into the actual game.
6. Review at real display size.
7. Only then mark the asset complete.

Recommended family order for the First Batch:

```text
1. tiles + marker
2. monsters
3. chest
4. buttons
5. core icons
6. shared meta background
7. in-game integration
8. corrections
```

## 11. Definition of done for an asset

An asset may be checked off only when:

- [ ] correct filename/path is used;
- [ ] transparent background is clean where required;
- [ ] no unintended baked text exists;
- [ ] silhouette reads at target size;
- [ ] style matches `VISUAL_STYLE_GUIDE.md`;
- [ ] it has been tested in the running game;
- [ ] it still works on the target mobile layout;
- [ ] there is no obvious need to regenerate it before the next production stage.
