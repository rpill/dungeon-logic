import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

export const RELEASE_MAX_UNCOMPRESSED_BYTES = 100_000_000;

const CYRILLIC_PATTERN = /\p{Script=Cyrillic}/u;
const WHITESPACE_PATTERN = /\s/u;
const ABSOLUTE_YANDEX_SDK_HOST = 'sdk.games.s3.yandex.net';

function assertValidRelativePath(relativePath) {
  const segments = relativePath.split(sep).filter(Boolean);
  for (const segment of segments) {
    if (WHITESPACE_PATTERN.test(segment)) {
      throw new Error(`Release path contains whitespace: ${relativePath}`);
    }
    if (CYRILLIC_PATTERN.test(segment)) {
      throw new Error(`Release path contains Cyrillic characters: ${relativePath}`);
    }
  }
}

async function collectFiles(rootPath, currentPath = rootPath) {
  const entries = await readdir(currentPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(currentPath, entry.name);
    const relativePath = relative(rootPath, absolutePath);
    assertValidRelativePath(relativePath);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(rootPath, absolutePath));
      continue;
    }

    if (!entry.isFile()) {
      throw new Error(`Release root contains unsupported filesystem entry: ${relativePath}`);
    }

    files.push({ absolutePath, relativePath });
  }

  return files;
}

function auditBuiltIndex(indexHtml) {
  if (/\b(?:src|href)\s*=\s*["']\/assets\//iu.test(indexHtml)) {
    throw new Error('Release index contains root-absolute /assets/ URLs; built JS/CSS must be package-relative for Yandex archive hosting.');
  }
  if (indexHtml.includes(ABSOLUTE_YANDEX_SDK_HOST)) {
    throw new Error('Release index uses the forbidden absolute Yandex SDK S3 URL; archive deployment must use /sdk.js.');
  }

  const scriptTags = indexHtml.match(/<script\b[^>]*>/giu) ?? [];
  let sdkTag = null;
  let hasAppEntryModule = false;

  for (const tag of scriptTags) {
    const srcMatch = /\bsrc\s*=\s*["']([^"']+)["']/iu.exec(tag);
    const src = srcMatch?.[1] ?? null;
    if (src === '/sdk.js') {
      sdkTag = tag;
    }

    if (
      src !== null &&
      /\btype\s*=\s*["']module["']/iu.test(tag) &&
      src !== '/sdk.js'
    ) {
      hasAppEntryModule = true;
    }
  }

  if (sdkTag === null) {
    throw new Error('Release index.html does not load the relative Yandex Games SDK path /sdk.js.');
  }

  if (/\b(?:async|defer)(?:\s|=|>)/iu.test(sdkTag)) {
    throw new Error('Dungeon Logic bootstrap requires the /sdk.js script to remain synchronous; async/defer would race YaGames.init().');
  }

  if (!hasAppEntryModule) {
    throw new Error('Release index.html does not contain a built application module entry.');
  }
}

export async function auditReleaseDirectory(rootPath) {
  let rootStats;
  try {
    rootStats = await stat(rootPath);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Release directory does not exist: ${rootPath}`);
    }
    throw error;
  }

  if (!rootStats.isDirectory()) {
    throw new Error(`Release path is not a directory: ${rootPath}`);
  }

  const files = await collectFiles(rootPath);
  const indexFile = files.find((file) => file.relativePath === 'index.html');
  if (indexFile === undefined) {
    throw new Error('Release root must contain index.html directly at archive root.');
  }

  let totalBytes = 0;
  for (const file of files) {
    const fileStats = await stat(file.absolutePath);
    totalBytes += fileStats.size;
    if (totalBytes > RELEASE_MAX_UNCOMPRESSED_BYTES) {
      throw new Error(
        `Release content exceeds the 100,000,000-byte uncompressed ceiling: ${totalBytes} bytes.`,
      );
    }
  }

  const indexHtml = await readFile(indexFile.absolutePath, 'utf8');
  auditBuiltIndex(indexHtml);

  return {
    rootPath,
    fileCount: files.length,
    totalBytes,
  };
}
