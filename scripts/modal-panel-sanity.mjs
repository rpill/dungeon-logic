import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const boot = readFileSync(resolve(root, 'src/scenes/BootScene.ts'), 'utf8');
const game = readFileSync(resolve(root, 'src/scenes/GameScene.ts'), 'utf8');
const rankup = readFileSync(resolve(root, 'src/runtime/MasteryRankUpOverlay.ts'), 'utf8');
const helper = readFileSync(resolve(root, 'src/runtime/ModalPanel.ts'), 'utf8');
assert(boot.includes('preloadModalPanelAssets(this);'), 'BootScene must preload modal panel assets.');
assert(helper.includes("scene.load.image(MODAL_PANEL_KEYS.wide, 'assets/ui/modal_panel_wide.webp');"), 'Wide modal asset must be loaded from UI assets.');
assert(helper.includes("scene.load.image(MODAL_PANEL_KEYS.tall, 'assets/ui/modal_panel_tall.webp');"), 'Tall modal asset must be loaded from UI assets.');
assert(helper.includes("scene.load.image(MODAL_PANEL_KEYS.rankup, 'assets/ui/mastery_rankup_panel_generated.webp');"), 'Rank-up modal asset must be loaded from UI assets.');
assert(game.includes('onboardingPanel = createModalPanel(this, {'), 'Tutorial panel must use the modal panel helper.');
assert(game.includes('const panel = createModalPanel(this, {'), 'Reset dialog must use the modal panel helper.');
assert(rankup.includes('const panel = createModalPanel(scene, {') && rankup.includes("variant: 'rankup'"), 'Rank-up overlay must use the dedicated rank-up modal panel variant.');
console.info('[Dungeon Logic] modal panel sanity: PASS');
