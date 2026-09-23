import fs from 'node:fs';

const home = fs.readFileSync('src/scenes/HomeScene.ts', 'utf8');
const css = fs.readFileSync('src/style.css', 'utf8');
const main = fs.readFileSync('src/main.ts', 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(fs.existsSync('public/assets/fonts/BalsamiqSans-Regular.woff2'), 'Balsamiq Sans Regular WOFF2 is bundled locally.');
assert(fs.existsSync('public/assets/fonts/BalsamiqSans-Bold.woff2'), 'Balsamiq Sans Bold WOFF2 is bundled locally.');
assert(css.includes("font-family: 'Balsamiq Sans'"), 'Balsamiq Sans has a local @font-face family.');
assert(css.includes('BalsamiqSans-Regular.woff2'), 'Regular Balsamiq WOFF2 is declared.');
assert(css.includes('BalsamiqSans-Bold.woff2'), 'Bold Balsamiq WOFF2 is declared.');
assert(main.includes('document.fonts.load'), 'Local Balsamiq Sans is loaded before Phaser creates canvas text.');
assert(home.includes('largeIllustratedIcon ? (narrow ? 0.23 : 0.18) : 0.22'), 'Large Home illustration icons use the approved mobile/desktop position.');
assert(home.includes("fontFamily: \"'Balsamiq Sans', sans-serif\""), 'Home card copy uses Balsamiq Sans.');
assert(home.includes("stroke: '#26345f'"), 'Home card titles use the approved dark blue outline.');
assert(home.includes('strokeThickness: narrow ? 2 : 3'), 'Home card title outline scales for mobile and desktop.');

console.log('[Dungeon Logic] Home card typography + Daily icon position sanity: PASS');

assert(home.includes('setLetterSpacing(narrow ? 1 : 1.5)'), 'Home card headings use the approved letter spacing.');
