# Dungeon Logic — Visual Style Guide

> **Status:** production style anchor  
> **Purpose:** define how Dungeon Logic should look across gameplay and meta screens.  
> **Related document:** `docs/visual/ASSET_PRODUCTION_PLAN.md`

## 1. Source of truth

The approved concepts are **style anchors**, not layout specifications and not sprite sheets.

They define:

- the visual language;
- palette and lighting;
- character style;
- material language;
- UI weight and proportions;
- the balance between atmosphere and gameplay readability.

They **must not be cut apart and used as final production assets**.

The current game implementation is the source of truth for product structure and navigation. If an older concept contains an outdated screen, label, mode, chapter, manuscript, or archive structure, preserve the **style**, not the obsolete product structure.

Recommended reference placement:

```text
docs/visual/references/
  home.png
  levels.png
  gameplay.png
  daily.png
  settings.png
  statistics.png
```

## 2. Locked visual direction

The following direction is considered **LOCKED** unless there is a clear gameplay/readability problem.

### 2.1. Overall mood

Dungeon Logic is a dark, cozy cartoon dungeon rather than horror.

The target feeling is:

- mysterious;
- warm despite the dark environment;
- playful;
- readable;
- slightly whimsical;
- not childish;
- not glossy;
- not realistic;
- not highly detailed.

The dungeon atmosphere must support the puzzle, never compete with it.

### 2.2. Environment

Core environment language:

- deep navy / indigo background;
- large simplified stone arches and blocks;
- burgundy hanging banners;
- warm orange torchlight;
- sparse plants, bones, chests, shadows, and small dungeon props;
- strong dark vignette near the edges;
- quieter central region behind gameplay/UI.

Background decoration should be concentrated around screen edges.

The center of gameplay screens must remain visually calm.

### 2.3. Materials

Use simplified, soft, readable materials:

- stone: chunky, matte, slightly irregular;
- dark UI panels: blue-black / slate, matte;
- wall tiles: warm sand / stone;
- banners: muted burgundy cloth;
- gold: warm yellow-gold, never metallic chrome;
- danger/action red: coral / warm red;
- ghosts/monsters: flat-soft cartoon material with minimal shading.

Avoid:

- photoreal texture;
- excessive noise;
- strong glossy highlights;
- tiny surface scratches everywhere;
- high-frequency detail that disappears on mobile.

## 3. Palette

Exact production hex values should be sampled and finalized when the first gameplay asset batch is integrated.

Until then, use these **role-based color groups**:

| Role | Direction |
|---|---|
| Background | very dark navy / indigo |
| UI surface | dark slate blue |
| UI border | muted blue-grey |
| Primary text | warm cream |
| Secondary text | cool desaturated grey-blue |
| Primary accent | warm gold |
| Danger / reset / error | coral red |
| Wall / solid cell | warm sand / stone |
| Banner | burgundy / wine red |
| Friendly creature | mint / turquoise |
| Hostile creature | pink / magenta |
| Third creature | warm yellow / orange |
| Success | mint-green / soft green |

### Accent discipline

Gold is reserved for:

- primary CTA;
- current selection;
- today's Daily;
- important focus;
- premium-feeling highlight.

Coral red is reserved for:

- danger;
- reset;
- conflict;
- destructive action;
- monster accent where appropriate.

Do not use every accent on every screen.

## 4. Typography

### 4.1. Status

**PROVISIONAL production choice:** `Rubik`.

Do not treat this as permanently locked until it has been tested inside the real game at target sizes.

Recommended weights:

- screen titles: `Rubik ExtraBold` or `Bold`;
- buttons: `Rubik Bold` / `SemiBold`;
- secondary copy: `Rubik Medium`;
- numbers and timers: `Rubik SemiBold` / `Bold`.

### 4.2. Mandatory typography test strings

Before locking the font, validate:

```text
УРОВНИ
DAILY
ПРОДОЛЖИТЬ
УРОВЕНЬ 7 / 64
ПОДСКАЗКА ×3
БЕЗ ПОДСКАЗОК
КАК ИГРАТЬ
00:52
0123456789
```

The font must remain clear on desktop and mobile.

Do not bake interface text into PNG assets.

## 5. Gameplay readability rules

Gameplay always wins over decoration.

### 5.1. Board

The puzzle board must be the highest-contrast functional object in the central area.

Requirements:

- row and column clue numbers are immediately readable;
- monsters and chest are recognizable at a glance;
- WALL and FLOOR states cannot be confused;
- hint/conflict states are distinguishable without relying only on subtle color differences;
- decorative background never crosses or visually merges with the board.

### 5.2. Mini previews

