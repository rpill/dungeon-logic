import Phaser from 'phaser';

import type { MasteryRankId } from '../mastery/MasteryProgress';

type MasterySealTextureVariant = 'default' | 'small';
export type MasteryGlowVariant = 'page' | 'rankup';

const MASTERY_GLOW_KEYS: Readonly<Record<MasteryGlowVariant, string>> = {
  page: 'mastery-light-rays-page',
  rankup: 'mastery-light-rays-rankup',
};

const MASTERY_EDGE_GLOW_KEYS = {
  I: 'mastery-edge-glow-rank-i',
  II: 'mastery-edge-glow-rank-ii',
  III: 'mastery-edge-glow-rank-iii',
  IV: 'mastery-edge-glow-rank-iv',
  V: 'mastery-edge-glow-rank-v',
  VI: 'mastery-edge-glow-rank-vi',
  VII: 'mastery-edge-glow-rank-vii',
  VIII: 'mastery-edge-glow-rank-viii',
  MASTER: 'mastery-edge-glow-rank-master',
} as const satisfies Readonly<Record<MasteryRankId, string>>;

const DEFAULT_MASTERY_SEAL_KEYS = {
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

const SMALL_MASTERY_SEAL_KEYS = {
  I: 'mastery-seal-small-rank-i',
  II: 'mastery-seal-small-rank-ii',
  III: 'mastery-seal-small-rank-iii',
  IV: 'mastery-seal-small-rank-iv',
  V: 'mastery-seal-small-rank-v',
  VI: 'mastery-seal-small-rank-vi',
  VII: 'mastery-seal-small-rank-vii',
  VIII: 'mastery-seal-small-rank-viii',
  MASTER: 'mastery-seal-small-rank-master',
} as const satisfies Readonly<Record<MasteryRankId, string>>;

const DEFAULT_MASTERY_SEAL_PATHS = {
  I: 'assets/ui/mastery_seal_rank_i.webp',
  II: 'assets/ui/mastery_seal_rank_ii.webp',
  III: 'assets/ui/mastery_seal_rank_iii.webp',
  IV: 'assets/ui/mastery_seal_rank_iv.webp',
  V: 'assets/ui/mastery_seal_rank_v.webp',
  VI: 'assets/ui/mastery_seal_rank_vi.webp',
  VII: 'assets/ui/mastery_seal_rank_vii.webp',
  VIII: 'assets/ui/mastery_seal_rank_viii.webp',
  MASTER: 'assets/ui/mastery_seal_rank_master.webp',
} as const satisfies Readonly<Record<MasteryRankId, string>>;

const SMALL_MASTERY_SEAL_PATHS = {
  I: 'assets/ui/mastery_seal_rank_i.webp',
  II: 'assets/ui/mastery_seal_rank_ii.webp',
  III: 'assets/ui/mastery_seal_rank_iii.webp',
  IV: 'assets/ui/mastery_seal_rank_iv.webp',
  V: 'assets/ui/mastery_seal_rank_v.webp',
  VI: 'assets/ui/mastery_seal_rank_vi.webp',
  VII: 'assets/ui/mastery_seal_rank_vii.webp',
  VIII: 'assets/ui/mastery_seal_rank_viii.webp',
  MASTER: 'assets/ui/mastery_seal_rank_master.webp',
} as const satisfies Readonly<Record<MasteryRankId, string>>;

const MASTERY_EDGE_GLOW_PATHS = {
  I: 'assets/ui/mastery_seal_edge_stone.webp',
  II: 'assets/ui/mastery_seal_edge_gold.webp',
  III: 'assets/ui/mastery_seal_edge_steel.webp',
  IV: 'assets/ui/mastery_seal_edge_steel.webp',
  V: 'assets/ui/mastery_seal_edge_steel.webp',
  VI: 'assets/ui/mastery_seal_edge_steel.webp',
  VII: 'assets/ui/mastery_seal_edge_steel.webp',
  VIII: 'assets/ui/mastery_seal_edge_gold.webp',
  MASTER: 'assets/ui/mastery_seal_edge_master.webp',
} as const satisfies Readonly<Record<MasteryRankId, string>>;

export interface MasterySealOptions {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly rank: MasteryRankId;
  readonly depth?: number;
  readonly showRankPlaque?: boolean;
  readonly plaqueLabel?: string;
  readonly textureVariant?: MasterySealTextureVariant;
}

export interface MasterySealHandle {
  readonly image: Phaser.GameObjects.Image;
  destroy(): void;
}

export function preloadMasterySealAssets(scene: Phaser.Scene): void {
  scene.load.image(MASTERY_GLOW_KEYS.page, 'assets/ui/mastery_light_rays_page.webp');
  scene.load.image(MASTERY_GLOW_KEYS.rankup, 'assets/ui/mastery_light_rays_rankup.webp');
  for (const rank of Object.keys(DEFAULT_MASTERY_SEAL_KEYS) as MasteryRankId[]) {
    scene.load.image(DEFAULT_MASTERY_SEAL_KEYS[rank], DEFAULT_MASTERY_SEAL_PATHS[rank]);
    scene.load.image(SMALL_MASTERY_SEAL_KEYS[rank], SMALL_MASTERY_SEAL_PATHS[rank]);
    scene.load.image(MASTERY_EDGE_GLOW_KEYS[rank], MASTERY_EDGE_GLOW_PATHS[rank]);
  }
}

export interface MasteryGlowOptions {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly depth?: number;
  readonly alpha?: number;
  readonly variant?: MasteryGlowVariant;
}

export function createMasteryGlow(
  scene: Phaser.Scene,
  options: MasteryGlowOptions,
): Phaser.GameObjects.Image {
  const variant = options.variant ?? 'page';
  const image = scene.add.image(options.x, options.y, MASTERY_GLOW_KEYS[variant])
    .setDisplaySize(options.size, options.size)
    .setAlpha(options.alpha ?? (variant === 'rankup' ? 0.78 : 0.62))
    .setDepth(options.depth ?? 0);

  scene.tweens.add({
    targets: image,
    angle: 360,
    duration: variant === 'rankup' ? 14000 : 32000,
    repeat: -1,
    ease: 'Linear',
  });

  image.once('destroy', () => scene.tweens.killTweensOf(image));
  return image;
}

export interface MasteryEdgeGlowOptions {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly rank: MasteryRankId;
  readonly depth?: number;
  readonly alpha?: number;
  readonly textureVariant?: MasterySealTextureVariant;
}

export interface MasteryEdgeGlowHandle {
  destroy(): void;
}

export function createMasteryEdgeGlow(
  scene: Phaser.Scene,
  options: MasteryEdgeGlowOptions,
): MasteryEdgeGlowHandle {
  const depth = options.depth ?? 0;
  const alpha = options.alpha ?? 0.18;
  const textureKey = MASTERY_EDGE_GLOW_KEYS[options.rank];
  const imageY = options.y - options.size * 0.07;
  const image = scene.add.image(options.x, imageY, textureKey)
    .setDisplaySize(options.size * 0.9, options.size * 0.9)
    .setAlpha(alpha)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(depth);

  scene.tweens.add({
    targets: image,
    alpha: { from: alpha * 0.42, to: alpha * 1.95 },
    duration: 650,
    yoyo: true,
    repeat: -1,
    hold: 60,
    ease: 'Sine.easeInOut',
  });

  image.once('destroy', () => scene.tweens.killTweensOf(image));

  return {
    destroy: () => image.destroy(),
  };
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

function resolveTextureKey(rank: MasteryRankId, variant: MasterySealTextureVariant): string {
  return variant === 'small' ? SMALL_MASTERY_SEAL_KEYS[rank] : DEFAULT_MASTERY_SEAL_KEYS[rank];
}

export function createMasterySeal(
  scene: Phaser.Scene,
  options: MasterySealOptions,
): MasterySealHandle {
  const depth = options.depth ?? 0;
  const showRankPlaque = options.showRankPlaque ?? true;
  const textureVariant = options.textureVariant ?? 'default';
  const imageSize = options.size * (showRankPlaque ? 0.9 : textureVariant === 'small' ? 0.96 : 0.88);
  const imageY = options.y - (showRankPlaque ? options.size * 0.07 : 0);
  const image = scene.add.image(options.x, imageY, resolveTextureKey(options.rank, textureVariant))
    .setDisplaySize(imageSize, imageSize)
    .setDepth(depth);

  if (!showRankPlaque) {
    return {
      image,
      destroy: () => image.destroy(),
    };
  }

  const plaque = scene.add.graphics().setDepth(depth + 1);
  const plaqueLabel = options.plaqueLabel ?? options.rank;
  const masterPlaqueWidth = Math.min(0.7, Math.max(0.46, 0.28 + plaqueLabel.length * 0.035));
  const plaqueWidth = options.size * (options.rank === 'MASTER' ? masterPlaqueWidth : 0.3);
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

  const rankLabel = scene.add.text(options.x, plaqueY, plaqueLabel, {
    fontFamily: "'Balsamiq Sans', sans-serif",
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
