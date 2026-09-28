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
const logoEnPath = resolve(projectRoot, 'public/assets/logo_en.webp');
const logoRuPath = resolve(projectRoot, 'public/assets/logo_ru.webp');

assert(existsSync(logoEnPath), 'English Home logo asset must exist at public/assets/logo_en.webp.');
assert(existsSync(logoRuPath), 'Russian Home logo asset must exist at public/assets/logo_ru.webp.');
assert(
  bootSource.includes("this.load.image('home-logo-en', 'assets/logo_en.webp')")
    && bootSource.includes("this.load.image('home-logo-ru', 'assets/logo_ru.webp')"),
  'BootScene must preload both localized home logo textures.',
);
assert(
  homeSource.includes("profile.settings.language === 'ru' ? 'home-logo-ru' : 'home-logo-en'")
    && homeSource.includes('this.add.image(centerX, 0, logoTextureKey)')
    && homeSource.includes('logo.setPosition(centerX, stackTop + logoHeight / 2)'),
  'HomeScene must select the localized logo and keep it centered in the responsive stack.',
);
assert(
  homeSource.includes('const naturalLogoWidth = narrow ? Math.min(naturalWidth * 0.82, 310) : Math.min(naturalWidth * 0.46, 560)'),
  'Home logo must derive responsive width from the shared Home stack width.',
);
assert(
  homeSource.includes('const naturalLogoHeight = naturalLogoWidth / logoAspect')
    && homeSource.includes('logo.setDisplaySize(naturalLogoWidth * stackScale, logoHeight)'),
  'Home logo must preserve source aspect ratio while scaling with the whole stack.',
);
assert(
  !homeSource.includes("this.add.text(this.scale.width / 2, titleY, 'DUNGEON LOGIC'"),
  'The old text-only DUNGEON LOGIC title must stay removed.',
);

console.info('[Dungeon Logic] Home logo sanity: compact hub logo passed');
