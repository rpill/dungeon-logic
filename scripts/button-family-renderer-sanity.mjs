import fs from 'node:fs';

const primary = fs.readFileSync('src/runtime/PrimaryActionButton.ts', 'utf8');
const material = fs.readFileSync('src/runtime/MaterialActionButton.ts', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  primary.includes("const PRIMARY_BUTTON_FRAME = 'button-body-visible';")
    && primary.includes('PRIMARY_BUTTON_VISIBLE_FRAME.y')
    && primary.includes('PRIMARY_BUTTON_VISIBLE_FRAME.height'),
  'Primary renderer must crop only transparent vertical canvas padding while preserving the full horizontal end caps.',
);
assert(
  !primary.includes('PRIMARY_BUTTON_FRAME_X') && !primary.includes('PRIMARY_BUTTON_FRAME_RIGHT'),
  'Primary renderer must not keep legacy horizontal crop constants.',
);
assert(
  material.includes("export const MATERIAL_BUTTON_FRAME = 'button-body-full';")
    && material.includes('MATERIAL_BUTTON_VISIBLE_FRAME_Y[variant]')
    && material.includes('MATERIAL_BUTTON_VISIBLE_FRAME_HEIGHT[variant]'),
  'Material renderer must crop only transparent vertical canvas padding while preserving the full horizontal end caps.',
);
assert(
  !material.includes('MATERIAL_BUTTON_FRAME_INSET'),
  'Material renderer must not keep the legacy 24px end-cap crop.',
);
assert(
  primary.includes('const surfaceHeight = options.surfaceHeight ?? options.height;')
    && !primary.includes('PRIMARY_COMPACT_SURFACE_SCALE'),
  'Primary compact mode must not secretly inflate artwork beyond the declared button bounds.',
);
assert(
  material.includes('const surfaceHeight = options.surfaceHeight ?? options.height;')
    && !material.includes('MATERIAL_COMPACT_SURFACE_SCALE'),
  'Secondary/danger compact mode must not secretly inflate artwork beyond the declared button bounds.',
);
assert(
  material.includes('export function createMaterialButtonSurface(')
    && material.includes('export function layoutMaterialButtonSurface(')
    && material.includes('export function setMaterialButtonSurfaceState('),
  'Material button surfaces must be reusable by gameplay chrome so all standard buttons share the same textured family.',
);

console.log('[Dungeon Logic] Button family renderer sanity: PASS');
