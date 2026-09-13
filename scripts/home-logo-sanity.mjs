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
const logoPath = resolve(projectRoot, 'public/assets/logo.webp');

assert(existsSync(logoPath), 'Home logo asset must exist at public/assets/logo.webp.');
assert(
  bootSource.includes("this.load.image('home-logo', 'assets/logo.webp')"),
  'BootScene must preload the home logo texture.',
);
assert(
  homeSource.includes("this.add.image(this.scale.width / 2, logoY, 'home-logo')"),
  'HomeScene must render the logo image centered at logoY.',
);
assert(
  homeSource.includes('narrow ? this.scale.width - 68 : this.scale.width * 0.42')
    && homeSource.includes('narrow ? 330 : 540'),
  'Home logo must use responsive mobile/desktop width caps.',
);
assert(
  homeSource.includes('logo.setDisplaySize(logoWidth, logoWidth / logoAspect)'),
  'Home logo must preserve the source aspect ratio.',
);
assert(
  !homeSource.includes("this.add.text(this.scale.width / 2, titleY, 'DUNGEON LOGIC'"),
  'The old text-only DUNGEON LOGIC title must stay removed.',
);

console.info('[Dungeon Logic] Home logo sanity: compact hub logo passed');
