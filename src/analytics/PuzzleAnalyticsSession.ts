import type {
  AnalyticsPuzzleContext,
  AnalyticsService,
  HintAnalyticsSource,
  PuzzleAttemptKind,
} from './AnalyticsService';

export function classifyPuzzleAttempt(input: {
  readonly explicitReplay: boolean;
  readonly hasCompatibleDraft: boolean;
  readonly alreadySolved: boolean;
}): PuzzleAttemptKind {
  if (input.explicitReplay) return 'replay';
  if (input.hasCompatibleDraft) return 'resume';
  if (input.alreadySolved) return 'replay';
  return 'new';
}

export class PuzzleAnalyticsSession {
  private readonly analytics: AnalyticsService;
  readonly context: AnalyticsPuzzleContext;
  readonly attempt: PuzzleAttemptKind;
  private started = false;
  private completed = false;

  constructor(
    analytics: AnalyticsService,
    context: AnalyticsPuzzleContext,
    attempt: PuzzleAttemptKind,
  ) {
    this.analytics = analytics;
    this.context = context;
    this.attempt = attempt;
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.analytics.puzzleStart(this.context, this.attempt);
  }

  hintGranted(source: HintAnalyticsSource, hintsUsedInAttempt: number): void {
    if (this.completed) return;
    this.analytics.hintUsed(this.context, source, hintsUsedInAttempt);
  }

  reset(elapsedMs: number, editsBeforeReset: number): void {
    if (this.completed) return;
    this.analytics.puzzleReset(this.context, { elapsedMs, editsBeforeReset });
  }

  complete(input: {
    readonly elapsedMs: number;
    readonly hintsUsed: number;
    readonly firstClear: boolean;
    readonly persisted: boolean;
  }): void {
    if (this.completed) return;
    this.completed = true;
    this.analytics.puzzleComplete(this.context, { attempt: this.attempt, ...input });
  }
}
