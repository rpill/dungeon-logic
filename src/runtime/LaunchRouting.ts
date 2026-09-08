import type { GameSceneData } from '../campaign/types';
import {
  buildGeneratedCandidatesUrl,
  parseGeneratedPlaytestSeed,
  resolveGeneratedCandidate,
  tryResolveLevel,
} from '../data/levels';
import { createDevGameSceneData } from './GameLaunch';

export interface DevLaunchOptions {
  readonly isDev: boolean;
  readonly loadGeneratedReport: (seed: number) => Promise<unknown>;
}

export async function resolveDevLaunch(
  params: URLSearchParams,
  options: DevLaunchOptions,
): Promise<GameSceneData | null> {
  const technicalLevel = tryResolveLevel(params.get('level'));
  if (technicalLevel !== null) {
    return createDevGameSceneData(technicalLevel);
  }

  const candidateId = params.get('candidate');
  const seedValue = params.get('seed');
  if (candidateId === null && seedValue === null) {
    return null;
  }

  if (!options.isDev) {
    return null;
  }

  const seed = parseGeneratedPlaytestSeed(seedValue);
  if (seed === null || candidateId === null || candidateId.length === 0) {
    return null;
  }

  const report = await options.loadGeneratedReport(seed);
  const generatedLevel = resolveGeneratedCandidate(report, candidateId);
  return generatedLevel === null
    ? null
    : createDevGameSceneData(generatedLevel);
}

export async function loadGeneratedReportFromDevServer(seed: number): Promise<unknown> {
  const response = await fetch(buildGeneratedCandidatesUrl(seed), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Generated candidate report for seed ${seed} returned HTTP ${response.status}.`);
  }
  return response.json() as Promise<unknown>;
}
