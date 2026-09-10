import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const source = readFileSync(resolve(process.cwd(), 'src/scenes/DailyScene.ts'), 'utf8');

assert(source.includes("createSceneBackground(this, 'meta')"), 'Daily hub must reuse the shared meta background.');
assert(source.includes('createMetaPageHeader'), 'Daily hub back/title chrome must use the shared styled meta header.');
assert(source.includes('createHomeMenuButton'), 'Daily hub primary action must reuse the shared menu button component.');
assert(source.includes("'play',") && source.includes("'statistics',"), 'Daily today actions must use the existing play/statistics menu icons.');
assert(source.includes('title: copy.dailyHub.title'), 'Daily hub title must be supplied to the shared decorated meta header.');
assert(source.includes('const hoverOverlay = this.add.rectangle'), 'Playable Daily calendar cells must use a hover overlay.');
assert(source.includes("hoverOverlay.setVisible(true)"), 'Daily calendar hover must reveal its overlay rather than mutate the border.');
assert(source.includes('calculateDailyHubLayout'), 'Daily hub should derive its vertical/calendar sizing from the responsive DailyHub layout helper.');
assert(!source.includes('0x111318, 1'), 'Daily hub must not keep the old opaque black header bar.');

console.info('[Dungeon Logic] Daily hub visual sanity: shared meta styling + menu CTA + overlay hover passed');
