import {
  mkdir,
  writeFile,
} from 'node:fs/promises';

import {
  join,
} from 'node:path';

import {
  formatDifficultyCorpusMarkdown,
  type DifficultyCorpusOutputPaths,
  type DifficultyCorpusReport,
} from './DifficultyCorpusAnalyzer';

import type {
  TargetedDifficultyCorpusReport,
} from './TargetedDifficultyCorpusAnalyzer';

export async function writeDifficultyCorpusOutputs(
  report: DifficultyCorpusReport,
  outputDirectory = '.generated',
): Promise<DifficultyCorpusOutputPaths> {
  await mkdir(
    outputDirectory,
    {
      recursive: true,
    },
  );

  const jsonPath = join(
    outputDirectory,
    'difficulty-corpus.json',
  );

  const markdownPath = join(
    outputDirectory,
    'difficulty-corpus.md',
  );

  const jsonText =
    JSON.stringify(
      report,
      null,
      2,
    ) + '\n';

  const markdown =
    formatDifficultyCorpusMarkdown(
      report,
    );

  await writeFile(
    jsonPath,
    jsonText,
    'utf8',
  );

  await writeFile(
    markdownPath,
    markdown.endsWith('\n')
      ? markdown
      : `${markdown}\n`,
    'utf8',
  );

  return {
    jsonPath,
    markdownPath,
  };
}


export function formatTargetedDifficultyCorpusMarkdown(
  report: TargetedDifficultyCorpusReport,
): string {
  const lines: string[] = [
    '# Dungeon Logic Targeted Difficulty Corpus',
    '',
    `Seeds: ${report.seeds.join(', ')}`,
    `Targets: ${report.targets.join(', ')}`,
    '',
    '## Target summary',
    '',
    '| Target | Seeds complete | Accepted | Pool exact | Pool fallback | Pool exact rate | Shortlist exact | Shortlist fallback | Shortlist exact rate | Backfill seeds | Unrated |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];

  for (const summary of report.summaries) {
    lines.push(
      `| ${summary.target} | ${summary.completedSeeds}/${summary.seedCount} | ${summary.totalAccepted} | ${summary.poolExact} | ${summary.poolFallback} | ${formatTargetedRate(summary.poolExactRate)} | ${summary.shortlistExact} | ${summary.shortlistFallback} | ${formatTargetedRate(summary.shortlistExactRate)} | ${summary.backfillSeeds} | ${summary.unrated} |`,
    );
  }

  lines.push(
    '',
    '## Archetype contribution',
    '',
  );

  for (const summary of report.summaries) {
    lines.push(
      `### ${summary.target}`,
      '',
      '| Archetype | Accepted | Exact | Fallback |',
      '| --- | ---: | ---: | ---: |',
    );

    for (
      const contribution
      of summary.archetypes
    ) {
      lines.push(
        `| ${contribution.archetype} | ${contribution.accepted} | ${contribution.exact} | ${contribution.fallback} |`,
      );
    }

    lines.push('');
  }

  lines.push(
    '## Per-seed results',
    '',
    '| Target | Seed | Completed | Accepted | Pool exact | Pool fallback | Shortlist slots | Shortlist exact | Shortlist fallback | Backfill | Backfill count | Missing | Unrated |',
    '| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: |',
  );

  for (const entry of report.seedResults) {
    lines.push(
      `| ${entry.target} | ${entry.seed} | ${entry.completed ? 'yes' : 'no'} | ${entry.accepted} | ${entry.poolExact} | ${entry.poolFallback} | ${entry.shortlistSlots} | ${entry.shortlistExact} | ${entry.shortlistFallback} | ${entry.backfillUsed ? 'yes' : 'no'} | ${entry.backfillCount} | ${entry.missingSlots} | ${entry.unrated} |`,
    );
  }

  lines.push('');

  return lines.join('\n');
}

export async function writeTargetedDifficultyCorpusOutputs(
  report: TargetedDifficultyCorpusReport,
  outputDirectory = '.generated',
): Promise<DifficultyCorpusOutputPaths> {
  await mkdir(
    outputDirectory,
    {
      recursive: true,
    },
  );

  const suffix =
    report.targets.length === 1
      ? report.targets[0]
      : 'targeted';

  const jsonPath = join(
    outputDirectory,
    `difficulty-corpus-${suffix}.json`,
  );

  const markdownPath = join(
    outputDirectory,
    `difficulty-corpus-${suffix}.md`,
  );

  const jsonText =
    JSON.stringify(
      report,
      null,
      2,
    ) + '\n';

  const markdown =
    formatTargetedDifficultyCorpusMarkdown(
      report,
    );

  await writeFile(
    jsonPath,
    jsonText,
    'utf8',
  );

  await writeFile(
    markdownPath,
    markdown.endsWith('\n')
      ? markdown
      : `${markdown}\n`,
    'utf8',
  );

  return {
    jsonPath,
    markdownPath,
  };
}

function formatTargetedRate(
  rate: number,
): string {
  return `${(rate * 100).toFixed(1)}%`;
}
