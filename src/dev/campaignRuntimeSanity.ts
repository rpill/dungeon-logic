import { campaignManifest } from '../content/campaign/manifest';
import { level001 } from '../data/levels/level001';
import { tryResolveLevel } from '../data/levels';
import type { CampaignProgressSnapshot } from '../campaign/types';
import {
  ONBOARDING_COPY,
  completeGameLaunch,
  createCampaignGameSceneData,
  createDevGameSceneData,
  createLevelSelectItems,
  createNextCampaignGameSceneData,
  createOnboardingMessages,
  createRestartGameSceneData,
  getCampaignCompletionActions,
} from '../runtime/GameLaunch';
import { resolveDevLaunch } from '../runtime/LaunchRouting';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  assert(tryResolveLevel(null) === null, 'Nullable technical resolver returns null without a value.');
  assert(tryResolveLevel('999') === null, 'Nullable technical resolver returns null for invalid level number.');
  assert(tryResolveLevel('1')?.id === 'level-001', 'Nullable technical resolver resolves authored level 1.');

  const noQuery = await resolveDevLaunch(new URLSearchParams(), {
    isDev: true,
    loadGeneratedReport: async () => { throw new Error('loader should not run'); },
  });
  assert(noQuery === null, 'No query leaves launch to campaign flow.');

  const authored = await resolveDevLaunch(new URLSearchParams('level=1'), {
    isDev: false,
    loadGeneratedReport: async () => { throw new Error('loader should not run'); },
  });
  assert(authored?.context.mode === 'dev', 'Technical ?level= route resolves in dev launch mode.');
  assert(authored?.level.id === 'level-001', 'Technical ?level=1 resolves authored level001.');
  assert(authored !== null && !('theme' in authored.context), 'Technical launch context is art-independent.');

  let generatedLoaderCalls = 0;
  const generatedReport = {
    pool: {
      archetypes: [{
        accepted: [{
          candidate: {
            id: 'known-generated',
            level: level001,
          },
        }],
      }],
    },
  };
  const generated = await resolveDevLaunch(
    new URLSearchParams('seed=123456&candidate=known-generated'),
    {
      isDev: true,
      loadGeneratedReport: async (seed) => {
        generatedLoaderCalls += 1;
        assert(seed === 123456, 'Generated loader receives parsed uint32 seed.');
        return generatedReport;
      },
    },
  );
  assert(generated?.context.mode === 'dev', 'Generated candidate route resolves in dev launch mode.');
  assert(generated?.level.id === level001.id, 'Generated candidate route returns concrete generated level.');
  assert(generatedLoaderCalls === 1, 'Generated report loader runs exactly once.');

  generatedLoaderCalls = 0;
  const productionGenerated = await resolveDevLaunch(
    new URLSearchParams('seed=123456&candidate=known-generated'),
    {
      isDev: false,
      loadGeneratedReport: async () => {
        generatedLoaderCalls += 1;
        return generatedReport;
      },
    },
  );
  assert(productionGenerated === null, 'Generated route is disabled outside development.');
  assert(generatedLoaderCalls === 0, 'Disabled generated route never reads a report.');

  const fresh: CampaignProgressSnapshot = {
    completedLevelIds: [],
    lastPlayedLevelId: null,
  };
  const beforeProgress = JSON.stringify(fresh);
  const invalidTechnical = await resolveDevLaunch(new URLSearchParams('level=999'), {
    isDev: true,
    loadGeneratedReport: async () => generatedReport,
  });
  assert(invalidTechnical === null, 'Invalid technical level falls through to campaign flow.');
  assert(JSON.stringify(fresh) === beforeProgress, 'Invalid technical query cannot mutate campaign progress.');

  const firstEntry = campaignManifest[0];
  const campaignData = createCampaignGameSceneData(firstEntry, fresh);
  assert(campaignData.level === firstEntry.level, 'Campaign scene data carries concrete promoted snapshot.');
  assert(campaignData.context.mode === 'campaign', 'Campaign scene data uses campaign mode.');
  assert(
    campaignData.context.mode === 'campaign' && campaignData.context.campaignLevelId === firstEntry.id,
    'Campaign scene data carries exact campaign id.',
  );
  assert(!('theme' in campaignData.context), 'Campaign scene data carries no runtime board theme.');
  assert(
    campaignData.onboarding.join(',') === 'row-column-clues,monster-dead-end',
    'Campaign scene data includes current entry onboarding before completion.',
  );

  const devData = createDevGameSceneData(level001);
  assert(devData.context.mode === 'dev', 'Dev scene data has no campaign mode/id.');
  assert(!('theme' in devData.context), 'Dev scene data carries no runtime board theme.');
  assert(devData.onboarding.length === 0, 'Dev scene data never includes campaign onboarding.');

  const levelSelectItems = createLevelSelectItems(campaignManifest, fresh);
  assert(levelSelectItems.length === 5, 'Level Select model exposes only five promoted pilot entries.');
  assert(levelSelectItems[0].state === 'current', 'Level Select marks slot 1 current in fresh progress.');
  assert(levelSelectItems.slice(1).every((item) => item.state === 'locked'), 'Level Select locks slots 2-5 initially.');

  const campaignRestart = createRestartGameSceneData(campaignData);
  assert(campaignRestart.level === campaignData.level, 'Campaign restart preserves concrete level snapshot.');
  assert(!('theme' in campaignRestart.context), 'Campaign restart remains art-independent.');
  assert(
    campaignRestart.context.mode === 'campaign'
      && campaignData.context.mode === 'campaign'
      && campaignRestart.context.campaignLevelId === campaignData.context.campaignLevelId,
    'Campaign restart preserves exact campaign id.',
  );

  const devRestart = createRestartGameSceneData(devData);
  assert(devRestart.level === devData.level, 'Dev restart preserves concrete dev snapshot.');
  assert(!('theme' in devRestart.context), 'Dev restart remains art-independent.');

  let completeCalls = 0;
  let completedId: string | null = null;
  let completedMetadata: import('../campaign/types').CampaignCompletionMetadata | undefined;
  const firstCompletion = {
    progress: {
      completedLevelIds: ['campaign-001'],
      lastPlayedLevelId: 'campaign-001',
    },
    recommendedNextLevel: campaignManifest[1],
    unlockedManuscript: null,
    persisted: true,
  } as const;
  const completionPort = {
    completeLevel: async (
      id: string,
      metadata?: import('../campaign/types').CampaignCompletionMetadata,
    ) => {
      completeCalls += 1;
      completedId = id;
      completedMetadata = metadata;
      return firstCompletion;
    },
  };
  const solveMetadata = {
    bestTimeMs: 12345,
    minHintsUsed: 1,
    solveCount: 1,
    solvedWithoutHints: false,
  } as const;
  const campaignCompletion = await completeGameLaunch(campaignData, completionPort, solveMetadata);
  assert(completeCalls === 1, 'Campaign completion calls CampaignService.completeLevel exactly once.');
  assert(completedId === 'campaign-001', 'Campaign completion passes exact current campaign id.');
  assert(completedMetadata === solveMetadata, 'Campaign completion forwards exact solve metadata.');
  assert(campaignCompletion === firstCompletion, 'Campaign completion returns service result unchanged.');

  completeCalls = 0;
  const devCompletion = await completeGameLaunch(devData, completionPort);
  assert(devCompletion === null, 'Dev completion has no campaign result.');
  assert(completeCalls === 0, 'Dev completion never calls CampaignService.');

  assert(
    getCampaignCompletionActions(firstCompletion).join(',') === 'next,archive',
    'Completion actions include Next when a recommended frontier level exists.',
  );
  const finalCompletion = { ...firstCompletion, recommendedNextLevel: null };
  assert(
    getCampaignCompletionActions(finalCompletion).join(',') === 'archive',
    'Completion without a recommended frontier level has no Next action.',
  );

  let startedNextId: string | null = null;
  const afterOneProgress: CampaignProgressSnapshot = {
    completedLevelIds: ['campaign-001'],
    lastPlayedLevelId: 'campaign-001',
  };
  const nextData = await createNextCampaignGameSceneData(campaignManifest[1], {
    startLevel: async (id: string) => {
      startedNextId = id;
      return campaignManifest[1];
    },
    getProgress: () => afterOneProgress,
  });
  assert(startedNextId === campaignManifest[1].id, 'Next starts the recommended frontier entry id.');
  assert(nextData.level === campaignManifest[1].level, 'Next launch uses the recommended snapshot.');
  assert(
    nextData.context.mode === 'campaign' && nextData.context.campaignLevelId === campaignManifest[1].id,
    'Next launch carries the recommended campaign id.',
  );


  const treasureOnlyData = {
    ...campaignData,
    onboarding: ['treasure-room-rule'] as const,
  };
  const treasureOnlyMessages = createOnboardingMessages(treasureOnlyData);
  assert(treasureOnlyMessages.length === 1, 'Onboarding messages come only from current scene-data ids.');
  assert(
    treasureOnlyMessages[0] === ONBOARDING_COPY['treasure-room-rule'],
    'Onboarding copy is resolved from the supplied onboarding id.',
  );
  assert(createOnboardingMessages(devData).length === 0, 'Dev launch produces no onboarding messages.');

  console.info('[Dungeon Logic] Campaign runtime sanity: nonlinear routing/launch model checks passed');
}

main().catch((error) => {
  console.error(error);
  (globalThis as { process?: { exitCode?: number } }).process!.exitCode = 1;
});
