/** Capture real previous/next month interaction and the first archive boundary. */
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { calculateDailyHubLayout, getDailyCalendarRowCount } from '../src/runtime/DailyHubLayout.ts';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright-core')); }
catch {
  ({ chromium } = require(join(process.env.USERPROFILE || '', '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', 'playwright-core')));
}
const edge = process.env.VISUAL_QA_BROWSER || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
if (!existsSync(edge)) throw new Error(`Edge not found: ${edge}`);
const out = resolve(process.argv[2] || 'visual-qa/daily-archive-navigation');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: edge, args: ['--disable-gpu', '--no-sandbox'] });
const result = [];
try {
  for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
    const label = `${viewport.width}x${viewport.height}`;
    const dir = join(out, label);
    mkdirSync(dir, { recursive: true });
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto('http://127.0.0.1:5173/?visualQa=daily-archive-months&capture=1', { waitUntil: 'load' });
    await page.waitForFunction(() => document.documentElement.dataset.visualQaReady === 'daily-archive-months');
    await page.waitForTimeout(900);
    const narrow = viewport.width < 700;
    const layout = calculateDailyHubLayout(viewport.width, viewport.height, getDailyCalendarRowCount(1, 31));
    const calendarX = viewport.width / 2;
    const gridWidth = layout.cellSize * 7 + layout.columnGap * 6;
    const offset = Math.min(Math.max(34, gridWidth / 2 - 12), narrow ? 156 : 220);
    const y = layout.monthHeaderY;
    async function capture(name) {
      const file = join(dir, `${name}.png`);
      await page.screenshot({ path: file });
      result.push({ viewport: label, name, file });
    }
    await capture('december-latest-next-disabled');
    for (const month of ['november', 'october', 'september-first-previous-disabled']) {
      await page.mouse.click(calendarX - offset, y);
      await page.waitForTimeout(130);
      await capture(month);
    }
    await page.mouse.click(calendarX - offset, y);
    await page.waitForTimeout(130);
    await capture('september-boundary-click');
    await page.mouse.click(calendarX + offset, y);
    await page.waitForTimeout(130);
    await capture('october-next');
    await page.close();
    if (errors.length > 0) throw new Error(`${label}: ${errors.join('; ')}`);
  }
} finally {
  await browser.close();
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify(result, null, 2));
console.log(`Captured ${result.length} archive navigation screenshots.`);
