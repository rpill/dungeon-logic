import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { promotedCampaignLevels } from '../content/campaign/levels';
import type { GeneratorRunReport } from '../puzzle/generator/types';
import {
  parseCampaignPromotionArgs,
  promoteCampaignLevel,
  type CampaignPromotionFs,
} from './CampaignPromotion';

const fsAdapter: CampaignPromotionFs = {
  readFile: (path, encoding) => readFile(path, encoding),
  writeFile: (path, data, encoding) => writeFile(path, data, encoding),
  rename: (from, to) => rename(from, to),
  unlink: (path) => unlink(path),
};

async function main(): Promise<void> {
  const args = parseCampaignPromotionArgs(process.argv.slice(2));
  const reportPath = resolve('.generated', `candidates-${args.seed}.json`);
  const levelsDir = resolve('src', 'content', 'campaign', 'levels');

  const report = JSON.parse(await readFile(reportPath, 'utf8')) as GeneratorRunReport;
  const result = await promoteCampaignLevel({
    seed: args.seed,
    candidateId: args.candidateId,
    slot: args.slot,
    replace: args.replace,
    report,
    registry: promotedCampaignLevels,
    levelsDir,
  }, fsAdapter);

  console.info(
    `[Dungeon Logic] Promoted ${args.candidateId} from seed ${args.seed} to ${result.source.level.id}.`,
  );
}

main().catch((error) => {
  console.error('[Dungeon Logic] Campaign promotion failed.', error);
  process.exitCode = 1;
});
