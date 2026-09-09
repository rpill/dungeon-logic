import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { auditReleaseDirectory, RELEASE_MAX_UNCOMPRESSED_BYTES } from './release-audit-lib.mjs';

export const RELEASE_SANITY_SCRIPTS = Object.freeze([
  'sanity:release-audit',
  'sanity:platform',
  'sanity:platform-gameplay',
  'sanity:i18n',
  'sanity:profile',
  'sanity:settings',
  'sanity:campaign',
  'sanity:campaign-theme',
  'sanity:campaign-promotion',
  'sanity:release-curation',
  'sanity:campaign-runtime',
  'sanity:campaign-release',
  'sanity:campaign-unlock',
  'sanity:daily',
  'sanity:daily-calendar',
  'sanity:daily-corpus',
  'sanity:stats',
  'sanity:responsive-shell',
  'sanity:live-resize',
  'sanity:level-select-scroll',
  'sanity:wireframe-ui',
  'sanity:pointer-policy',
  'sanity:puzzle-interaction',
  'sanity:puzzle-session',
  'sanity:campaign-playstate',
  'sanity:onboarding',
  'sanity:help-rules',
  'sanity:hint',
  'sanity:game-regressions',
  'sanity:meta-navigation',
  'sanity:meta-scroll',
  'sanity:meta-pointer-gate',
  'sanity:board-visual',
  'sanity:monetization',
  'sanity:rewarded-hint',
  'sanity:human',
  'sanity:difficulty',
]);

export function getNpmInvocation({
  platform = process.platform,
  execPath = process.execPath,
  env = process.env,
} = {}) {
  const npmExecPath = typeof env.npm_execpath === 'string' ? env.npm_execpath.trim() : '';
  if (npmExecPath.length > 0) {
    return {
      command: execPath,
      argsPrefix: [npmExecPath],
    };
  }

  if (platform === 'win32') {
    const commandShell = (env.ComSpec ?? env.COMSPEC ?? 'cmd.exe').trim() || 'cmd.exe';
    return {
      command: commandShell,
      argsPrefix: ['/d', '/s', '/c', 'npm'],
    };
  }

  return {
    command: 'npm',
    argsPrefix: [],
  };
}

function runNpmScript(scriptName) {
  const invocation = getNpmInvocation();
  console.info(`\n[Dungeon Logic] Release gate -> npm run ${scriptName}`);
  const result = spawnSync(
    invocation.command,
    [...invocation.argsPrefix, 'run', scriptName],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    },
  );

  if (result.error !== undefined) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Release gate failed at npm run ${scriptName} (exit ${result.status ?? 'unknown'}).`);
  }
}

export async function runReleaseAcceptance({
  runScript = runNpmScript,
  audit = auditReleaseDirectory,
  log = console.info,
} = {}) {
  for (const sanityScript of RELEASE_SANITY_SCRIPTS) {
    await runScript(sanityScript);
  }

  await runScript('build');

  const distPath = resolve('dist');
  const summary = await audit(distPath);
  log(
    `\n[Dungeon Logic] Release acceptance passed: ${summary.fileCount} files, ${(summary.totalBytes / 1_000_000).toFixed(2)} MB / ${(RELEASE_MAX_UNCOMPRESSED_BYTES / 1_000_000).toFixed(0)} MB.`,
  );
  log('[Dungeon Logic] Next: complete docs/release/yandex-release-acceptance-v1.md in the hosted Yandex draft before moderation.');
  return summary;
}

const invokedPath = process.argv[1] === undefined ? null : resolve(process.argv[1]);
if (invokedPath !== null && fileURLToPath(import.meta.url) === invokedPath) {
  await runReleaseAcceptance();
}
