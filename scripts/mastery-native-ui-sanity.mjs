import fs from 'node:fs';
const strip=fs.readFileSync('src/runtime/MasteryStrip.ts','utf8');
const scene=fs.readFileSync('src/scenes/MasteryScene.ts','utf8');
const boot=fs.readFileSync('src/scenes/BootScene.ts','utf8');
const card=fs.readFileSync('src/runtime/HomeHubModeCard.ts','utf8');
function expect(condition,message){if(!condition)throw new Error(message);}
expect(strip.includes('createHomeHubModeCard'),'MasteryStrip must reuse createHomeHubModeCard');
expect(strip.includes("variant: 'wide'"),'MasteryStrip must use the native wide card variant');
expect(!strip.includes('mastery-strip-home'),'MasteryStrip must not use a custom mastery strip texture');
expect(!strip.includes('scene.add.nineslice'),'MasteryStrip must not implement its own NineSlice geometry');
expect(scene.includes('createUiPanel'),'MasteryScene must use the shared UI shell');
expect(scene.includes('createUiInsetRow'),'MasteryScene must use programmatic shared inset rows');
expect(!scene.includes('createMasteryRequirementRowPanel'),'MasteryScene must stop using the decorative requirement-row asset');
expect(scene.includes('mastery.nextRank'),'MasteryScene requirements title logic must remain intact');
expect(boot.includes('preloadMasteryRequirementPanelAssets'),'Compatibility preload for generated requirements panel may remain during pilot');
expect(boot.includes('preloadMasteryRequirementRowPanelAssets'),'Compatibility preload for generated requirement row may remain during pilot');
expect(card.includes('readonly interactive?: boolean'),'HomeHubModeCard must support non-interactive display reuse');
expect(card.includes('const interactive = options.interactive ?? true'),'HomeHubModeCard must default interactive mode to true');
console.log('mastery native UI sanity: PASS');
