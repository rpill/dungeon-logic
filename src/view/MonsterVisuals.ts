export type MonsterSkinId = 'monster_pink' | 'ghost' | 'slime';

export const MONSTER_VISUAL_POOLS: Readonly<Record<number, readonly MonsterSkinId[]>> = {
  1: ['monster_pink', 'ghost', 'slime'],
};

const MONSTER_VISUAL_VERSION_BY_LEVEL: Readonly<Record<string, number>> = {};
const CAMPAIGN_COMPOSITION_SALT = 'campaign-monster-composition-v3';

export function getMonsterVisualVersion(levelId: string): number {
  return MONSTER_VISUAL_VERSION_BY_LEVEL[levelId] ?? 1;
}

function hashMonsterValue(value: string): number {
  let hash = 2_166_136_261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function hashMonsterCell(levelId: string, x: number, y: number): number {
  return hashMonsterValue(`${levelId}:${x}:${y}`);
}

function monsterPool(version: number): readonly MonsterSkinId[] {
  return MONSTER_VISUAL_POOLS[version] ?? MONSTER_VISUAL_POOLS[1]!;
}

function orderedMonsterSkins(levelId: string, version: number): readonly MonsterSkinId[] {
  const pool = monsterPool(version);
  const start = hashMonsterValue(`${levelId}:primary:${version}`) % pool.length;
  return Array.from({ length: pool.length }, (_, offset) => pool[(start + offset) % pool.length]!);
}

function rankedMonsterIndices(levelId: string, monsterCount: number, salt: string): readonly number[] {
  return Array.from({ length: monsterCount }, (_, index) => index).sort((left, right) => {
    const leftHash = hashMonsterValue(`${levelId}:${salt}:${left}`);
    const rightHash = hashMonsterValue(`${levelId}:${salt}:${right}`);
    return leftHash === rightHash ? left - right : leftHash - rightHash;
  });
}

export function getCampaignMonsterTypeCount(
  levelId: string,
  monsterCount: number,
  version = getMonsterVisualVersion(levelId),
): number {
  if (!levelId.startsWith('campaign-') || monsterCount <= 0) {
    return 0;
  }

  const poolSize = monsterPool(version).length;
  const bucket = hashMonsterValue(`${levelId}:${CAMPAIGN_COMPOSITION_SALT}`) % 100;
  let desiredTypeCount = bucket < 65 ? 1 : bucket < 95 ? 2 : 3;

  // Two monsters cannot show two types while still having a dominant primary skin,
  // so those very small encounters stay visually unified.
  if (monsterCount === 2 && desiredTypeCount === 2) {
    desiredTypeCount = 1;
  }

  return Math.min(desiredTypeCount, monsterCount, poolSize);
}

export function resolveMonsterSkin(
  levelId: string,
  x: number,
  y: number,
  version = getMonsterVisualVersion(levelId),
): MonsterSkinId {
  const pool = monsterPool(version);
  return pool[hashMonsterCell(levelId, x, y) % pool.length]!;
}

export function resolveMonsterSkinForLevel(
  levelId: string,
  x: number,
  y: number,
  monsterIndex: number,
  monsterCount: number,
  version = getMonsterVisualVersion(levelId),
): MonsterSkinId {
  if (levelId.startsWith('tutorial-')) {
    return 'monster_pink';
  }

  if (!levelId.startsWith('campaign-') || monsterIndex < 0 || monsterCount <= 0) {
    return resolveMonsterSkin(levelId, x, y, version);
  }

  const skins = orderedMonsterSkins(levelId, version);
  const typeCount = getCampaignMonsterTypeCount(levelId, monsterCount, version);
  const primary = skins[0]!;

  if (typeCount <= 1) {
    return primary;
  }

  const ranked = rankedMonsterIndices(levelId, monsterCount, 'minority-placement-v1');

  if (typeCount === 2) {
    const secondaryCount = Math.max(1, Math.floor(monsterCount / 3));
    return ranked.slice(0, secondaryCount).includes(monsterIndex) ? skins[1]! : primary;
  }

  if (monsterIndex === ranked[0]) {
    return skins[1]!;
  }
  if (monsterIndex === ranked[1]) {
    return skins[2]!;
  }
  return primary;
}
