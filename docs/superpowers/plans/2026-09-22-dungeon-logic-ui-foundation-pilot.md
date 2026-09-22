# Dungeon Logic UI Foundation + Pilot Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one typed UI design system for Dungeon Logic, then prove it by migrating Home, Mastery, and Gameplay chrome without changing the puzzle board, game rules, or background art.

**Architecture:** Add a small `src/ui/` layer that owns semantic color, typography, spacing, density, surface, button, progress, header, badge, and modal primitives. Existing scene-specific renderers remain as compatibility adapters where that avoids risky rewrites, but their colors/sizing must come from the new theme. The first migration deliberately covers one meta hub (Home), one data-heavy meta screen (Mastery), and gameplay chrome; all remaining screens are deferred to the next plan.

**Tech Stack:** Phaser 4.2.1, TypeScript 6, Vite 8, Node sanity scripts, existing NineSlice assets and current UI raster assets.

**Spec:** `docs/superpowers/specs/2026-09-22-dungeon-logic-ui-system.md`

## Global Constraints

- Keep the existing dungeon background art unchanged.
- Keep the puzzle board, monsters, puzzle rules, campaign/daily/endless logic, saves, analytics, audio, and platform integrations unchanged.
- Mobile target is portrait only.
- Desktop must remain usable at 640–650 px viewport height and scale smoothly above that; do not introduce one-off scene breakpoints for visual styling.
- New standard UI colors, font sizes, spacing, border colors, and semantic states must come from `src/ui/UiTheme.ts`, not new literals inside scenes.
- Gold means primary action/current/selected; teal means success/complete; red means destructive action only; gameplay red/orange marks remain outside the UI semantic palette.
- User-facing text must not render below 10 px; `meta` is 11–12 px on desktop and 10–11 px on mobile.
- NineSlice is allowed for shell/modal/card families. Inset rows must be programmatic, without bolts or stone assets.
- Do not generate or add new raster UI art in this plan. Reuse the current approved Home/card/button/modal assets.
- Preserve existing adaptive Mastery height-fit logic; this plan changes its styling inputs, not its fit algorithm.
- Preserve existing button hover/pressed/touch behavior and UI audio feedback.
- Each task uses TDD: write/extend the sanity first, observe RED for the intended reason, implement minimally, run GREEN, then commit.

## Review Focus

1. **Low desktop height (`1920×640` and `1920×650`)** — Home, Mastery, and Gameplay chrome must remain fully visible without overlap; Task 1 pins density selection and Task 8 performs visual acceptance.
2. **Portrait phone (`360–430 px` width, height greater than width)** — density must always resolve to `mobile`, controls must keep readable text, and no desktop-only spacing may leak in; Tasks 1, 4, and 8 own this.
3. **Long RU/EN copy** — scene headers, buttons, rank titles, and gameplay title labels must fit or shrink only within the allowed typography floor; Tasks 2, 4, 6, and 7 own this.
4. **Disabled/locked/selected states** — semantic color must remain distinguishable from the background and from each other without inventing new colors; Tasks 3, 4, 5, and 6 own this.
5. **Live resize / safe area / touch hover cleanup** — the common density/components must not regress current resize, HiDPI, or touch pointer behavior; Tasks 4, 7, and 8 rerun the existing relevant sanities.

---

## File Structure Locked by This Plan

### New files

- `src/ui/UiTheme.ts` — palette, spacing, radii, typography sizes, semantic tokens.
- `src/ui/UiDensity.ts` — single resolver for `comfortable | compact | mobile`.
- `src/ui/UiText.ts` — typed Phaser text-style builder from theme roles.
- `src/ui/UiSceneHeader.ts` — scene and section headers using the approved cream/gold hierarchy.
- `src/ui/UiPanel.ts` — non-interactive Level-1 shell wrapper using the approved Home-style surface family.
- `src/ui/UiInsetRow.ts` — Level-2 programmatic dark inset row.
- `src/ui/UiStatusBadge.ts` — small status/data capsule using Level-2 styling.
- `src/ui/UiButton.ts` — semantic wrapper over the current primary/secondary/danger button implementations.
- `src/ui/UiProgressBar.ts` — shared theme-driven progress bar.
- `src/ui/UiModal.ts` — standard veil + content bounds around the current `ModalPanel` renderer.
- `scripts/ui-theme-density-sanity.mjs`
- `scripts/ui-text-header-sanity.mjs`
- `scripts/ui-surfaces-sanity.mjs`
- `scripts/ui-controls-sanity.mjs`
- `scripts/ui-modal-sanity.mjs`
- `scripts/ui-home-migration-sanity.mjs`
- `scripts/ui-mastery-migration-sanity.mjs`
- `scripts/ui-gameplay-migration-sanity.mjs`
- `scripts/ui-pilot-acceptance-sanity.mjs`

### Existing files intentionally modified

- `package.json` — add one aggregate `sanity:ui-system` command after all UI sanity scripts exist.
- `src/runtime/PrimaryActionButton.ts` — consume theme text/tint tokens; preserve public API and assets.
- `src/runtime/MaterialActionButton.ts` — consume theme secondary/danger tokens; preserve public API and pointer/audio behavior.
- `src/runtime/MasteryProgressBar.ts` — compatibility wrapper around `UiProgressBar` so non-pilot screens keep working.
- `src/runtime/ModalPanel.ts` — remain the art renderer; `UiModal` owns semantic veil/padding/content bounds.
- `src/runtime/MasteryStrip.ts` — Home mastery strip uses theme typography/colors/density.
- `src/runtime/HomeHubModeCard.ts` — keep existing assets/states; replace standard text/state constants only if still present here.
- `src/runtime/PuzzleHeaderUiAssets.ts` — preserve function names but render title/status surfaces from common UI components instead of a separate purple visual language.
- `src/scenes/HomeScene.ts` — migrate standard colors, typography, primary CTA, progress, and spacing to common UI.
- `src/scenes/MasteryScene.ts` — migrate shell/rows/header/progress/text to common UI while retaining seal and adaptive layout logic.
- `src/scenes/GameScene.ts` — migrate standard gameplay chrome colors/header/HUD styling only; board/gameplay rendering stays untouched.
- `src/scenes/BootScene.ts` — only if a common renderer requires an existing asset preload to move; no new art in this plan.

