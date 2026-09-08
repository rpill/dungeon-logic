import { resolve } from 'node:path';

import { auditReleaseDirectory, RELEASE_MAX_UNCOMPRESSED_BYTES } from './release-audit-lib.mjs';

const rootPath = resolve(process.argv[2] ?? 'dist');
const summary = await auditReleaseDirectory(rootPath);
const megabytes = (summary.totalBytes / 1_000_000).toFixed(2);
const ceilingMegabytes = (RELEASE_MAX_UNCOMPRESSED_BYTES / 1_000_000).toFixed(0);

console.info(
  `[Dungeon Logic] Release package audit passed: ${summary.fileCount} files, ${megabytes} MB / ${ceilingMegabytes} MB, root=${rootPath}`,
);
