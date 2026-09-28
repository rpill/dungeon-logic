export type AnalyticsPrimitive = string | number | boolean;
export type AnalyticsParams = Readonly<Record<string, AnalyticsPrimitive>>;

export type AnalyticsGoalName =
  | 'game_ready'
  | 'screen_view'
  | 'puzzle_start'
  | 'puzzle_complete'
  | 'puzzle_reset'
  | 'hint_used'
  | 'tutorial_complete'
  | 'ad_rewarded_result'
  | 'tech_error'
  | 'mastery_open'
  | 'mastery_rank_up';

export interface AnalyticsTransport {
  sendGoal(name: AnalyticsGoalName, params: AnalyticsParams): void;
}

export const NOOP_ANALYTICS_TRANSPORT: AnalyticsTransport = {
  sendGoal() {},
};
