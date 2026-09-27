import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function assert(condition, message) {
  if (!condition) {
    console.error(`[Dungeon Logic] Yandex relative paths sanity FAILED: ${message}`);
    process.exitCode = 1;
  }
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (/\.(?:ts|tsx|js|mjs|css|html)$/.test(entry)) out.push(full);
  }
  return out;
}

const viteSource = readFileSync('vite.config.ts', 'utf8');
assert(
  /base\s*:\s*['"]\.\/['"]/.test(viteSource),
  "Vite production base must be './' so hashed JS/CSS resolve inside the Yandex package path.",
);

const runtimeFiles = walk('src').filter((file) => !file.endsWith('.css'));
const styleSource = readFileSync('src/style.css', 'utf8');
assert(
  styleSource.includes("url('/assets/fonts/BalsamiqSans-Regular.woff2')")
    && styleSource.includes("url('/assets/fonts/BalsamiqSans-Bold.woff2')"),
  'Public font files must use Vite public-root URLs in source CSS; Vite rewrites CSS url() references for the relative production base.',
);
const absoluteAssetRefs = [];
for (const file of runtimeFiles) {
  const source = readFileSync(file, 'utf8');
  if (/['"`]\/assets\//.test(source)) {
    absoluteAssetRefs.push(relative('.', file));
  }
}
assert(
  absoluteAssetRefs.length === 0,
  `Runtime script source must not contain root-absolute /assets/ URLs. Found: ${absoluteAssetRefs.join(', ')}`,
);

const indexSource = readFileSync('index.html', 'utf8');
assert(
  !/href=["']\/favicon\.svg["']/.test(indexSource),
  'Favicon must be package-relative rather than /favicon.svg.',
);
assert(
  /<script\s+src=["']\/sdk\.js["']><\/script>/.test(indexSource),
  'Yandex SDK must remain /sdk.js; it is platform-provided and intentionally root-relative.',
);

if (process.exitCode !== 1) {
  console.log('[Dungeon Logic] Yandex relative paths sanity: PASS');
}