### Compatibility files deliberately not deleted in this plan

- `src/runtime/MasteryRequirementPanel.ts`
- `src/runtime/MasteryRequirementRowPanel.ts`
- existing legacy header/modal assets

They may become unused by the three pilot screens, but removal belongs to a later cleanup after all remaining screens migrate. This keeps the pilot reversible and avoids unrelated breakage.

---

### Task 1: Theme Tokens and One Density Resolver

**Files:**
- Create: `src/ui/UiTheme.ts`
- Create: `src/ui/UiDensity.ts`
- Create: `scripts/ui-theme-density-sanity.mjs`

**Interfaces:**
- Produces: `UI_THEME`, `UiDensity`, `resolveUiDensity(width, height)`, `uiColorHex(color)`.
- Consumes: nothing from later tasks.

- [ ] **Step 1: Write the failing theme/density sanity**

Create `scripts/ui-theme-density-sanity.mjs`:

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const themePath = resolve(root, 'src/ui/UiTheme.ts');
const densityPath = resolve(root, 'src/ui/UiDensity.ts');

const theme = readFileSync(themePath, 'utf8');
const density = readFileSync(densityPath, 'utf8');

for (const token of [
  '0x0d1127', '0x121d3a', '0x070b19',
  '0x0f2039', '0x1b2a4d', '0x2f4b69', '0x3c5887',
  '0x18314f', '0x536c94', '0x7894ba',
  '0xf8f1da', '0xcbd3e0', '0x8e9bb4', '0x66738d',
  '0xefb146', '0xeec358', '0x71cdb8', '0xc86672', '0xe7954b',
]) {
  assert(theme.toLowerCase().includes(token), `UiTheme must contain ${token}.`);
}

assert(theme.includes('spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 }'), 'UiTheme must expose the approved spacing scale.');
assert(theme.includes("meta: { comfortable: 12, compact: 11, mobile: 10 }"), 'Meta typography must respect the 10px floor.');
assert(density.includes("export type UiDensity = 'comfortable' | 'compact' | 'mobile';"), 'Density type must have exactly three modes.');
assert(density.includes('viewportWidth < 700 && viewportHeight >= viewportWidth'), 'Portrait phone detection must be explicit.');
assert(density.includes('viewportHeight <= 800'), 'Low desktop must resolve through the shared compact threshold.');

console.info('[Dungeon Logic] UI theme + density sanity: PASS');
```

- [ ] **Step 2: Run the sanity and verify RED**

Run:

```bash
node scripts/ui-theme-density-sanity.mjs
```

Expected: FAIL because `src/ui/UiTheme.ts` and `src/ui/UiDensity.ts` do not exist yet.

- [ ] **Step 3: Implement `UiTheme.ts`**

Create `src/ui/UiTheme.ts`:

```ts
export const UI_THEME = {
  colors: {
    background: {
      deep: 0x0d1127,
      blue: 0x121d3a,
      overlay: 0x070b19,
    },
    surface: {
      inset: 0x0f2039,
      base: 0x1b2a4d,
      raised: 0x2f4b69,
      highlight: 0x3c5887,
    },
    border: {
      dark: 0x18314f,
      normal: 0x536c94,
      bright: 0x7894ba,
    },
    text: {
      primary: 0xf8f1da,
      secondary: 0xcbd3e0,
      muted: 0x8e9bb4,
      disabled: 0x66738d,
    },
    semantic: {
      gold: 0xefb146,
      goldBright: 0xeec358,
      success: 0x71cdb8,
      danger: 0xc86672,
      warning: 0xe7954b,
    },
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 },
  radius: { small: 8, medium: 12, large: 16 },
  typography: {
    display: { comfortable: 34, compact: 28, mobile: 24 },
    heading: { comfortable: 24, compact: 21, mobile: 19 },
    bodyStrong: { comfortable: 17, compact: 16, mobile: 15 },
    body: { comfortable: 15, compact: 14, mobile: 13 },
    meta: { comfortable: 12, compact: 11, mobile: 10 },
  },
} as const;

export type UiTheme = typeof UI_THEME;

export function uiColorHex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}
```

- [ ] **Step 4: Implement `UiDensity.ts`**

Create `src/ui/UiDensity.ts`:

```ts
export type UiDensity = 'comfortable' | 'compact' | 'mobile';

export function resolveUiDensity(viewportWidth: number, viewportHeight: number): UiDensity {
  if (!Number.isFinite(viewportWidth) || !Number.isFinite(viewportHeight) || viewportWidth <= 0 || viewportHeight <= 0) {
    throw new RangeError('Viewport dimensions must be positive finite numbers.');
  }

  if (viewportWidth < 700 && viewportHeight >= viewportWidth) return 'mobile';
  if (viewportHeight <= 800) return 'compact';
  return 'comfortable';
}
```

- [ ] **Step 5: Add a behavior-level density test and run it**

Append to `scripts/ui-theme-density-sanity.mjs` a subprocess import using Node's type stripping, or create a tiny TS sanity script `src/dev/uiDensitySanity.ts` with these assertions:

```ts
import { resolveUiDensity } from '../ui/UiDensity';

const cases = [
  [1920, 1080, 'comfortable'],
  [1920, 800, 'compact'],
  [1920, 650, 'compact'],
  [390, 844, 'mobile'],
  [430, 932, 'mobile'],
] as const;

for (const [width, height, expected] of cases) {
  const actual = resolveUiDensity(width, height);
  if (actual !== expected) throw new Error(`${width}x${height}: expected ${expected}, got ${actual}`);
}
```

Run:

```bash
npx tsx src/dev/uiDensitySanity.ts
node scripts/ui-theme-density-sanity.mjs
```

Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/UiTheme.ts src/ui/UiDensity.ts src/dev/uiDensitySanity.ts scripts/ui-theme-density-sanity.mjs
git commit -m "feat: add shared UI theme and density"
```

---

### Task 2: Typography and Header Primitives

**Files:**
- Create: `src/ui/UiText.ts`
- Create: `src/ui/UiSceneHeader.ts`
- Create: `scripts/ui-text-header-sanity.mjs`

**Interfaces:**
- Consumes: `UI_THEME`, `uiColorHex`, `UiDensity`.
- Produces: `UiTextRole`, `createUiTextStyle(role, density, options?)`, `createUiSceneHeader(scene, options)`, `createUiSectionHeader(scene, options)`.

