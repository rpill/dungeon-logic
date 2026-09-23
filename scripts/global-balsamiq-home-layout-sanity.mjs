import fs from 'node:fs';
import path from 'node:path';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(p);
  }
}
walk(srcRoot);

const remainingMonospace = files.filter((file) => fs.readFileSync(file, 'utf8').includes("fontFamily: 'monospace'"));
assert(remainingMonospace.length === 0, `All Phaser UI text uses Balsamiq Sans; still monospace in: ${remainingMonospace.map(f => path.relative(root, f)).join(', ')}`);

const primary = fs.readFileSync(path.join(srcRoot, 'runtime/PrimaryActionButton.ts'), 'utf8');
assert(primary.includes(`fontFamily: "'Balsamiq Sans', sans-serif"`), 'Primary/Continue button uses Balsamiq Sans.');

const material = fs.readFileSync(path.join(srcRoot, 'runtime/MaterialActionButton.ts'), 'utf8');
assert(material.includes(`fontFamily: "'Balsamiq Sans', sans-serif"`), 'Secondary/danger buttons use Balsamiq Sans.');

const mastery = fs.readFileSync(path.join(srcRoot, 'runtime/MasteryStrip.ts'), 'utf8');
assert(mastery.includes('const contentLeft = options.x - cardWidth * (narrow ? 0.16 : 0.18);'), 'Mastery copy starts farther left.');

const home = fs.readFileSync(path.join(srcRoot, 'scenes/HomeScene.ts'), 'utf8');
assert(home.includes('const contentLeft = options.x - cardWidth * (narrow ? 0.16 : 0.18);'), 'Challenge copy starts farther left.');

console.log('[Dungeon Logic] Global Balsamiq + Home wide copy layout sanity: PASS');
