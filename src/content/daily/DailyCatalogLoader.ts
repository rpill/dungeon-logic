import { isDailyCatalogManifest } from './CatalogFormat';
import { createDailyCatalog, type DailyCatalog } from './DailyCatalog';

export async function loadDailyCatalog(baseUrl?: string): Promise<DailyCatalog> {
  const base = normalizeBaseUrl(baseUrl ?? import.meta.env.BASE_URL);
  const manifestResponse = await fetch(
    `${base}content/daily/verified-levels-manifest.json`,
    { cache: 'force-cache' },
  );
  if (!manifestResponse.ok) {
    throw new Error(`Daily manifest returned HTTP ${manifestResponse.status}.`);
  }
  const manifestValue: unknown = await manifestResponse.json();
  if (!isDailyCatalogManifest(manifestValue)) {
    throw new Error('Daily manifest has an unsupported or invalid header.');
  }

  const binaryResponse = await fetch(
    `${base}content/daily/verified-levels.bin`,
    { cache: 'force-cache' },
  );
  if (!binaryResponse.ok) {
    throw new Error(`Daily catalog returned HTTP ${binaryResponse.status}.`);
  }

  return createDailyCatalog(await binaryResponse.arrayBuffer(), manifestValue);
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}
