import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  isDailyCatalogManifest,
  type DailyCatalogManifest,
} from '../content/daily/CatalogFormat';
import { createDailyCatalog } from '../content/daily/DailyCatalog';

const manifestPath = resolve('public/content/daily/verified-levels-manifest.json');
const binaryPath = resolve('public/content/daily/verified-levels.bin');
const manifestValue: unknown = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (!isDailyCatalogManifest(manifestValue)) {
  throw new Error(`Invalid Daily production manifest: ${manifestPath}`);
}

export const DAILY_PRODUCTION_MANIFEST: DailyCatalogManifest = manifestValue;
export const DAILY_PRODUCTION_CATALOG = createDailyCatalog(
  readFileSync(binaryPath),
  DAILY_PRODUCTION_MANIFEST,
);
export const DAILY_PRODUCTION_ENTRIES = DAILY_PRODUCTION_CATALOG.entries;
