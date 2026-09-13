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
  homeSource.includes("this.add.image(centerX, 0, 'home-logo')")
    && homeSource.includes('logo.setPosition(centerX, logoY)'),
  'HomeScene must keep the logo horizontally centered while positioning it inside the responsive stack.',
);
assert(
  homeSource.includes('naturalContentWidth * 0.88')
    && homeSource.includes('naturalContentWidth * 0.94')
    && homeSource.includes('330')
    && homeSource.includes('500'),
  'Home logo must derive responsive width from the shared Home stack width.',
);
assert(
  homeSource.includes('const naturalLogoHeight = naturalLogoWidth / logoAspect')
    && homeSource.includes('logo.setDisplaySize(scaledLogoWidth, scaledLogoHeight)'),
  'Home logo must preserve source aspect ratio while scaling with the whole stack.',
);
assert(
  !homeSource.includes("this.add.text(this.scale.width / 2, titleY, 'DUNGEON LOGIC'"),
  'The old text-only DUNGEON LOGIC title must stay removed.',
);

console.info('[Dungeon Logic] Home logo sanity: compact hub logo passed');
