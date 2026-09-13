import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const responsive = readFileSync('src/runtime/ResponsiveLayout.ts', 'utf8');
const daily = readFileSync('src/runtime/DailyHubLayout.ts', 'utf8');

assert(
  responsive.includes('const gapY = 22;'),
  'Portrait Levels layout must use a 22px vertical card gap.',
);
assert(
  responsive.includes("const gapX = 16;"),
  'Portrait Levels horizontal spacing must remain unchanged at 16px.',
);
assert(
  daily.includes('const rowGap = vertical.rowGap + (narrow ? 8 : 0);'),
  'Daily mobile layout must add 8px only to vertical row spacing.',
);
assert(
  daily.includes('Math.max(0, rows - 1) * rowGap'),
  'Daily height calculation must use the mobile-adjusted row gap.',
);
assert(
  daily.includes('const rowPitch = cellSize + vertical.numberGap + vertical.numberHeight + rowGap;'),
  'Daily row pitch must use the mobile-adjusted row gap.',
);
assert(
  daily.includes('rowGap,'),
  'Daily layout result must expose the adjusted row gap.',
);
assert(
  daily.includes('columnGap: vertical.columnGap,'),
  'Daily horizontal column gap must remain unchanged.',
);

console.info('[Dungeon Logic] Mobile vertical spacing sanity: Levels + Daily passed');
