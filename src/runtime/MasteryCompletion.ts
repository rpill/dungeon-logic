import type { UiCopy } from '../i18n/UiCopy';
import type { MasteryRequirementProgress } from '../mastery/MasteryProgress';
import type { MasteryTransition } from '../mastery/MasteryTransition';

function metricLabel(metric: MasteryRequirementProgress['metric'], copy: UiCopy['mastery']): string {
  switch (metric) {
    case 'campaign': return copy.campaign;
    case 'daily-completed': return copy.daily;
    case 'endless-completed': return copy.endless;
  }
}

export function formatMasteryProgressNote(
  transition: MasteryTransition | null,
  copy: UiCopy['mastery'],
): string {
  if (transition === null || transition.rankAdvanced || transition.progressedMetric === null) return '';
  const progress = transition.progressedMetric;
  const prefix = transition.completedMetric ? '✓ ' : '';
  return `${prefix}${metricLabel(progress.metric, copy)} ${progress.current} / ${progress.target}`;
}