- [ ] **Step 1: Write failing sanity**

Create `scripts/ui-text-header-sanity.mjs`:

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const text = readFileSync(resolve(root, 'src/ui/UiText.ts'), 'utf8');
const header = readFileSync(resolve(root, 'src/ui/UiSceneHeader.ts'), 'utf8');

assert(text.includes("export type UiTextRole = 'display' | 'heading' | 'bodyStrong' | 'body' | 'meta';"), 'UiText roles must match the spec.');
assert(text.includes('UI_THEME.typography[role][density]'), 'Text sizes must come from UiTheme.');
assert(text.includes("fontFamily: 'monospace'"), 'UI typography must retain the game font family.');
assert(header.includes('createUiSceneHeader'), 'Scene header primitive must exist.');
assert(header.includes('createUiSectionHeader'), 'Section header primitive must exist.');
assert(header.includes('UI_THEME.colors.semantic.gold'), 'Header decoration must use semantic gold.');
assert(header.includes('UI_THEME.colors.text.primary'), 'Header title must use primary text.');
console.info('[Dungeon Logic] UI text + header sanity: PASS');
```

- [ ] **Step 2: Run and verify RED**

```bash
node scripts/ui-text-header-sanity.mjs
```

Expected: FAIL because the new files do not exist.

- [ ] **Step 3: Implement `UiText.ts`**

```ts
import type Phaser from 'phaser';
import type { UiDensity } from './UiDensity';
import { UI_THEME, uiColorHex } from './UiTheme';

export type UiTextRole = 'display' | 'heading' | 'bodyStrong' | 'body' | 'meta';

export interface UiTextStyleOptions {
  readonly color?: number;
  readonly align?: 'left' | 'center' | 'right';
  readonly fontStyle?: 'normal' | 'bold';
}

export function createUiTextStyle(
  role: UiTextRole,
  density: UiDensity,
  options: UiTextStyleOptions = {},
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: 'monospace',
    fontSize: `${UI_THEME.typography[role][density]}px`,
    color: uiColorHex(options.color ?? UI_THEME.colors.text.primary),
    fontStyle: options.fontStyle ?? (role === 'display' || role === 'heading' || role === 'bodyStrong' ? 'bold' : 'normal'),
    align: options.align ?? 'left',
  };
}
```

- [ ] **Step 4: Implement `UiSceneHeader.ts`**

Use a single shared scene-title composition: primary cream text, short gold lines, one small gold diamond on each side. Do not add new assets.

```ts
import Phaser from 'phaser';
import type { UiDensity } from './UiDensity';
import { createUiTextStyle } from './UiText';
import { UI_THEME } from './UiTheme';

export interface UiSceneHeaderOptions {
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly density: UiDensity;
  readonly maxWidth?: number;
  readonly depth?: number;
}

export function createUiSceneHeader(scene: Phaser.Scene, options: UiSceneHeaderOptions): Phaser.GameObjects.Container {
  const depth = options.depth ?? 10;
  const container = scene.add.container(options.x, options.y).setDepth(depth);
  const label = scene.add.text(0, 0, options.label, createUiTextStyle('display', options.density, { align: 'center' })).setOrigin(0.5);
  if (options.maxWidth !== undefined && label.width > options.maxWidth) {
    label.setScale(options.maxWidth / label.width);
  }

  const gap = options.density === 'mobile' ? 18 : 24;
  const lineWidth = options.density === 'comfortable' ? 42 : 34;
  const graphics = scene.add.graphics();
  graphics.lineStyle(2, UI_THEME.colors.semantic.gold, 0.9);
  graphics.lineBetween(-label.displayWidth / 2 - gap - lineWidth, 0, -label.displayWidth / 2 - gap, 0);
  graphics.lineBetween(label.displayWidth / 2 + gap, 0, label.displayWidth / 2 + gap + lineWidth, 0);
  graphics.fillStyle(UI_THEME.colors.semantic.gold, 1);
  for (const x of [-label.displayWidth / 2 - gap / 2, label.displayWidth / 2 + gap / 2]) {
    graphics.beginPath();
    graphics.moveTo(x, -5);
    graphics.lineTo(x + 5, 0);
    graphics.lineTo(x, 5);
    graphics.lineTo(x - 5, 0);
    graphics.closePath();
    graphics.fillPath();
  }
  container.add([graphics, label]);
  return container;
}

export function createUiSectionHeader(
  scene: Phaser.Scene,
  options: UiSceneHeaderOptions,
): Phaser.GameObjects.Text {
  const text = scene.add.text(options.x, options.y, options.label, createUiTextStyle('heading', options.density, { align: 'center' }))
    .setOrigin(0.5)
    .setDepth(options.depth ?? 10);
  if (options.maxWidth !== undefined && text.width > options.maxWidth) text.setScale(options.maxWidth / text.width);
  return text;
}
```

- [ ] **Step 5: Run sanity and compile**

```bash
node scripts/ui-text-header-sanity.mjs
npm run build
```

Expected: sanity PASS and build PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/UiText.ts src/ui/UiSceneHeader.ts scripts/ui-text-header-sanity.mjs
git commit -m "feat: add shared UI typography and headers"
```

---

### Task 3: Level-1 Shell, Level-2 Inset Row, and Status Badge

**Files:**
- Create: `src/ui/UiPanel.ts`
- Create: `src/ui/UiInsetRow.ts`
- Create: `src/ui/UiStatusBadge.ts`
- Create: `scripts/ui-surfaces-sanity.mjs`

**Interfaces:**
- Consumes: `UI_THEME`, `UiDensity`, existing `createHomeHubModeCard` renderer.
- Produces: `createUiPanel`, `createUiInsetRow`, `createUiStatusBadge`.

- [ ] **Step 1: Write failing surface sanity**

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const panel = readFileSync(resolve(root, 'src/ui/UiPanel.ts'), 'utf8');
const inset = readFileSync(resolve(root, 'src/ui/UiInsetRow.ts'), 'utf8');
const badge = readFileSync(resolve(root, 'src/ui/UiStatusBadge.ts'), 'utf8');