Level and Daily previews use the same miniature renderer language.

Rules already established by the product:

- no internal cell grid on the miniature;
- neighboring wall cells visually merge into continuous shapes;
- completed puzzle → show the correct solution walls;
- started but incomplete → show the player's saved walls;
- never started → show `?`, no puzzle spoiler;
- FLOOR helper marks are not shown;
- level/day number is shown outside/below the miniature;
- incomplete previews may use a light desaturated/whitish veil;
- completed previews use normal full color.

## 6. Characters and objects

### 6.1. Creature language

Creatures should be:

- simple silhouettes;
- large readable face features;
- minimal internal detail;
- slightly rounded;
- expressive through pose and eyes;
- readable at board-cell size.

Avoid complex anatomy or tiny accessories.

Current language:

- mint/turquoise ghost;
- pink/magenta demon-like creature;
- warm yellow/orange third creature;
- additional monsters may follow the same construction rules.

### 6.2. Chest

The chest is a key reward object and should be visually more important than incidental props.

It needs:

- clear closed state;
- clear opening motion;
- clear open state;
- optional warm glow/sparkles on solve.

## 7. UI component language

### 7.1. Buttons

Buttons should use:

- dark slate body;
- warm cream label;
- simple border;
- gold for primary/focused action;
- coral for destructive/reset action;
- restrained corner decoration;
- modest depth, not glossy bevels.

Text remains live UI text.

Use NineSlice-compatible bases whenever practical.

### 7.2. Panels and cards

Panels should:

- be darker than the gameplay board;
- use subtle borders;
- have soft, slightly irregular dungeon-stone/crafted details;
- avoid excessive ornamental corners;
- support large readable typography.

### 7.3. Icons

Icons should:

- use one consistent stroke/shape language;
- be flat and readable;
- avoid mixing unrelated emoji/Unicode glyph styles;
- work at 24–64 px display sizes;
- preferably be produced from a larger master.

## 8. Screen-specific direction

### Home

Current product structure, not old Archive/Manuscript concepts.

Visual priorities:

1. Dungeon Logic logo/title.
2. Continue.
3. Daily.
4. Levels.
5. Statistics.
6. Settings.
7. Tutorial / How to Play as secondary navigation.

Progress copy should reflect the actual `X / 64` structure.

### Levels

- 64 levels;
- desktop/landscape target: 8 × 8 grid;
- compact preview cards;
- level numbers below cards;
- solved/started/unknown states as defined above;
- three frontier levels may be playable according to current progression logic;
- direct one-click route back to Home;
- Continue Level N remains prominent.

### Daily

- Today panel at the top;
- month calendar below;
- 7 columns;
- month navigation;
- preview states use the same miniature language as Levels;
- future dates are locked and do not reveal puzzle geometry;
- old Daily puzzles launch outside current-day ranking according to product logic.

### Gameplay

- board centered and dominant;
- `УРОВЕНЬ N / 64` or Daily title above;
- timer secondary;
- one `МЕНЮ` entry point;
- bottom actions: undo, reset, hint;
- the screen edge contains most environmental decoration;
- solve animation must not obscure puzzle feedback.

### Settings / Statistics

Reuse the same:

- background;
- panel language;
- title treatment;
- button treatment;
- icon family.

Do not invent a separate visual style per screen.

## 9. Animation language

Animation should be short, charming, and inexpensive to produce.

Use a combination of:

- 2–4 key sprite frames;
- engine tweens;
- squash/stretch;
- small bounce;
- short rotation;
- alpha pulse;
- simple particles.

Avoid long cinematic sequences.

### Solve sequence target

1. Player places the final correct wall.
2. Pause approximately `0.15–0.25 s`.
3. Board gives a soft success response.
4. Monsters react with a short bounce/blink/squash.
5. Chest opens.
6. Glow/sparkle effect plays.
7. Solved status and result UI appear.
8. Continue action becomes available.

## 10. Detail budget

The project must remain practical for a small production.

Prefer:

- reusable assets;
- modular decoration;
- shared panel/button bases;
- tween-driven animation;
- short sprite sequences;
- one coherent icon family.

Avoid:

- unique hand-painted button for every label;
- unique background for every screen;
- 20-frame character animations;
- excessive particle effects;
- per-level bespoke artwork;
- visual details invisible at target resolution.

## 11. Final acceptance rule

A visual asset is successful only if it works **inside the real game**.

A concept render alone does not prove that:

- clues are readable;
- states are distinct;
- mobile scale works;
- the board remains dominant;
- the asset stretches correctly;
- animation timing feels good.

Every asset batch must be integrated and reviewed in the running game before the next large batch is produced.
