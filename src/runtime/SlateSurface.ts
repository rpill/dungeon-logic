import Phaser from 'phaser';

const SLATE_SURFACE_KEY = 'ui-slate-surface-m1';

// Source 736 × 440. Only the quiet center stretches; chipped edges stay in the caps.
export const SLATE_SURFACE_SLICE = { x: 72, y: 68 } as const;

export function preloadSlateSurfaceAsset(scene: Phaser.Scene): void {
  scene.load.image(SLATE_SURFACE_KEY, 'assets/ui/slate_surface_m1.webp');
}

export function createSlateSurface(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha = 1,
): Phaser.GameObjects.NineSlice {
  const source = scene.textures.get(SLATE_SURFACE_KEY).get();
  const scale = height / source.height;
  return scene.add.nineslice(
    x, y, SLATE_SURFACE_KEY, undefined,
    width / scale, source.height,
    SLATE_SURFACE_SLICE.x, SLATE_SURFACE_SLICE.x,
    SLATE_SURFACE_SLICE.y, SLATE_SURFACE_SLICE.y,
  ).setScale(scale).setAlpha(alpha);
}