assert(panel.includes("variant: 'wide' | 'tall'"), 'UiPanel must expose only the approved shell shapes.');
assert(panel.includes('createHomeHubModeCard'), 'UiPanel must reuse the approved Home surface family during the pilot.');
assert(inset.includes('UI_THEME.colors.surface.inset'), 'Inset rows must use the shared inset token.');
assert(inset.includes('UI_THEME.colors.border.normal'), 'Inset rows must use the shared normal border.');
assert(!inset.includes('load.image'), 'Inset rows must be programmatic and asset-free.');
assert(badge.includes('createUiTextStyle'), 'Status badges must use shared typography.');
console.info('[Dungeon Logic] UI surfaces sanity: PASS');
```

- [ ] **Step 2: Run and verify RED**

```bash
node scripts/ui-surfaces-sanity.mjs
```

Expected: FAIL because surface primitives do not exist.

- [ ] **Step 3: Implement `UiPanel.ts` as a stable non-interactive adapter**

```ts
import Phaser from 'phaser';
import { createHomeHubModeCard } from '../runtime/HomeHubModeCard';

export interface UiPanelOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly variant: 'wide' | 'tall';
  readonly depth?: number;
  readonly alpha?: number;
}

export function createUiPanel(scene: Phaser.Scene, options: UiPanelOptions): Phaser.GameObjects.NineSlice {
  return createHomeHubModeCard(scene, {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    variant: options.variant,
    interactive: false,
    onActivate: () => {},
  }).setDepth(options.depth ?? 0).setAlpha(options.alpha ?? 0.97);
}
```

This is intentionally an adapter in the pilot. Later migration may replace its internals without changing scenes.

- [ ] **Step 4: Implement `UiInsetRow.ts`**

```ts
import Phaser from 'phaser';
import { UI_THEME } from './UiTheme';

export interface UiInsetRowOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly depth?: number;
  readonly emphasized?: boolean;
}

export function createUiInsetRow(scene: Phaser.Scene, options: UiInsetRowOptions): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics().setDepth(options.depth ?? 0);
  const radius = Math.min(UI_THEME.radius.medium, Math.floor(options.height / 3));
  const left = options.x - options.width / 2;
  const top = options.y - options.height / 2;
  graphics.fillStyle(options.emphasized ? UI_THEME.colors.surface.base : UI_THEME.colors.surface.inset, 0.98);
  graphics.fillRoundedRect(left, top, options.width, options.height, radius);
  graphics.lineStyle(1, options.emphasized ? UI_THEME.colors.border.bright : UI_THEME.colors.border.normal, 0.9);
  graphics.strokeRoundedRect(left, top, options.width, options.height, radius);
  return graphics;
}
```

- [ ] **Step 5: Implement `UiStatusBadge.ts`**

Use `UiInsetRow` + one `meta/bodyStrong` text label. It must accept semantic tone only as `neutral | success | gold | danger`, map each tone to the theme, and never accept raw colors.

Signature:

```ts
export type UiStatusTone = 'neutral' | 'success' | 'gold' | 'danger';

export interface UiStatusBadgeOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly density: UiDensity;
  readonly tone?: UiStatusTone;
  readonly depth?: number;
}

export interface UiStatusBadgeHandle {
  readonly surface: Phaser.GameObjects.Graphics;
  readonly label: Phaser.GameObjects.Text;
  destroy(): void;
}
```

- [ ] **Step 6: Run surface sanity and build**

```bash
node scripts/ui-surfaces-sanity.mjs
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/ui/UiPanel.ts src/ui/UiInsetRow.ts src/ui/UiStatusBadge.ts scripts/ui-surfaces-sanity.mjs
git commit -m "feat: add shared UI surface primitives"
```

---

### Task 4: Semantic Buttons and Shared Progress Bar

**Files:**
- Create: `src/ui/UiButton.ts`
- Create: `src/ui/UiProgressBar.ts`
- Modify: `src/runtime/PrimaryActionButton.ts`
- Modify: `src/runtime/MaterialActionButton.ts`
- Modify: `src/runtime/MasteryProgressBar.ts`
- Create: `scripts/ui-controls-sanity.mjs`

**Interfaces:**
- Consumes: `UI_THEME`, `UiDensity`, existing primary/material button renderers.
- Produces: `createUiButton`, `UiButtonVariant`, `createUiProgressBar`.
- Compatibility: existing `createPrimaryActionButton`, `createMaterialActionButton`, `createMasteryProgressBar` remain callable.

- [ ] **Step 1: Write failing controls sanity**

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const button = readFileSync(resolve(root, 'src/ui/UiButton.ts'), 'utf8');
const progress = readFileSync(resolve(root, 'src/ui/UiProgressBar.ts'), 'utf8');
const material = readFileSync(resolve(root, 'src/runtime/MaterialActionButton.ts'), 'utf8');
const legacyProgress = readFileSync(resolve(root, 'src/runtime/MasteryProgressBar.ts'), 'utf8');

assert(button.includes("export type UiButtonVariant = 'primary' | 'secondary' | 'danger';"), 'UiButton must expose semantic variants only.');
assert(button.includes('createPrimaryActionButton') && button.includes('createMaterialActionButton'), 'UiButton must preserve approved button renderers.');
assert(progress.includes('UI_THEME.colors.semantic.gold') && progress.includes('UI_THEME.colors.semantic.success'), 'Progress must use theme gold/success.');
assert(material.includes("from '../ui/UiTheme'"), 'Material buttons must consume shared theme tokens.');
assert(legacyProgress.includes('createUiProgressBar'), 'Legacy Mastery progress helper must delegate to UiProgressBar.');
console.info('[Dungeon Logic] UI controls sanity: PASS');
```

- [ ] **Step 2: Run and verify RED**

```bash
node scripts/ui-controls-sanity.mjs
```

Expected: FAIL because `UiButton`/`UiProgressBar` do not exist and runtime controls still own palette literals.

- [ ] **Step 3: Implement `UiButton.ts`**

Unify the public handle without rewriting the proven interaction logic:

