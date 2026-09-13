import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/runtime/HiDpiRendering.ts', import.meta.url), 'utf8');

if (/game\.renderer\s+as\s+WebGlRendererLike/.test(source)) {
  throw new Error('HiDPI renderer must not use a direct incompatible structural cast; bridge through unknown first.');
}

if (!/game\.renderer\s+as\s+unknown\s+as\s+WebGlRendererLike/.test(source)) {
  throw new Error('Expected the intentional Phaser renderer adapter cast to go through unknown.');
}

console.log('[Dungeon Logic] HiDPI TypeScript renderer cast sanity: PASS');
