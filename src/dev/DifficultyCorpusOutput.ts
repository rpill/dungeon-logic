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
