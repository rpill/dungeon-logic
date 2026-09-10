import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const bootSource = readFileSync(resolve(projectRoot, 'src/scenes/BootScene.ts'), 'utf8');
const homeSource = readFileSync(resolve(projectRoot, 'src/scenes/HomeScene.ts'), 'utf8');
const logoPath = resolve(projectRoot, 'public/assets/logo.png');

assert(existsSync(logoPath), 'Home logo asset must exist at public/assets/logo.png.');
assert(
  bootSource.includes("this.load.image('home-logo', '/assets/logo.png')"),
  'BootScene must preload the home logo texture.',
);
assert(
  homeSource.includes("this.add.image(this.scale.width / 2, logoY, 'home-logo')"),
  'HomeScene must render the logo image centered at logoY.',
);
assert(
  homeSource.includes('const logoWidth = Math.min(narrow ? this.scale.width - 48 : 560, 640)'),
  'Home logo must use responsive width capped for desktop.',
);
assert(
  homeSource.includes('logo.setDisplaySize(logoWidth, logoWidth / logoAspect)'),
  'Home logo must preserve the source aspect ratio.',
);
assert(
  !homeSource.includes("this.add.text(this.scale.width / 2, titleY, 'DUNGEON LOGIC'"),
  'The old text-only DUNGEON LOGIC title must be removed.',
);
assert(
  !homeSource.includes('copy.home.levelsProgress('),
  'Home must not render campaign progress helper text below the logo.',
);

console.info('[Dungeon Logic] Home logo sanity: responsive image logo passed');