```ts
import Phaser from 'phaser';
import { createMaterialActionButton } from '../runtime/MaterialActionButton';
import { createPrimaryActionButton } from '../runtime/PrimaryActionButton';

export type UiButtonVariant = 'primary' | 'secondary' | 'danger';

export interface UiButtonOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly iconKey?: string;
  readonly subtitle?: string;
  readonly variant: UiButtonVariant;
  readonly compact?: boolean;
  readonly enabled?: boolean;
  readonly onActivate: (pointer: Phaser.Input.Pointer) => void;
}

export interface UiButtonHandle {
  readonly surface: Phaser.GameObjects.NineSlice;
  readonly label: Phaser.GameObjects.Text;
  readonly icon?: Phaser.GameObjects.Image;
  readonly subtitle?: Phaser.GameObjects.Text;
  destroy(): void;
}

export function createUiButton(scene: Phaser.Scene, options: UiButtonOptions): UiButtonHandle {
  if (options.variant === 'primary') {
    return createPrimaryActionButton(scene, options);
  }
  const button = createMaterialActionButton(scene, {
    ...options,
    variant: options.variant,
  });
  return { ...button, subtitle: undefined };
}
```

- [ ] **Step 4: Implement `UiProgressBar.ts`**

Move the current Mastery yellow→green rendering into a semantic shared helper. The track must use `surface.inset`, outline `border.dark`, start `semantic.gold`, end `semantic.success`. Keep the existing canvas-gradient strategy so the visual does not regress.

Public signature:

```ts
export interface UiProgressBarOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly current: number;
  readonly target: number;
  readonly depth?: number;
}

export function createUiProgressBar(
  scene: Phaser.Scene,
  options: UiProgressBarOptions,
): Phaser.GameObjects.GameObject;
```

- [ ] **Step 5: Convert `MasteryProgressBar.ts` into a compatibility wrapper**

```ts
export { createUiProgressBar as createMasteryProgressBar } from '../ui/UiProgressBar';
export type { UiProgressBarOptions as MasteryProgressBarOptions } from '../ui/UiProgressBar';
```

If existing callers depend on a different exported option type name, keep that exact alias rather than changing callers outside the pilot.

- [ ] **Step 6: Replace standard palette literals inside `MaterialActionButton.ts` and text/tint literals inside `PrimaryActionButton.ts`**

Use `UI_THEME.colors.text.primary`, `UI_THEME.colors.text.disabled`, `UI_THEME.colors.surface.base/highlight`, `UI_THEME.colors.semantic.danger`, and `uiColorHex` where Phaser text expects CSS. Do not change asset keys, state transitions, touch hover cleanup, fit-to-width, or audio calls.

- [ ] **Step 7: Run controls and regression sanities**

```bash
node scripts/ui-controls-sanity.mjs
node scripts/material-action-buttons-sanity.mjs
node scripts/primary-action-button-sanity.mjs
node scripts/progress-bar-unification-sanity.mjs
npm run build
```

Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add src/ui/UiButton.ts src/ui/UiProgressBar.ts src/runtime/PrimaryActionButton.ts src/runtime/MaterialActionButton.ts src/runtime/MasteryProgressBar.ts scripts/ui-controls-sanity.mjs
git commit -m "feat: unify UI controls and progress styling"
```

---

### Task 5: Standard Modal Contract

**Files:**
- Create: `src/ui/UiModal.ts`
- Modify: `src/runtime/ModalPanel.ts`
- Create: `scripts/ui-modal-sanity.mjs`

**Interfaces:**
- Consumes: `UI_THEME`, `UiDensity`, current `createModalPanel` renderer.
- Produces: `createUiModal(scene, options)` returning explicit visible content bounds.

- [ ] **Step 1: Write failing modal sanity**

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const modal = readFileSync(resolve(root, 'src/ui/UiModal.ts'), 'utf8');

assert(modal.includes("variant: 'compact' | 'tall'"), 'UiModal must expose compact/tall semantics.');
assert(modal.includes('UI_THEME.colors.background.overlay'), 'Modal veil must use the shared overlay token.');
assert(modal.includes('contentBounds'), 'Modal must expose visible content bounds.');
assert(modal.includes("density === 'mobile' ? 12 : density === 'compact' ? 16 : 24"), 'Modal padding must follow the shared density scale.');
console.info('[Dungeon Logic] UI modal sanity: PASS');
```

- [ ] **Step 2: Run and verify RED**

```bash
node scripts/ui-modal-sanity.mjs
```

Expected: FAIL because `UiModal.ts` does not exist.

- [ ] **Step 3: Implement `UiModal.ts`**

```ts
import Phaser from 'phaser';
import { createModalPanel } from '../runtime/ModalPanel';
import type { UiDensity } from './UiDensity';
import { UI_THEME } from './UiTheme';

export interface UiModalOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly density: UiDensity;
  readonly variant: 'compact' | 'tall';
  readonly depth?: number;
}

export interface UiModalHandle {
  readonly veil: Phaser.GameObjects.Rectangle;
  readonly surface: Phaser.GameObjects.NineSlice;
  readonly contentBounds: Phaser.Geom.Rectangle;
  destroy(): void;
}

export function createUiModal(scene: Phaser.Scene, options: UiModalOptions): UiModalHandle {
  const depth = options.depth ?? 1000;
  const padding = options.density === 'mobile' ? 12 : options.density === 'compact' ? 16 : 24;
  const veil = scene.add.rectangle(
    scene.scale.width / 2,
    scene.scale.height / 2,
    scene.scale.width,
    scene.scale.height,
    UI_THEME.colors.background.overlay,
    0.84,
  ).setDepth(depth).setInteractive();
  const surface = createModalPanel(scene, {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    variant: options.variant === 'tall' ? 'tall' : 'wide',
    alpha: 0.985,
  }).setDepth(depth + 1);
  const contentBounds = new Phaser.Geom.Rectangle(
    options.x - options.width / 2 + padding,
    options.y - options.height / 2 + padding,
    options.width - padding * 2,
    options.height - padding * 2,
  );
  return {
    veil,
    surface,
    contentBounds,
    destroy: () => { veil.destroy(); surface.destroy(); },
  };
}
```

- [ ] **Step 4: Keep `ModalPanel.ts` art-only**

It may trim invisible texture margins and own NineSlice geometry, but it must not choose overlay opacity, semantic colors, text, buttons, or layout padding. Those belong to `UiModal`.

- [ ] **Step 5: Run sanity/build**

```bash
node scripts/ui-modal-sanity.mjs
node scripts/modal-panel-sanity.mjs
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/UiModal.ts src/runtime/ModalPanel.ts scripts/ui-modal-sanity.mjs
git commit -m "feat: add standard modal contract"
```

