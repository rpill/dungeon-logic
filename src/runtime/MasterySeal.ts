import Phaser from 'phaser';

import type { MasteryRankId } from '../mastery/MasteryProgress';

const MASTERY_SEAL_KEYS = {
  I: 'mastery-seal-rank-i',
  II: 'mastery-seal-rank-ii',
  III: 'mastery-seal-rank-iii',
  IV: 'mastery-seal-rank-iv',
  V: 'mastery-seal-rank-v',
  VI: 'mastery-seal-rank-vi',
  VII: 'mastery-seal-rank-vii',
  VIII: 'mastery-seal-rank-viii',
  MASTER: 'mastery-seal-rank-master',
} as const satisfies Readonly<Record<MasteryRankId, string>>;

// Keep each rank on its own Phaser texture key even while several ranks reuse
// the current fallback artwork. Replacing a rank with a dedicated final asset
// is then a one-line path change instead of another component rewrite.
const MASTERY_SEAL_PATHS = {
  I: 'assets/ui/mastery_seal_stone.webp',
  II: 'assets/ui/mastery_seal_gold.webp',
  III: 'assets/ui/mastery_seal_steel.webp',
  IV: 'assets/ui/mastery_seal_steel.webp',
  V: 'assets/ui/mastery_seal_steel.webp',
  VI: 'assets/ui/mastery_seal_steel.webp',
  VII: 'assets/ui/mastery_seal_steel.webp',
  VIII: 'assets/ui/mastery_seal_gold.webp',
  MASTER: 'assets/ui/mastery_seal_master.webp',
} as const satisfies Readonly<Record<MasteryRankId, string>>;

export interface MasterySealOptions {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly rank: MasteryRankId;
  readonly depth?: number;
  readonly showRankPlaque?: boolean;
}

export interface MasterySealHandle {
  readonly image: Phaser.GameObjects.Image;
  destroy(): void;
}

export function preloadMasterySealAssets(scene: Phaser.Scene): void {
  for (const rank of Object.keys(MASTERY_SEAL_KEYS) as MasteryRankId[]) {
    scene.load.image(MASTERY_SEAL_KEYS[rank], MASTERY_SEAL_PATHS[rank]);
  }
}

function accentColorForRank(rank: MasteryRankId): number {
  switch (rank) {
    case 'II':
    case 'VIII':
    case 'MASTER':
      return 0xf0bd63;
    default:
      return 0x96a9c5;
  }
}

export function createMasterySeal(
  scene: Phaser.Scene,
  options: MasterySealOptions,
): MasterySealHandle {
  const depth = options.depth ?? 0;
  const showRankPlaque = options.showRankPlaque ?? true;
  const imageSize = options.size * (showRankPlaque ? 0.82 : 0.88);
  const imageY = options.y - (showRankPlaque ? options.size * 0.07 : 0);
  const image = scene.add.image(options.x, imageY, MASTERY_SEAL_KEYS[options.rank])
    .setDisplaySize(imageSize, imageSize)
    .setDepth(depth);

  if (!showRankPlaque) {
    return {
      image,
      destroy: () => image.destroy(),
    };
  }

  const plaque = scene.add.graphics().setDepth(depth + 1);
  const plaqueWidth = options.size * (options.rank === 'MASTER' ? 0.46 : 0.3);
  const plaqueHeight = options.size * 0.135;
  const plaqueY = options.y + options.size * 0.305;
  const plaqueRadius = plaqueHeight * 0.28;
  plaque.fillStyle(0x1b2942, 0.98);
  plaque.lineStyle(Math.max(1.25, options.size * 0.01), accentColorForRank(options.rank), 0.96);
  plaque.fillRoundedRect(
    options.x - plaqueWidth / 2,
    plaqueY - plaqueHeight / 2,
    plaqueWidth,
    plaqueHeight,
    plaqueRadius,
  );
  plaque.strokeRoundedRect(
    options.x - plaqueWidth / 2,
    plaqueY - plaqueHeight / 2,
    plaqueWidth,
    plaqueHeight,
    plaqueRadius,
  );

  const rankLabel = scene.add.text(options.x, plaqueY, options.rank, {
    fontFamily: 'monospace',
    fontSize: `${Math.round(options.size * (options.rank === 'MASTER' ? 0.068 : 0.096))}px`,
    color: '#fff0c1',
    fontStyle: 'bold',
    align: 'center',
  }).setOrigin(0.5).setDepth(depth + 2);

  return {
    image,
    destroy: () => {
      rankLabel.destroy();
      plaque.destroy();
      image.destroy();
    },
  };
}
