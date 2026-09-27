import { readFileSync } from 'node:fs';
function assert(condition, message) { if (!condition) throw new Error(message); }
const home = readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');
assert(home.includes('createSlateSurface(scene, options.x, options.y, options.width, options.height)'), 'Navigation cards use shared matte slate.');
assert(home.includes('createPrimaryActionButton(scene,'), 'Continue uses the shared gold button family.');
assert(home.includes('UI_ICON_KEYS.lock'), 'Locked cards retain a lock glyph.');
assert(home.includes('if (!enabled) surface.setTint('), 'Disabled cards stay opaque and muted.');
assert(home.includes("surface.on('pointerover'") && home.includes("surface.on('pointerdown'"), 'Cards retain visual hover and press states.');
assert(home.includes("surface.on('pointerup'") && home.includes('pointerGate.canActivate(pointer.id)'), 'Cards activate only after the gesture gate.');
assert(home.includes("getAudioFeedback(scene).play('ui-click')"), 'Cards retain click feedback.');
assert(!home.includes("from '../runtime/HomeHubModeCard'"), 'Legacy dedicated Home skins are not used.');
console.info('[Dungeon Logic] Home card material and state sanity: PASS');
