import type Phaser from 'phaser';

export type SceneBackgroundKind = 'meta';

type BackgroundVariant = 'desktop' | 'mobile';

interface SceneBackgroundAsset {
  readonly key: string;
  readonly path: string;
}

const SCENE_BACKGROUND_ASSETS: Record<SceneBackgroundKind, Record<BackgroundVariant, SceneBackgroundAsset>> = {
  meta: {
    desktop: {
      key: 'background-meta-desktop',
      path: 'assets/backgrounds/meta/bg_meta_desktop.webp',
    },
    mobile: {
      key: 'background-meta-mobile',
      path: 'assets/backgrounds/meta/bg_meta_mobile.webp',
    },
  },
};

export interface BackgroundCoverSize {
  readonly width: number;
  readonly height: number;
}

export function getSceneBackgroundAsset(
  kind: SceneBackgroundKind,
  viewportWidth: number,
  viewportHeight: number,
): SceneBackgroundAsset {
  const variant: BackgroundVariant = viewportHeight > viewportWidth ? 'mobile' : 'desktop';
  return SCENE_BACKGROUND_ASSETS[kind][variant];
}

export function calculateBackgroundCoverSize(
  sourceWidth: number,
  sourceHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): BackgroundCoverSize {
  if (sourceWidth <= 0 || sourceHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    throw new RangeError('Background and viewport dimensions must be positive.');
  }

  const scale = Math.max(viewportWidth / sourceWidth, viewportHeight / sourceHeight);
  return {
    width: sourceWidth * scale,
    height: sourceHeight * scale,
  };
}

export function preloadSceneBackgrounds(scene: Phaser.Scene): void {
  for (const kind of Object.keys(SCENE_BACKGROUND_ASSETS) as SceneBackgroundKind[]) {
    const asset = getSceneBackgroundAsset(kind, scene.scale.width, scene.scale.height);
    scene.load.image(asset.key, asset.path);
  }
}

const backgroundPrefetchWaiters = new Map<string, Set<() => void>>();

function prefetchSceneBackgroundAsset(
  scene: Phaser.Scene,
  asset: SceneBackgroundAsset,
  onReady: () => void,
): void {
  if (scene.textures.exists(asset.key)) {
    onReady();
    return;
  }

  const existingWaiters = backgroundPrefetchWaiters.get(asset.key);
  if (existingWaiters !== undefined) {
    existingWaiters.add(onReady);
    return;
  }

  const waiters = new Set<() => void>([onReady]);
  backgroundPrefetchWaiters.set(asset.key, waiters);

  const handleLoadError = (file: Phaser.Loader.File): void => {
    if (file.key !== asset.key) return;
    console.warn(`[Dungeon Logic] Optional background prefetch failed: ${asset.path}`);
  };

  scene.load.on('loaderror', handleLoadError);
  scene.load.once('complete', () => {
    scene.load.off('loaderror', handleLoadError);
    const callbacks = backgroundPrefetchWaiters.get(asset.key);
    backgroundPrefetchWaiters.delete(asset.key);
    if (!scene.textures.exists(asset.key) || callbacks === undefined) return;
    callbacks.forEach((callback) => callback());
  });
  scene.load.image(asset.key, asset.path);
  scene.load.start();
}

function prefetchAlternateSceneBackground(
  scene: Phaser.Scene,
  kind: SceneBackgroundKind,
  loadedKey: string,
  onReady: () => void,
): void {
  const alternate = Object.values(SCENE_BACKGROUND_ASSETS[kind])
    .find((asset) => asset.key !== loadedKey);
  if (alternate === undefined) return;
  prefetchSceneBackgroundAsset(scene, alternate, onReady);
}

function resolveLoadedSceneBackgroundAsset(
  scene: Phaser.Scene,
  kind: SceneBackgroundKind,
  desired: SceneBackgroundAsset,
): SceneBackgroundAsset {
  if (scene.textures.exists(desired.key)) return desired;

  return Object.values(SCENE_BACKGROUND_ASSETS[kind])
    .find((asset) => scene.textures.exists(asset.key))
    ?? desired;
}

export interface SceneBackgroundHandle {
  readonly image: Phaser.GameObjects.Image;
  sync(): void;
}

export function createSceneBackground(
  scene: Phaser.Scene,
  kind: SceneBackgroundKind,
): SceneBackgroundHandle {
  const desiredInitialAsset = getSceneBackgroundAsset(kind, scene.scale.width, scene.scale.height);
  const initialAsset = resolveLoadedSceneBackgroundAsset(scene, kind, desiredInitialAsset);
  const image = scene.add.image(scene.scale.width / 2, scene.scale.height / 2, initialAsset.key)
    .setOrigin(0.5)
    .setDepth(-1000);

  const sync = (): void => {
    if (!image.active) return;

    const desiredAsset = getSceneBackgroundAsset(kind, scene.scale.width, scene.scale.height);
    const asset = resolveLoadedSceneBackgroundAsset(scene, kind, desiredAsset);
    if (scene.textures.exists(asset.key) && image.texture.key !== asset.key) {
      image.setTexture(asset.key);
    }

    const cover = calculateBackgroundCoverSize(
      image.width,
      image.height,
      scene.scale.width,
      scene.scale.height,
    );
    image
      .setPosition(scene.scale.width / 2, scene.scale.height / 2)
      .setDisplaySize(cover.width, cover.height);
  };

  sync();
  prefetchAlternateSceneBackground(scene, kind, initialAsset.key, sync);
  return { image, sync };
}
