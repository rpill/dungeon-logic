import { existsSync, readFileSync, statSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const gameScene = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const bootScene = readFileSync(new URL('../src/scenes/BootScene.ts', import.meta.url), 'utf8');
const panelRuntimePath = new URL('../src/runtime/CompletionPanel.ts', import.meta.url);
const panelAssetPath = new URL('../public/assets/ui/completion_panel.webp', import.meta.url);
assert(existsSync(panelAssetPath), 'Completion panel has a dedicated raster asset.');
assert(statSync(panelAssetPath).size > 50_000, 'Completion panel keeps the generated blue shading/highlight detail instead of collapsing to a flat placeholder.');
assert(statSync(panelAssetPath).size < 500_000, 'Completion panel asset stays reasonably optimized for runtime.');
assert(existsSync(panelRuntimePath), 'Completion panel has a dedicated runtime component.');
const panelRuntime = readFileSync(panelRuntimePath, 'utf8');
assert(panelRuntime.includes("scene.load.image(COMPLETION_PANEL_KEY, 'assets/ui/completion_panel.webp')"), 'Completion panel asset is preloaded by its runtime helper.');
assert(panelRuntime.includes('scene.add.nineslice('), 'Completion panel surface stretches with NineSlice rather than scaling baked content.');
const sliceX = Number(panelRuntime.match(/COMPLETION_PANEL_SLICE_X = (\d+)/)?.[1] ?? Number.NaN);
const sliceY = Number(panelRuntime.match(/COMPLETION_PANEL_SLICE_Y = (\d+)/)?.[1] ?? Number.NaN);
assert(sliceX >= 48 && sliceY >= 48, 'Completion panel NineSlice preserves the generated rounded corners, rivets, and edge highlights.');
assert(sliceX <= 80 && sliceY <= 80, 'Completion panel NineSlice keeps a large stretchable center.');
assert(bootScene.includes('preloadCompletionPanelAssets(this);'), 'BootScene preloads the completion panel before GameScene uses it.');
assert(gameScene.includes('calculateCompletionPanelLayout('), 'GameScene uses the responsive completion layout.');
assert(gameScene.includes('createCompletionPanelSurface('), 'GameScene renders the dedicated completion panel surface.');
assert(!gameScene.includes('drawCompletionCrown('), 'GameScene no longer renders the extra crown above the panel.');
assert(gameScene.includes('setCompletionInfoPills(['), 'GameScene builds compact completion info pills instead of one long status block.');
assert(gameScene.includes('renderCompletionInfoPills(layout);'), 'Completion panel renders dedicated rounded info pills inside the surface.');
assert(gameScene.includes('UI_ICON_KEYS.levels'), 'Completion panel uses shared UI icons inside the info pills.');
assert(gameScene.includes('getCurrentBoardBottomReserve'), 'GameScene keeps a stable board reserve path while showing the completion panel.');
assert(gameScene.includes('completionPanelObjects'), 'Completion panel owns destroyable visual objects for safe resize/re-render.');

console.info('[Dungeon Logic] Game completion panel sanity: dedicated panel + compact responsive layout wiring passed');
