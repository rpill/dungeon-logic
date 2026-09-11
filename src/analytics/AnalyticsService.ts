import type { SupportedLanguage } from '../i18n/Language';
import type { InterstitialResult, RewardedResult } from '../platform/services';
import type {
  AnalyticsGoalName,
  AnalyticsParams,
  AnalyticsTransport,
} from './AnalyticsTransport';

export const ANALYTICS_SERVICE_REGISTRY_KEY = 'analytics-service';

export type AnalyticsScreen =
  | 'home'
  | 'levels'
  | 'daily'
  | 'statistics'
  | 'leaderboard'
  | 'settings'
  | 'help';

export type PuzzleAttemptKind = 'new' | 'resume' | 'replay';
export type HintAnalyticsSource = 'free' | 'rewarded';

export type AnalyticsPuzzleContext =
  | { readonly mode: 'campaign'; readonly puzzleId: string; readonly slot: number }
  | { readonly mode: 'tutorial'; readonly puzzleId: string }
  | {
      readonly mode: 'daily';
      readonly puzzleId: string;
      readonly dateKey: string;
      readonly ranked: boolean;
      readonly archive: boolean;
    };

export type TechnicalErrorCode =
  | 'platform_init_failed'
  | 'profile_load_failed'
  | 'profile_save_failed'
  | 'readiness_failed'
  | 'gameplay_api_failed'
  | 'leaderboard_submit_failed'
  | 'leaderboard_load_failed'
  | 'interstitial_request_failed'
  | 'rewarded_request_failed';

export type TechnicalErrorArea = 'platform' | 'profile' | 'lifecycle' | 'leaderboard' | 'ads';
export type TechnicalErrorContext = Readonly<Pick<AnalyticsPuzzleContext, 'mode' | 'puzzleId'>>;
export type TechnicalErrorReporter = (
  code: TechnicalErrorCode,
  area: TechnicalErrorArea,
  context?: TechnicalErrorContext,
) => void;

function secondsFromMs(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.floor(Math.max(0, value) / 1000);
}

function nonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.floor(Math.max(0, value));
}

function puzzleParams(context: AnalyticsPuzzleContext): AnalyticsParams {
  if (context.mode === 'campaign') {
    return { mode: 'campaign', puzzle_id: context.puzzleId, slot: context.slot };
  }
  if (context.mode === 'tutorial') {
    return { mode: 'tutorial', puzzle_id: context.puzzleId };
  }
  return {
    mode: 'daily',
    puzzle_id: context.puzzleId,
    ranked: context.ranked,
    archive: context.archive,
    date_key: context.dateKey,
  };
}

export class AnalyticsService {
  private readonly transport: AnalyticsTransport;
  private gameReadySent = false;
  private readonly technicalErrorsSent = new Set<TechnicalErrorCode>();

  constructor(transport: AnalyticsTransport) {
    this.transport = transport;
  }

  private send(name: AnalyticsGoalName, params: AnalyticsParams): void {
    try {
      this.transport.sendGoal(name, params);
    } catch {
      // Analytics is observational only and must never affect game behavior.
    }
  }

  gameReady(input: {
    readonly platform: 'local' | 'yandex';
    readonly language: SupportedLanguage;
    readonly tutorialCompleted: boolean;
    readonly campaignCompletedCount: number;
  }): void {
    if (this.gameReadySent) return;
    this.gameReadySent = true;
    this.send('game_ready', {
      platform: input.platform,
      language: input.language,
      tutorial_completed: input.tutorialCompleted,
      campaign_completed_count: nonNegativeInteger(input.campaignCompletedCount),
    });
  }

  screenView(screen: AnalyticsScreen): void {
    this.send('screen_view', { screen });
  }

  puzzleStart(context: AnalyticsPuzzleContext, attempt: PuzzleAttemptKind): void {
    this.send('puzzle_start', { ...puzzleParams(context), attempt });
  }

  puzzleComplete(
    context: AnalyticsPuzzleContext,
    input: {
      readonly attempt: PuzzleAttemptKind;
      readonly elapsedMs: number;
      readonly hintsUsed: number;
      readonly firstClear: boolean;
      readonly persisted: boolean;
    },
  ): void {
    this.send('puzzle_complete', {
      ...puzzleParams(context),
      attempt: input.attempt,
      time_sec: secondsFromMs(input.elapsedMs),
      hints_used: nonNegativeInteger(input.hintsUsed),
      first_clear: input.firstClear,
      persisted: input.persisted,
    });
  }

  puzzleReset(
    context: AnalyticsPuzzleContext,
    input: { readonly elapsedMs: number; readonly editsBeforeReset: number },
  ): void {
    this.send('puzzle_reset', {
      ...puzzleParams(context),
      time_sec: secondsFromMs(input.elapsedMs),
      edits_before_reset: nonNegativeInteger(input.editsBeforeReset),
    });
  }

  hintUsed(
    context: AnalyticsPuzzleContext,
    source: HintAnalyticsSource,
    hintsUsedInAttempt: number,
  ): void {
    this.send('hint_used', {
      ...puzzleParams(context),
      source,
      hints_used_in_attempt: nonNegativeInteger(hintsUsedInAttempt),
    });
  }

  tutorialComplete(): void {
    this.send('tutorial_complete', {});
  }

  interstitialResult(result: InterstitialResult, completedSlot: number): void {
    this.send('ad_interstitial_result', {
      result,
      context: 'campaign_next',
      completed_slot: nonNegativeInteger(completedSlot),
    });
  }

  rewardedResult(result: RewardedResult, context: AnalyticsPuzzleContext): void {
    this.send('ad_rewarded_result', {
      ...puzzleParams(context),
      result,
      context: 'hint',
    });
  }

  techError(
    code: TechnicalErrorCode,
    area: TechnicalErrorArea,
    context?: TechnicalErrorContext,
  ): void {
    if (this.technicalErrorsSent.has(code)) return;
    this.technicalErrorsSent.add(code);
    this.send('tech_error', {
      code,
      area,
      ...(context ? { mode: context.mode, puzzle_id: context.puzzleId } : {}),
    });
  }
}
