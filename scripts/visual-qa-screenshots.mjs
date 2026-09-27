/** Capture every DEV Visual QA state with the installed Edge browser. */
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { VISUAL_QA_STATES } from '../src/dev/VisualQaCatalog.ts';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const options = Object.fromEntries(process.argv.slice(2).filter((arg) => arg.startsWith('--')).map((arg) => {
  const [name, ...value] = arg.slice(2).split('=');
  return [name, value.join('=')];
}));
const viewportOptions = options.viewports?.split(',') ?? ['1920x1080', '1366x768', '1280x640', '390x844', '412x915'];
const viewports = viewportOptions.map((value) => {
  const match = /^(\d+)x(\d+)$/.exec(value);
  if (!match) throw new Error(`Invalid viewport: ${value}`);
  return { width: Number(match[1]), height: Number(match[2]), label: value };
});
const requested = options.states?.split(',') ?? [];
const brightness = options.brightness === undefined ? 1 : Number(options.brightness);
if (!Number.isFinite(brightness) || brightness <= 0 || brightness > 1) throw new Error('Invalid --brightness (expected 0..1).');
const states = requested.length === 0
  ? VISUAL_QA_STATES
  : VISUAL_QA_STATES.filter((state) => requested.includes(state.id) || requested.includes(state.group.toLowerCase()));
if (states.length === 0) throw new Error('No Visual QA states matched --states.');
const out = resolve(root, options.out || 'visual-qa/screenshots');
const base = options.base || 'http://127.0.0.1:5173/';
const edge = process.env.VISUAL_QA_BROWSER || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
if (!existsSync(edge)) throw new Error(`Edge not found: ${edge}. Set VISUAL_QA_BROWSER.`);

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright-core'));
} catch {
  const bundled = join(process.env.USERPROFILE || '', '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', 'playwright-core');
  if (!existsSync(bundled)) throw new Error('Install playwright-core as a dev dependency to run visual QA screenshots.');
  ({ chromium } = require(bundled));
}

mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: edge, args: ['--disable-gpu', '--no-sandbox'] });
const results = [];
try {
  for (const viewport of viewports) {
    const directory = join(out, viewport.label);
    mkdirSync(directory, { recursive: true });
    const phonePortrait = viewport.width < 700 && viewport.height > viewport.width;
    const page = await browser.newPage({
      viewport,
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
      hasTouch: phonePortrait,
      isMobile: phonePortrait,
    });
    for (const state of states) {
      const errors = [];
      const onError = (error) => errors.push(String(error));
      page.on('pageerror', onError);
      const url = new URL(base);
      url.searchParams.set('visualQa', state.id);
      url.searchParams.set('capture', '1');
      let ready = false;
      try {
        await page.goto(url.href, { waitUntil: 'load', timeout: 20_000 });
        await page.waitForFunction((id) => document.documentElement.dataset.visualQaReady === id, state.id, { timeout: 15_000 });
        await page.waitForTimeout(state.scene === 'catalog' ? 100 : 900);
        if (options.scroll === 'bottom' && state.scene === 'help') {
          await page.mouse.move(viewport.width / 2, viewport.height / 2);
          await page.mouse.wheel(0, 100_000);
          await page.waitForTimeout(180);
        }
        if (brightness < 1) await page.addStyleTag({ content: `canvas { filter: brightness(${brightness}); }` });
        ready = true;
      } catch (error) {
        errors.push(String(error));
      }
      const file = join(directory, `${state.id}.png`);
      await page.screenshot({ path: file });
      results.push({ state: state.id, viewport: viewport.label, ready, errors, file });
      page.off('pageerror', onError);
      process.stdout.write(`${errors.length || !ready ? 'FAIL' : 'OK  '} ${viewport.label} ${state.id}\n`);
    }
    await page.close();
  }
} finally {
  await browser.close();
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ base, viewports, generatedAt: new Date().toISOString(), results }, null, 2));
const failures = results.filter((entry) => !entry.ready || entry.errors.length > 0);
process.stdout.write(`Captured ${results.length} screenshots; ${failures.length} failed.\n`);
if (failures.length > 0) process.exitCode = 1;
