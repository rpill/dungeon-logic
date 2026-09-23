# Dungeon Logic — UI Art Direction: Soft Dungeon Fantasy

## 1. Core direction

Dungeon Logic is a cute puzzle game set in a cozy dark dungeon. The UI must feel like part of the same world as the board, monsters and chest.

**Primary style:** soft painted dungeon fantasy.

The UI is **not** metal, sci-fi, industrial or armored. It should look like softly carved/painted dungeon stone and dark magical slate, with rounded shapes and warm accents.

## 2. Visual pillars

1. **Cute before hardcore** — the monsters and board define the emotional tone.
2. **Soft before sharp** — rounded corners, gentle bevels, low-contrast edges.
3. **Matte before glossy** — avoid metallic shine, chrome and hard specular highlights.
4. **Simple before ornate** — the UI supports the puzzle instead of competing with it.
5. **Warm accents on cool surfaces** — gold/yellow for important actions, cream for text.

## 3. Material language

### Allowed
- painted blue stone
- soft slate
- carved dungeon slabs
- slightly worn hand-painted surfaces
- subtle chips/cracks only when they do not dominate
- soft inner shadows
- low-contrast edge lighting

### Forbidden
- brushed metal
- chrome / steel
- bright cyan rim light
- hard beveled armor plates
- thick sci-fi frames
- glossy glass capsules
- oversized bolts/rivets
- metallic gradients

## 4. Color system

### Background
- Deep dungeon navy: `#0D1127`
- Soft indigo: `#121D3A`
- Overlay dark: `#070B19`

### Surfaces
- Deep inset: `#14223A`
- Base painted stone: `#223655`
- Raised stone: `#30496E`
- Soft highlight: `#45628A`

### Borders / edges
- Dark edge: `#182A43`
- Normal edge: `#58739A`
- Soft light edge: `#8299B8`

### Text
- Primary warm cream: `#F7EFD8`
- Secondary cool cream: `#CED5E3`
- Muted: `#98A6BC`

### Semantic accents
- Gold: `#F0B84C`
- Gold light: `#F4CA68`
- Success teal: `#72C9B5`
- Danger coral: `#C96A75`

## 5. Surface hierarchy

### A. Shell panel
Used for major blocks: Home cards, Mastery, Daily info, Settings body, Leaderboard body.

Rules:
- matte dark-blue painted stone
- soft rounded corners
- thin edge highlight
- optional tiny chips/cracks
- no heavy outer rim
- no glow around the whole panel
- decoration must stay weaker than content

### B. Inset row
Used for Mastery tasks, settings rows, leaderboard entries and status rows.

Rules:
- flat dark inset
- small radius
- thin low-contrast border
- no asset required
- no bolts
- no bevel stack

### C. Control surface
Buttons, switches, compact HUD elements.

Rules:
- clean shape
- one material layer
- no decorative framing around controls

## 6. Buttons

### Primary
- warm gold/yellow
- soft painted surface
- rounded, not pill-shaped unless compact
- dark navy text/icon
- subtle pressed depth, not shine

### Secondary
- dark blue painted stone
- thin soft border
- cream text

### Danger
- muted coral/red
- same shape family as secondary
- never bright neon red

## 7. Modal family

Modals are **lighter and simpler than page panels**.

### Compact modal
- dark soft-stone slab
- thin border
- minimal decoration
- weak shadow
- content dominates frame

### Tall reward modal
- same material family
- slightly more decorative
- emphasis goes to rank/seal/reward, not frame

### Tutorial/info panel
- simple inset surface
- no heavy shell
- no bolts/rivets
- readable first, decorative second

## 8. Mastery-specific direction

The current glossy/metallic large shell is rejected.

Mastery main panel should be:
- darker
- flatter
- matte
- thinner-framed
- closer to Home cards
- visually quiet enough that task rows and progress are the focus

The rank seal can stay more precious and metallic/golden because it is a **reward object**, not generic UI material.

This is the only place where metal/gold can be prominent: the collectible emblem itself.

## 9. Gameplay HUD

The board is the visual hero.

HUD rules:
- compact
- dark soft-stone surfaces
- no metal chrome
- no bright blue rim
- controls visually secondary to the board
- reset danger remains muted coral
- hint action may use warm gold/cream accent

## 10. Shape rules

Prefer:
- 10–18 px corner radius on large panels
- 6–12 px on rows/controls
- broad simple silhouettes
- soft edge bevels

Avoid:
- razor-sharp corners
- stacked frames
- double/triple borders
- excessive ornament

## 11. Texture rules

Texture strength should be low.

Good:
- 3–8% tonal variation
- rare chips/cracks
- subtle painterly noise

Bad:
- texture more visible than text
- repeated rock pattern
- high-frequency scratches
- metallic glare

## 12. Typography relationship

Typography remains simple and readable.

- scene titles: warm cream
- card titles: cream / gold only when selected or special
- body: cream
- secondary: cool muted
- gold is not a generic text color

## 13. Background relationship

UI must separate from the dungeon background without becoming brighter than the board.

Rules:
- major surfaces should be one clear tonal step lighter than the local background
- central content area may receive a subtle dark wash
- no strong glow behind ordinary panels
- bright background props stay away from text-heavy areas

## 14. Allowed exception: reward objects

The following may use stronger metal/gold treatment:
- Mastery seals
- rank-up medal/emblem
- special achievement badges

This exception does **not** extend to generic panels, buttons or HUD frames.

## 15. Do / Don't

### Do
- match the softness of the board tiles
- reuse one surface family across screens
- keep frames quieter than content
- use gold sparingly
- use dark matte blue as the default UI material

### Don't
- use steel/chrome as generic UI
- add cyan glow for readability
- make every panel a collectible artifact
- add large bolts/rivets everywhere
- stretch horizontal cards into large shells
- solve contrast by making borders brighter and thicker

## 16. Migration priority

1. Mastery main panel
2. Gameplay HUD/header
3. Home cards polish
4. Daily
5. Settings
6. Leaderboard
7. Modals
8. Victory panels
9. Tutorial/info surfaces

## 17. Acceptance test

A screen passes the art-direction check if:
- it looks like the same game as the board and monsters
- no generic UI surface reads as metal/chrome
- the board or page content is visually more important than the frame
- text is readable without bright rim lighting
- gold is used only for primary/special states
- desktop and mobile use the same material language