---

### Task 6: Migrate Home as the Meta-UI Reference

**Files:**
- Modify: `src/scenes/HomeScene.ts`
- Modify: `src/runtime/MasteryStrip.ts`
- Modify: `src/runtime/HomeHubModeCard.ts` only if it still contains standard palette literals that belong in the theme.
- Create: `scripts/ui-home-migration-sanity.mjs`

**Interfaces:**
- Consumes: `resolveUiDensity`, `UI_THEME`, `createUiTextStyle`, `createUiButton`, `createUiProgressBar`.
- Preserves: current Home card raster assets, interaction states, logo, layout semantics, unlock logic.

- [ ] **Step 1: Write failing Home migration sanity**

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const home = readFileSync(resolve(root, 'src/scenes/HomeScene.ts'), 'utf8');
const strip = readFileSync(resolve(root, 'src/runtime/MasteryStrip.ts'), 'utf8');

assert(home.includes("from '../ui/UiTheme'"), 'Home must consume shared theme tokens.');
assert(home.includes("from '../ui/UiDensity'"), 'Home must consume shared density.');
assert(home.includes('createUiButton'), 'Home primary CTA must use UiButton.');
assert(home.includes('createUiProgressBar'), 'Home progress must use UiProgressBar directly.');
assert(strip.includes("from '../ui/UiTheme'"), 'Mastery strip must use shared theme colors.');
assert(!home.includes("'#fff1d2'") && !home.includes("'#c4d0e5'"), 'Home standard text colors must not be hardcoded.');
console.info('[Dungeon Logic] Home UI migration sanity: PASS');
```

- [ ] **Step 2: Run and verify RED**

```bash
node scripts/ui-home-migration-sanity.mjs
```

Expected: FAIL because Home still uses legacy helpers/literals.

- [ ] **Step 3: Resolve one density at scene render time**

At the top of the Home render/create flow:

```ts
const density = resolveUiDensity(this.scale.width, this.scale.height);
```

Pass this density into text/header/button helpers rather than recomputing local font breakpoints.

- [ ] **Step 4: Migrate Home text roles**

Map:
- logo remains its existing asset;
- card titles → `bodyStrong`, `text.primary`;
- card subtitles/progress notes → `meta` or `body`, `text.secondary`;
- disabled/locked copy → `text.disabled`;
- selected/current accent → `semantic.gold`;
- completion/success → `semantic.success`.

Do not change card positions or unlock logic in this step.

- [ ] **Step 5: Migrate the Continue CTA to `createUiButton(... variant: 'primary')`**

Preserve existing label/subtitle/icon and callback. The rendered asset must remain the current yellow primary button.

- [ ] **Step 6: Migrate Home progress to `createUiProgressBar` and Mastery strip to shared theme text**

Remove scene-local progress colors. Keep current values and geometry.

- [ ] **Step 7: Run Home regressions**

```bash
node scripts/ui-home-migration-sanity.mjs
node scripts/home-hub-layout-sanity.mjs
node scripts/home-hub-mode-card-sanity.mjs
node scripts/home-mastery-strip-sanity.mjs
node scripts/first-run-home-sanity.mjs
node scripts/progress-bar-unification-sanity.mjs
npm run build
```

Expected: all PASS.

- [ ] **Step 8: Manual Home visual gate**

Capture Home at:

```text
1920×1080  comfortable
1920×650   compact
390×844    mobile
```

Reject the task if any of these is true:
- secondary text is lost against the background;
- any user-facing text is visually below 10 px;
- gold appears on a non-primary/non-selected element;
- teal appears on a non-success element;
- cards or CTA overlap at 650 px height;
- mobile is just a scaled desktop composition rather than mobile density.

- [ ] **Step 9: Commit**

```bash
git add src/scenes/HomeScene.ts src/runtime/MasteryStrip.ts src/runtime/HomeHubModeCard.ts scripts/ui-home-migration-sanity.mjs
git commit -m "refactor: migrate Home to shared UI system"
```

---

### Task 7: Migrate Mastery as the Data-Heavy Reference

**Files:**
- Modify: `src/scenes/MasteryScene.ts`
- Modify: `src/runtime/MasteryRequirementPanel.ts`
- Modify: `src/runtime/MasteryRequirementRowPanel.ts`
- Modify: `src/runtime/MasteryDesktopLayout.ts` only to accept shared density-derived style metrics if the current branch has this file; do not replace its adaptive fit calculations.
- Create: `scripts/ui-mastery-migration-sanity.mjs`

**Interfaces:**
- Consumes: `createUiSceneHeader`, `createUiPanel`, `createUiInsetRow`, `createUiProgressBar`, `createUiTextStyle`, `UI_THEME`, `resolveUiDensity`.
- Preserves: rank seals, glow, rank progression logic, adaptive height fit, mastery conditions, leaderboard navigation.

- [ ] **Step 1: Write failing Mastery migration sanity**

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const mastery = readFileSync(resolve(root, 'src/scenes/MasteryScene.ts'), 'utf8');

assert(mastery.includes('createUiSceneHeader'), 'Mastery must use the shared scene header.');
assert(mastery.includes('createUiPanel'), 'Mastery main requirement shell must use UiPanel.');
assert(mastery.includes('createUiInsetRow'), 'Mastery requirement rows must use programmatic inset rows.');
assert(mastery.includes('createUiProgressBar'), 'Mastery progress must use UiProgressBar.');
assert(mastery.includes('resolveUiDensity'), 'Mastery styling must use shared density.');
assert(!mastery.includes('createMasteryRequirementRowPanel'), 'Mastery must stop using a separate decorative row family.');
console.info('[Dungeon Logic] Mastery UI migration sanity: PASS');
```

- [ ] **Step 2: Run and verify RED**

```bash
node scripts/ui-mastery-migration-sanity.mjs
```

Expected: FAIL on legacy Mastery panel/row usage.

- [ ] **Step 3: Replace scene title with `createUiSceneHeader`**

Keep its current position from the adaptive layout; replace only rendering/style.

- [ ] **Step 4: Replace the large requirements shell with `createUiPanel`**

Use `variant: 'wide'` for desktop and whichever existing geometry the mobile layout already uses. Do not invent a new Mastery-only asset.

