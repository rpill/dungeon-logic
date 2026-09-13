import {
  isEndlessCatalogManifest,
} from './CatalogFormat';
import {
  createEndlessCatalog,
  type EndlessCatalog,
} from './EndlessCatalog';

export async function loadEndlessCatalog(
  baseUrl?: string,
): Promise<EndlessCatalog> {
  const base = normalizeBaseUrl(
    baseUrl ?? import.meta.env.BASE_URL,
  );
  const manifestResponse = await fetch(
    `${base}content/endless/verified-levels-manifest.json`,
    { cache: 'force-cache' },
  );
  if (!manifestResponse.ok) {
    throw new Error(
      `Endless manifest returned HTTP ${manifestResponse.status}.`,
    );
  }
  const manifestValue: unknown =
    await manifestResponse.json();
  if (!isEndlessCatalogManifest(manifestValue)) {
    throw new Error(
      'Endless manifest has an unsupported or invalid header.',
    );
  }

  const binaryResponse = await fetch(
    `${base}content/endless/verified-levels.bin`,
    { cache: 'force-cache' },
  );
  if (!binaryResponse.ok) {
    throw new Error(
      `Endless catalog returned HTTP ${binaryResponse.status}.`,
    );
  }

  return createEndlessCatalog(
    await binaryResponse.arrayBuffer(),
    manifestValue,
  );
}

function normalizeBaseUrl(
  baseUrl: string,
): string {
  return baseUrl.endsWith('/')
    ? baseUrl
    : `${baseUrl}/`;
}
