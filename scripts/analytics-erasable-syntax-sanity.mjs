import { readFileSync } from 'node:fs';

const analyticsService = readFileSync(
  new URL('../src/analytics/AnalyticsService.ts', import.meta.url),
  'utf8',
);
const puzzleSession = readFileSync(
  new URL('../src/analytics/PuzzleAnalyticsSession.ts', import.meta.url),
  'utf8',
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const [name, source] of [
  ['AnalyticsService', analyticsService],
  ['PuzzleAnalyticsSession', puzzleSession],
]) {
  const constructors = [...source.matchAll(/constructor\s*\(([\s\S]*?)\)\s*\{/g)];
  assert(constructors.length > 0, `${name} must declare a constructor.`);
  for (const match of constructors) {
    assert(
      !/(?:^|[,\n]\s*)(?:private|public|protected|readonly)\s+\w+\s*:/m.test(match[1]),
      `${name} must not use TypeScript parameter properties when erasableSyntaxOnly is enabled.`,
    );
  }
}

assert(
  analyticsService.includes('private readonly transport: AnalyticsTransport;'),
  'AnalyticsService must declare transport as an ordinary class field.',
);
assert(
  analyticsService.includes('constructor(transport: AnalyticsTransport)') &&
    analyticsService.includes('this.transport = transport;'),
  'AnalyticsService constructor must assign transport explicitly.',
);

assert(
  puzzleSession.includes('private readonly analytics: AnalyticsService;') &&
    puzzleSession.includes('readonly context: AnalyticsPuzzleContext;') &&
    puzzleSession.includes('readonly attempt: PuzzleAttemptKind;'),
  'PuzzleAnalyticsSession must declare analytics, context, and attempt as ordinary class fields.',
);
assert(
  puzzleSession.includes('this.analytics = analytics;') &&
    puzzleSession.includes('this.context = context;') &&
    puzzleSession.includes('this.attempt = attempt;'),
  'PuzzleAnalyticsSession constructor must assign all ordinary class fields explicitly.',
);

console.info('Analytics erasable syntax sanity: PASS');