- [ ] **Step 5: Replace all three requirement-row surfaces with `createUiInsetRow`**

Rows must have visible vertical gaps. Keep current icon, label, value, status-circle, and progress geometry. Map:
- normal row text → `text.primary`/`text.secondary`;
- completed marker → `semantic.success`;
- current progress → gold→success `UiProgressBar`.

- [ ] **Step 6: Replace Mastery text literals with shared roles**

Map rank title → `heading`, rank description → `body`, requirement label/value → `bodyStrong`, rank-track labels → `meta`. Do not render track labels below the `meta` floor; if a low viewport cannot fit, reduce horizontal spacing/track width before shrinking text further.

- [ ] **Step 7: Preserve the current adaptive desktop fit**

If the branch contains `MasteryDesktopLayout.ts`, keep its height-driven calculator and feed shared density metrics into it. Explicitly reject reintroducing `shortDesktop`/`compactDesktop` boolean forks in `MasteryScene.ts`.

- [ ] **Step 8: Run Mastery regressions**

```bash
node scripts/ui-mastery-migration-sanity.mjs
node scripts/mastery-scene-sanity.mjs
node scripts/mastery-native-ui-sanity.mjs
node scripts/mastery-glow-sanity.mjs
node scripts/mastery-challenge-polish-sanity.mjs
node scripts/progress-bar-unification-sanity.mjs
node scripts/mastery-adaptive-height-sanity.mjs 2>/dev/null || true
npm run sanity:mastery
npm run build
```

If the current branch names the adaptive-height sanity differently, run the checked-in adaptive Mastery sanity that validates 650/705/768/900/1080. Do not skip the behavior; only the filename may differ.

- [ ] **Step 9: Manual Mastery visual gate**

Capture `1920×1080`, `1920×650`, and `390×844` and reject if:
- the bottom rank track is clipped;
- requirement rows touch/overlap;
- the shell dominates the seal/content;
- secondary copy disappears against the background;
- row text drops below the typography floor.

- [ ] **Step 10: Commit**

```bash
git add src/scenes/MasteryScene.ts src/runtime/MasteryRequirementPanel.ts src/runtime/MasteryRequirementRowPanel.ts src/runtime/MasteryDesktopLayout.ts scripts/ui-mastery-migration-sanity.mjs
git commit -m "refactor: migrate Mastery to shared UI system"
```

Only add `MasteryDesktopLayout.ts` if it exists in the current branch and was modified.

---

### Task 8: Migrate Gameplay Chrome and Run the Pilot Acceptance Gate

**Files:**
- Modify: `src/runtime/PuzzleHeaderUiAssets.ts`
- Modify: `src/runtime/MaterialActionButton.ts` if Task 4 left gameplay-only colors unresolved.
- Modify: `src/scenes/GameScene.ts`
- Create: `scripts/ui-gameplay-migration-sanity.mjs`
- Create: `scripts/ui-pilot-acceptance-sanity.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: all common UI primitives created in Tasks 1–5.
- Preserves: board rendering/layout, timer behavior, puzzle tools, input semantics, tutorial targets, completion behavior, save state.
- Produces: three reference screens sharing one visual system and one aggregate sanity command.

- [ ] **Step 1: Write failing Gameplay migration sanity**

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const game = readFileSync(resolve(root, 'src/scenes/GameScene.ts'), 'utf8');
const header = readFileSync(resolve(root, 'src/runtime/PuzzleHeaderUiAssets.ts'), 'utf8');

assert(header.includes('createUiPanel') || header.includes('createUiStatusBadge'), 'Puzzle header renderer must delegate to common UI surfaces.');
assert(game.includes("from '../ui/UiTheme'"), 'Gameplay chrome must use shared semantic tokens.');
assert(game.includes('resolveUiDensity'), 'Gameplay chrome must resolve shared density.');
assert(!game.includes('lineStyle(3, 0xf0bd63'), 'Gameplay guidance highlight must not hardcode gold.');
console.info('[Dungeon Logic] Gameplay UI migration sanity: PASS');
```

- [ ] **Step 2: Run and verify RED**

```bash
node scripts/ui-gameplay-migration-sanity.mjs
```

Expected: FAIL because the current puzzle header and guidance highlight still own a separate palette.

- [ ] **Step 3: Keep the `PuzzleHeaderUiAssets.ts` API but replace its visual implementation**

Preserve these callers/signatures so `GameScene` does not need a large rewrite:

```ts
createPuzzleHeaderTitlePanel(scene, x, y, width, height)
createPuzzleHeaderStatusPanel(scene, x, y, width, height)
```

Internally:
- title panel delegates to `createUiPanel(... variant: 'wide')`;
- status panel delegates to `createUiStatusBadge(... tone: 'neutral')` or an equivalent shared inset surface;
- `preloadPuzzleHeaderUiAssets` becomes a compatibility preload only if another scene still needs the old assets. Do not delete old files/assets in this pilot.

- [ ] **Step 4: Resolve one `UiDensity` in `GameScene` for chrome styling**

Do not change `GameBoardLayout` or board scale logic. Density is only for text/control/chrome styling.

- [ ] **Step 5: Replace standard Gameplay UI color literals**

At minimum migrate:
- guided/tutorial button outline → `UI_THEME.colors.semantic.gold`;
- standard label colors → `UI_THEME.colors.text.primary/secondary/muted`;
- disabled controls → `text.disabled`;
- reset/destructive chrome → `semantic.danger` through the existing material-button renderer.

Do not touch gameplay red/orange clue numbers/marks, monster colors, floor/wall art, or chest art.

- [ ] **Step 6: Run gameplay regressions**

```bash
node scripts/ui-gameplay-migration-sanity.mjs
node scripts/game-controls-settings-visual-sanity.mjs
node scripts/puzzle-header-concept2-sanity.mjs
node scripts/mobile-gameplay-layout-sanity.mjs
node scripts/mobile-layout-hint-regression-sanity.mjs
node scripts/game-resume-relayout-sanity.mjs
node scripts/touch-button-release-sanity.mjs
node scripts/hidpi-rendering-sanity.mjs
npm run build
```

Expected: all PASS.

- [ ] **Step 7: Add aggregate pilot acceptance sanity**

