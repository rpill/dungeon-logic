import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const source = readFileSync(resolve(process.cwd(), 'src/scenes/DailyScene.ts'), 'utf8');

assert(source.includes("createSceneBackground(this, 'meta')"), 'Daily hub must reuse the shared meta background.');
assert(source.includes('createMetaPageHeader'), 'Daily hub back/title chrome must use the shared styled meta header.');
assert(source.includes('createPrimaryActionButton') && source.includes('createMaterialActionButton'), 'Daily actions must use the shared gold and slate button family.');
assert(source.includes("'home-menu-icon-play'") && source.includes("'home-menu-icon-statistics'"), 'Daily actions must retain their play/statistics icons.');
assert(source.includes('createSlateSurface'), 'Daily status must use the approved matte slate surface.');
assert(source.includes('title: copy.dailyHub.title'), 'Daily hub title must be supplied to the shared decorated meta header.');
assert(source.includes('const hoverOverlay = this.drawRoundedDailyOverlay'), 'Playable Daily calendar cells must use the shared rounded hover overlay.');
assert(source.includes('setVisible(true)'), 'Daily calendar hover must reveal its overlay rather than mutate the border.');
assert(source.includes('calculateDailyHubLayout'), 'Daily hub should derive its vertical/calendar sizing from the responsive DailyHub layout helper.');
assert(!source.includes('0x111318, 1'), 'Daily hub must not keep the old opaque black header bar.');

console.info('[Dungeon Logic] Daily hub visual sanity: shared matte surfaces, actions, and calendar hover passed');
