import fs from 'node:fs';
const strip=fs.readFileSync('src/runtime/MasteryStrip.ts','utf8');
const scene=fs.readFileSync('src/scenes/MasteryScene.ts','utf8');
const boot=fs.readFileSync('src/scenes/BootScene.ts','utf8');
function expect(condition,message){if(!condition)throw new Error(message);}
expect(strip.includes('createSlateSurface'),'MasteryStrip must use the shared matte slate surface');
expect(!strip.includes('mastery-strip-home'),'MasteryStrip must not use a custom mastery strip texture');
expect(!strip.includes('scene.add.nineslice'),'MasteryStrip must not implement its own NineSlice geometry');
expect(scene.includes('createMasteryRequirementPanel'),'MasteryScene must use the shared stone requirement shell');
expect(scene.includes('createMasteryRequirementRowPanel'),'MasteryScene must use reusable requirement rows');
expect(scene.includes('mastery.nextRank'),'MasteryScene requirements title logic must remain intact');
expect(boot.includes('preloadSlateSurfaceAsset(this)'),'BootScene must preload the shared stone surface once');
expect(!boot.includes('preloadMasteryRequirementRowPanelAssets'),'Old monolithic row asset must not load');
console.log('mastery native UI sanity: PASS');