Create `scripts/ui-pilot-acceptance-sanity.mjs` that verifies:
- all ten new `src/ui/*` foundation files exist;
- Home imports theme/density/common button/progress;
- Mastery imports header/panel/inset/progress;
- Gameplay header delegates to common surfaces;
- standard UI scenes do not introduce user-facing font literals below 10 px in the pilot files;
- `GameBoardLayout.ts` has not been modified by the migration commit (verify via git diff during review, not by source script).

The font-floor source check should match `fontSize: '<N>px'` literals in `HomeScene.ts`, `MasteryScene.ts`, `MasteryStrip.ts`, and standard UI portions of `GameScene.ts`, and fail for numeric values below 10.

- [ ] **Step 8: Add `sanity:ui-system` to `package.json`**

```json
"sanity:ui-system": "node scripts/ui-theme-density-sanity.mjs && node scripts/ui-text-header-sanity.mjs && node scripts/ui-surfaces-sanity.mjs && node scripts/ui-controls-sanity.mjs && node scripts/ui-modal-sanity.mjs && node scripts/ui-home-migration-sanity.mjs && node scripts/ui-mastery-migration-sanity.mjs && node scripts/ui-gameplay-migration-sanity.mjs && node scripts/ui-pilot-acceptance-sanity.mjs"
```

- [ ] **Step 9: Run the complete automated acceptance set**

```bash
npm run sanity:ui-system
npm run sanity:mastery
npm run sanity:game-regressions
npm run sanity:responsive-shell
npm run sanity:live-resize
npm run build
```

Then run the existing relevant Node sanities again if they are not covered by those aggregate scripts:

```bash
node scripts/home-hub-layout-sanity.mjs
node scripts/home-hub-mode-card-sanity.mjs
node scripts/home-mastery-strip-sanity.mjs
node scripts/progress-bar-unification-sanity.mjs
node scripts/mobile-gameplay-layout-sanity.mjs
node scripts/hidpi-rendering-sanity.mjs
```

Expected: zero failures.

- [ ] **Step 10: Manual three-screen visual acceptance**

For each of **Home**, **Mastery**, **Gameplay**, capture:

```text
Desktop comfortable: 1920×1080
Desktop compact:     1920×650
Mobile portrait:      390×844 (or the nearest real target phone size)
```

Check the following in every screenshot:

```text
[ ] Background remains atmospheric but does not erase secondary text.
[ ] Primary text is warm cream and immediately readable.
[ ] Secondary text is visibly lighter than disabled text.
[ ] Gold appears only on CTA/current/selected/important progress.
[ ] Teal appears only on success/complete.
[ ] Red UI appears only on destructive actions.
[ ] No standard user-facing text is below the visual 10px floor.
[ ] No shell/frame is visually heavier than its content.
[ ] No overlap/clipping at 650px height.
[ ] Mobile uses mobile density rather than a scaled desktop composition.
[ ] Puzzle board geometry/art is unchanged before vs after.
```

If any item fails, fix the owning common component first; do not patch the individual scene unless the issue is genuinely scene-specific geometry.

- [ ] **Step 11: Review the diff for architecture leakage**

Run:

```bash
git diff -- src/ui src/scenes/HomeScene.ts src/scenes/MasteryScene.ts src/scenes/GameScene.ts src/runtime
```

Reject the branch if:
- a new standard UI color literal appears in a pilot scene;
- a new scene-specific button/panel renderer was added instead of using the common UI layer;
- `GameBoardLayout.ts` or puzzle logic changed;
- new raster UI art was added;
- a compatibility adapter changed gameplay or navigation semantics.

- [ ] **Step 12: Commit pilot completion**

```bash
git add package.json src/ui src/scenes/HomeScene.ts src/scenes/MasteryScene.ts src/scenes/GameScene.ts src/runtime/PuzzleHeaderUiAssets.ts src/runtime/MaterialActionButton.ts scripts/ui-gameplay-migration-sanity.mjs scripts/ui-pilot-acceptance-sanity.mjs
git commit -m "refactor: unify reference screens with UI system"
```

---

## After This Plan

Do **not** start opportunistically changing other screens during this plan. Once the pilot passes visual review, write a second implementation plan for:

```text
Levels → Daily → Settings → Leaderboard
```

Then a third plan for:

```text
Pause → Reset → Hint confirm → Tutorial → Rank-up → Victory
```

Those plans should consume the interfaces defined here without adding another palette or component family.

## Self-Review Results

### Spec coverage

- Palette/semantic roles: Tasks 1, 4, 6–8.
- Surface hierarchy: Tasks 3, 5, 7, 8.
- Core components: Tasks 2–5.
- Modal system: Task 5; actual overlay migrations intentionally deferred per rollout.
- Typography and 10px floor: Tasks 1, 2, 6–8.
- Spacing scale: Task 1 and every common primitive.
- Three density modes: Task 1; pilot validation Tasks 6–8.
- Background contrast: visual gates Tasks 6–8; background art itself is unchanged.
- Home/Mastery/Gameplay reference screens: Tasks 6–8.
- Remaining screens: explicitly deferred to follow-up plans, matching the approved rollout.
- Desktop ~640px and mobile portrait: Tasks 1, 6–8.
- No new raster art: Global Constraints and Task 8 diff gate.

### Placeholder scan

No `TBD`, `TODO`, “implement later”, or unspecified “add tests” steps remain. Deferred screens are explicitly out of scope and assigned to named follow-up plans.

### Type consistency

- Density type is consistently `UiDensity = 'comfortable' | 'compact' | 'mobile'`.
- Theme entry point is consistently `UI_THEME`.
- Text entry point is consistently `createUiTextStyle`.
- Surfaces are consistently `createUiPanel`, `createUiInsetRow`, `createUiStatusBadge`.
- Controls are consistently `createUiButton`, `createUiProgressBar`.
- Modal entry point is consistently `createUiModal`.

### Review Focus coverage

- Low desktop height: Task 1 behavior test + Tasks 6–8 visual gates.
- Portrait phone: Task 1 behavior test + Tasks 6–8 visual gates.
- Long RU/EN copy: fit behavior retained in control wrappers and visual gates in Tasks 6–8.
- Disabled/locked/selected: Tasks 3, 4, 6, 7.
- Resize/safe area/touch: existing sanities rerun in Tasks 4 and 8.
