import type Phaser from 'phaser';

export type SceneBackgroundKind = 'meta' | 'gameplay';

type BackgroundVariant = 'desktop' | 'mobile';

interface SceneBackgroundAsset {
  readonly key: string;
  readonly path: string;
}

const SCENE_BACKGROUND_ASSETS: Record<SceneBackgroundKind, Record<BackgroundVariant, SceneBackgroundAsset>> = {
  meta: {
    desktop: {
      key: 'background-meta-desktop',
      path: '/assets/backgrounds/meta/bg_meta_desktop.png',
    },
    mobile: {
      key: 'background-meta-mobile',
      path: '/assets/backgrounds/meta/bg_meta_mobile.png',
    },
  },
  gameplay: {
    desktop: {
      key: 'background-gameplay-desktop',
      path: '/assets/backgrounds/gameplay/bg_gameplay_desktop.png',
    },
    mobile: {
      key: 'background-gameplay-mobile',
      path: '/assets/backgrounds/gameplay/bg_gameplay_mobile.png',
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
  for (const family of Object.values(SCENE_BACKGROUND_ASSETS)) {
    for (const asset of Object.values(family)) {
      scene.load.image(asset.key, asset.path);
    }
  }
}

export interface SceneBackgroundHandle {
  readonly image: Phaser.GameObjects.Image;
  sync(): void;
}

export function createSceneBackground(
  scene: Phaser.Scene,
  kind: SceneBackgroundKind,
): SceneBackgroundHandle {
  const initialAsset = getSceneBackgroundAsset(kind, scene.scale.width, scene.scale.height);
  const image = scene.add.image(scene.scale.width / 2, scene.scale.height / 2, initialAsset.key)
    .setOrigin(0.5)
    .setDepth(-1000);

  const sync = (): void => {
    const asset = getSceneBackgroundAsset(kind, scene.scale.width, scene.scale.height);
    if (image.texture.key !== asset.key) image.setTexture(asset.key);

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
  return { image, sync };
}
