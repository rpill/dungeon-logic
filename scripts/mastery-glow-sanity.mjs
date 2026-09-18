import fs from 'node:fs';

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

const seal = fs.readFileSync('src/runtime/MasterySeal.ts', 'utf8');
const scene = fs.readFileSync('src/scenes/MasteryScene.ts', 'utf8');
const overlay = fs.readFileSync('src/runtime/MasteryRankUpOverlay.ts', 'utf8');

expect(fs.existsSync('public/assets/ui/mastery_light_rays_page.webp'), 'Mastery page glow asset must exist.');
expect(fs.existsSync('public/assets/ui/mastery_light_rays_rankup.webp'), 'Mastery rank-up glow asset must exist.');
expect(fs.existsSync('public/assets/ui/mastery_seal_edge_steel.webp'), 'Mastery edge glow asset must exist.');
expect(seal.includes('mastery-light-rays'), 'Mastery rays must have dedicated Phaser texture keys.');
expect(seal.includes('assets/ui/mastery_light_rays_page.webp'), 'Mastery page glow asset must be preloaded.');
expect(seal.includes('assets/ui/mastery_light_rays_rankup.webp'), 'Mastery rank-up glow asset must be preloaded.');
expect(seal.includes('createMasteryGlow'), 'MasterySeal module must expose the shared glow renderer.');
expect(seal.includes('createMasteryEdgeGlow'), 'MasterySeal module must expose the edge-glow renderer.');
expect(seal.includes('assets/ui/mastery_seal_edge_steel.webp'), 'Mastery edge glow assets must be preloaded.');
expect(seal.includes('.setDisplaySize(options.size * 0.9, options.size * 0.9)'), 'Mastery edge glow must use the exact seal image size so it cannot overlap the badge interior.');
expect(seal.includes('scene.tweens.add'), 'Mastery glow renderer must animate the rays.');
expect(seal.includes("duration: variant === 'rankup' ? 14000 : 32000"), 'Mastery rays must rotate slowly on the page and faster on rank-up.');
expect(seal.includes('angle: 360'), 'Mastery rays must rotate continuously behind the static seal.');
expect(seal.includes('repeat: -1'), 'Mastery rays rotation must loop forever while visible.');
expect(seal.includes("alpha: { from: alpha * 0.42, to: alpha * 1.95 }"), 'Mastery edge glow pulse must have a clearly visible brightness range.');
expect(seal.includes('duration: 650'), 'Mastery edge glow pulse must be clearly visible without feeling sluggish.');
expect(seal.includes("ease: 'Sine.easeInOut'"), 'Mastery edge glow pulse must be smooth.');

expect(scene.includes("variant: 'page'"), 'Mastery page must use the page glow variant.');
expect(scene.includes('createMasteryEdgeGlow'), 'Mastery page must add a compact edge glow around the seal.');
expect(!scene.includes('drawSealGlow('), 'Mastery page must not use the old Graphics circle glow.');
expect(overlay.includes("variant: 'rankup'"), 'Rank-up overlay must use the stronger rank-up glow variant.');
expect(overlay.includes('createMasteryEdgeGlow'), 'Rank-up overlay must add a compact edge glow around the seal.');

expect(scene.includes('const sealSize = 250;'), 'Desktop Mastery seal must be substantially larger than the previous 178px version.');
expect(scene.includes('Math.min(156, width * 0.4)'), 'Mobile Mastery seal must be substantially larger while staying responsive.');
expect(scene.includes('size: sealSize * 0.82'), 'Mastery page rays must be about 1.5x smaller than the previous 1.22x version.');
expect(overlay.includes('Math.min(210, panelWidth * 0.58)'), 'Narrow rank-up seal must be enlarged.');
expect(overlay.includes(': 310;'), 'Desktop rank-up seal must be enlarged.');
expect(overlay.includes('size: sealSize * (narrow ? 0.87 : 0.9)'), 'Rank-up rays must be about 1.5x smaller than the previous version.');

expect(fs.existsSync('public/assets/ui/LIGHT_RAYS_SOURCE.txt'), 'Third-party light-ray source note must be kept with the assets.');
expect(!fs.existsSync('public/assets/ui/mastery_rank_glow_page.webp'), 'Old generated page glow asset must be removed.');
expect(!fs.existsSync('public/assets/ui/mastery_rank_glow_rankup.webp'), 'Old generated rank-up glow asset must be removed.');
console.info('[Dungeon Logic] Mastery glow sanity: PASS');
