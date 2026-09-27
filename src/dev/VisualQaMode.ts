import Phaser from 'phaser';

import { CampaignService, CAMPAIGN_SERVICE_REGISTRY_KEY } from '../campaign/CampaignService';
import { campaignManifest } from '../content/campaign/manifest';
import { loadDailyCatalog } from '../content/daily/DailyCatalogLoader';
import { loadEndlessCatalog } from '../content/endless/EndlessCatalogLoader';
import { TUTORIAL_MANIFEST } from '../content/tutorial/manifest';
import { DailyService, DAILY_SERVICE_REGISTRY_KEY } from '../daily/DailyService';
import { EndlessService, ENDLESS_SERVICE_REGISTRY_KEY } from '../endless/EndlessService';
import { getUiCopy } from '../i18n/UiCopy';
import { showMasteryRankUpOverlay } from '../runtime/MasteryRankUpOverlay';
import { createCampaignGameSceneData, createDailyGameSceneData, createEndlessGameSceneData, createTutorialGameSceneData } from '../runtime/GameLaunch';
import { PLAYER_PROFILE_SERVICE_REGISTRY_KEY, PlayerProfileService } from '../profile/PlayerProfileService';
import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import { PuzzleState } from '../puzzle/PuzzleState';
import { CellState } from '../puzzle/types';
import type { PlayerProfile } from '../profile/types';
import { createLocalPlatformServices } from '../platform/local';
import { PLATFORM_SERVICES_REGISTRY_KEY } from '../platform/PlatformRegistry';
import type { LeaderboardPlayerView, LeaderboardSnapshot, PlatformServices } from '../platform/services';
import { TutorialService, TUTORIAL_SERVICE_REGISTRY_KEY } from '../tutorial/TutorialService';
import { encodeDailyLeaderboardScore } from '../daily/DailyLeaderboard';
import { findVisualQaState, VISUAL_QA_STATES, type VisualQaState } from './VisualQaCatalog';

export const VISUAL_QA_DETAIL_REGISTRY_KEY = 'visual-qa-detail';
export const VISUAL_QA_ACTIVE_REGISTRY_KEY = 'visual-qa-active';
const TODAY = '2026-09-25';
const NOW = new Date(`${TODAY}T12:00:00.000Z`);

function qaProfile(fixture: string): PlayerProfile {
  const fresh = createFreshPlayerProfile(campaignManifest, 'ru');
  const counts: Record<string, readonly [number, number, number]> = {
    fresh: [0, 0, 0], tutorial: [0, 0, 0], partial: [3, 0, 0], started: [3, 0, 0],
    'row-locked': [7, 0, 0], 'row-unlock': [8, 0, 0], mid: [22, 4, 18], iii: [10, 1, 5],
    vii: [46, 11, 150], master: [64, 20, 500], 'master-long': [64, 20, 500], freeplay: [64, 20, 100_000],
    almost: [9, 1, 5], mixed: [18, 2, 16],
    'daily-solved': [22, 5, 18], 'past-solved': [22, 5, 18], streak: [22, 5, 18],
  };
  const [campaignCount, dailyCount, endlessCount] = counts[fixture] ?? counts.mid!;
  const completed = campaignManifest.slice(0, campaignCount).map((entry) => entry.id);
  const dates = Array.from({ length: dailyCount }, (_, index) => {
    const day = new Date(NOW.getTime() - (dailyCount - index) * 86_400_000);
    return day.toISOString().slice(0, 10);
  });
  const todaySolved = fixture === 'daily-solved' || fixture === 'streak';
  const drafts = { ...fresh.campaign.drafts };
  if (fixture === 'started') {
    const entry = campaignManifest[3]!;
    const puzzle = new PuzzleState(entry.level);
    const cells = Array.from({ length: entry.level.height }, (_, y) => Array.from(
      { length: entry.level.width }, (_, x) => puzzle.getCellState(x, y),
    ));
    const editable = cells.flatMap((row, y) => row.map((_, x) => ({ x, y })))
      .filter(({ x, y }) => !puzzle.isFixedCell(x, y));
    if (editable[0]) cells[editable[0].y]![editable[0].x] = CellState.Wall;
    if (editable[1]) cells[editable[1].y]![editable[1].x] = CellState.Wall;
    if (editable[2]) cells[editable[2].y]![editable[2].x] = CellState.Floor;
    drafts[entry.id] = {
      mode: 'campaign', puzzleId: entry.id, cells,
      activePlayMs: 10_000, hintsUsed: 0, startedAtMs: 100,
    };
  }
  if (todaySolved && !dates.includes(TODAY)) dates.push(TODAY);
  const yesterday = '2026-09-24';
  if (fixture === 'past-solved' && !dates.includes(yesterday)) dates.push(yesterday);
  if (fixture === 'mid') dates.splice(dates.indexOf(yesterday), dates.includes(yesterday) ? 1 : 0);
  const results = Object.fromEntries(dates.map((date) => [date, {
    bestTimeMs: 93_000, minHintsUsed: 0, solvedWithoutHints: true,
  }]));
  return {
    ...fresh,
    tutorial: { ...fresh.tutorial, completed: fixture !== 'fresh' && fixture !== 'tutorial', completedLevelIds: fixture === 'fresh' || fixture === 'tutorial' ? [] : TUTORIAL_MANIFEST.map((entry) => entry.id) },
    campaign: { ...fresh.campaign, completedLevelIds: completed, lastPlayedLevelId: completed.at(-1) ?? null, drafts },
    daily: { ...fresh.daily, solvedDates: dates, results, totalSolved: dates.length, currentStreak: fixture === 'streak' ? 5 : todaySolved ? 2 : 0, bestStreak: fixture === 'streak' ? 7 : 3, lastSolvedDate: dates.at(-1) ?? null },
    endless: { ...fresh.endless, completed: endlessCount, nextFreshIndex: endlessCount, currentStreak: Math.min(endlessCount, 8), bestStreak: Math.min(endlessCount, 15) },
    mastery: { rating: fixture === 'master-long' ? 12_450_600 : fixture === 'master' ? 12_450 : fresh.mastery.rating },
    settings: fixture === 'settings-en-off'
      ? { language: 'en', musicEnabled: false, soundEnabled: false }
      : fresh.settings,
  };
}

function mockLeaderboard(state: VisualQaState): PlatformServices['leaderboards'] {
  const detail = state.detail ?? '';
  const masterRating = state.scene === 'master-rating';
  const own = masterRating ? detail !== 'no-own' && detail !== 'empty' && detail !== 'sign-in' : detail === 'own' || detail === 'populated' || detail === 'long-name';
  const authorized = masterRating ? detail !== 'sign-in' : own;
  const row = (place: number, name: string, ms: number, isCurrentPlayer = false): LeaderboardPlayerView => ({
    place, publicName: name, score: masterRating ? (detail === 'long-name' ? 12_451_000 : 13_000) - place * 100 : encodeDailyLeaderboardScore(TODAY, ms), avatarUrl: null, isCurrentPlayer,
  });
  const entries = detail === 'empty' || detail === 'unavailable' ? [] : detail === 'own-below-top'
    ? Array.from({ length: 12 }, (_, index) => row(index + 1, `Игрок ${index + 1}`, 68_000 + index * 10_000))
    : [
    row(1, 'Лисёнок', 68_000), row(2, detail === 'long-name' ? 'PrincessOfTheIndigoDungeonWithAnExtremelyLongName' : 'Moonlight', 79_000), row(3, 'Дракончик', 87_000),
    row(4, detail === 'long-name' ? 'ОченьДлинныйНикБезПробелов_123456789' : 'Искатель', 93_000, own), row(5, 'StoneFox', 104_000), row(6, 'PixelMage', 117_000),
  ];
  const currentPlayer = own
    ? detail === 'own-below-top' ? row(17, 'Искатель', 170_000, true) : entries[3] ?? null
    : null;
  const snapshot: LeaderboardSnapshot = { entries, currentPlayer };
  return {
    async isAuthorized() { return authorized; },
    async requestAuthorization() { return authorized; },
    async submitScore() { return 'unavailable'; },
    async getPlayerEntry() { return snapshot.currentPlayer; },
    async getEntries() {
      if (detail === 'loading') await new Promise((resolve) => setTimeout(resolve, 2_500));
      return detail === 'unavailable' ? null : snapshot;
    },
  };
}

function showCatalog(): void {
  const root = document.createElement('main');
  root.id = 'visual-qa-catalog';
  root.innerHTML = `<header><h1>Dungeon Logic · Visual QA</h1><p>DEV only · фиксированная дата ${TODAY} · профиль и платформа в памяти</p></header>`;
  const groups = [...new Set(VISUAL_QA_STATES.map((entry) => entry.group))];
  for (const group of groups) {
    const section = document.createElement('section');
    const title = document.createElement('h2');
    title.textContent = group;
    section.append(title);
    for (const state of VISUAL_QA_STATES.filter((entry) => entry.group === group && entry.id !== 'catalog')) {
      const anchor = document.createElement('a');
      anchor.href = `?visualQa=${encodeURIComponent(state.id)}`;
      anchor.textContent = `${state.label}  ↗`;
      section.append(anchor);
    }
    root.append(section);
  }
  const style = document.createElement('style');
  style.textContent = `#visual-qa-catalog{position:fixed;inset:0;z-index:10000;overflow:auto;background:#101a31;color:#f7f2e7;font:16px 'Balsamiq Sans',sans-serif;padding:clamp(18px,3vw,48px)}#visual-qa-catalog header{max-width:980px;margin:auto auto 30px}#visual-qa-catalog h1{color:#f0bd63;font-size:clamp(25px,3vw,38px)}#visual-qa-catalog p{color:#a9bbd8}#visual-qa-catalog section{max-width:980px;margin:0 auto 24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:9px}#visual-qa-catalog h2{grid-column:1/-1;margin:4px 0;color:#ecc77e;font-size:19px}#visual-qa-catalog a{display:block;padding:13px 16px;border:1px solid #58749c;border-radius:9px;background:#293e62;color:#fff;text-decoration:none}#visual-qa-catalog a:hover{background:#3b5985}`;
  document.head.append(style);
  document.body.append(root);
}

class VisualQaOverlayScene extends Phaser.Scene {
  constructor() { super('VisualQaOverlayScene'); }
  create(data: { fromRank: 'I' | 'IV' | 'VII' | 'VIII' | 'MASTER'; toRank: 'II' | 'V' | 'VIII' | 'MASTER'; masterRatingMilestone?: { rating: string; milestone: string } }): void {
    showMasteryRankUpOverlay(this, {
      ...data,
      copy: getUiCopy('ru').mastery,
      onContinue: () => { window.location.href = '?visualQa=catalog'; },
    });
  }
}

export async function launchVisualQa(boot: Phaser.Scene, requestedId: string): Promise<void> {
  if (!import.meta.env.DEV) return;
  const state = findVisualQaState(requestedId) ?? VISUAL_QA_STATES[0]!;
  const profile = qaProfile(state.fixture);
  const profileService = await PlayerProfileService.create(campaignManifest, {
    async load() { return profile; },
    async save() {},
  }, { defaultLanguage: 'ru' });
  const local = createLocalPlatformServices(null);
  const platform: PlatformServices = {
    ...local,
    kind: 'yandex',
    storage: { async load() { return null; }, async save() {} },
    clock: { async now() {
      if (state.fixture === 'daily-loading') await new Promise((resolve) => setTimeout(resolve, 2_500));
      return state.fixture === 'daily-unavailable' ? null
        : state.detail === 'archive-months' ? new Date('2026-12-15T12:00:00.000Z') : new Date(NOW);
    } },
    leaderboards: mockLeaderboard(state),
  };
  const [dailyCatalog, endlessCatalog] = await Promise.all([loadDailyCatalog(), loadEndlessCatalog()]);
  const campaign = CampaignService.create(campaignManifest, profileService);
  const daily = DailyService.create(dailyCatalog.entries, profileService, platform.clock);
  const endless = EndlessService.create(endlessCatalog, profileService);
  boot.registry.set(PLAYER_PROFILE_SERVICE_REGISTRY_KEY, profileService);
  boot.registry.set(PLATFORM_SERVICES_REGISTRY_KEY, platform);
  boot.registry.set(CAMPAIGN_SERVICE_REGISTRY_KEY, campaign);
  boot.registry.set(DAILY_SERVICE_REGISTRY_KEY, daily);
  boot.registry.set(ENDLESS_SERVICE_REGISTRY_KEY, endless);
  boot.registry.set(TUTORIAL_SERVICE_REGISTRY_KEY, TutorialService.create(TUTORIAL_MANIFEST, profileService));
  boot.registry.set(VISUAL_QA_DETAIL_REGISTRY_KEY, state.detail ?? '');
  boot.registry.set(VISUAL_QA_ACTIVE_REGISTRY_KEY, true);
  boot.scene.add('VisualQaOverlayScene', VisualQaOverlayScene, false);

  if (state.scene === 'catalog') { showCatalog(); return; }
  if (!new URLSearchParams(window.location.search).has('capture')) {
    const link = document.createElement('a');
    link.href = '?visualQa=catalog';
    link.textContent = 'QA';
    link.title = 'Назад к каталогу';
    Object.assign(link.style, { position: 'fixed', right: '8px', bottom: '8px', zIndex: '9999', background: '#f0bd63', color: '#14213b', padding: '6px 9px', borderRadius: '7px', font: 'bold 12px sans-serif' });
    document.body.append(link);
  }

  if (state.scene === 'rankup') {
    const pairs = {
      early: { fromRank: 'I', toRank: 'II' }, middle: { fromRank: 'IV', toRank: 'V' },
      high: { fromRank: 'VII', toRank: 'VIII' }, master: { fromRank: 'VIII', toRank: 'MASTER' },
      'rating-milestone': { fromRank: 'MASTER', toRank: 'MASTER', masterRatingMilestone: { rating: '12 500', milestone: '12 500' } },
    } as const;
    boot.scene.start('HomeScene');
    boot.scene.launch('VisualQaOverlayScene', pairs[state.detail as keyof typeof pairs] ?? pairs.early);
    return;
  }
  if (state.scene === 'game') {
    const detail = state.detail ?? '';
    if (detail.startsWith('tutorial-') || detail.startsWith('completion-tutorial')) {
      const entry = detail === 'completion-tutorial-final'
        ? TUTORIAL_MANIFEST.at(-1)!
        : detail === 'completion-tutorial' ? TUTORIAL_MANIFEST[0]!
          : TUTORIAL_MANIFEST[Number(detail.slice(-1)) - 1] ?? TUTORIAL_MANIFEST[0]!;
      boot.scene.start('GameScene', createTutorialGameSceneData(entry));
      return;
    }
    if (detail.startsWith('endless-') || detail === 'skip' || detail === 'skip-large' || detail.startsWith('completion-endless')) {
      const index = detail === 'completion-endless-final' ? endlessCatalog.length - 1
        : detail === 'endless-12' ? 12 : detail === 'skip-large' || detail === 'completion-endless-large' ? 1 : 0;
      boot.scene.start('GameScene', createEndlessGameSceneData(endlessCatalog.createLevel(index), index, 'fresh'));
      return;
    }
    if (detail === 'daily' || detail.startsWith('completion-daily')) {
      const entry = dailyCatalog.entries.find((candidate) => candidate.dateKey === TODAY)!;
      boot.scene.start('GameScene', createDailyGameSceneData(entry, { ranked: detail !== 'completion-daily-repeat', archive: false, elapsedMsAtLaunch: 0, attempt: 'new' }));
      return;
    }
    const entry = detail === 'completion-campaign-final'
      ? campaignManifest.at(-1)!
      : detail === 'campaign-large' || detail === 'completion-campaign-large' || detail === 'menu-large' || detail === 'hint-explanation-large'
      ? campaignManifest.find((candidate) => candidate.level.width >= 8) ?? campaignManifest[0]!
      : detail === 'campaign-chest'
        ? campaignManifest.find((candidate) => candidate.level.chests.length > 0) ?? campaignManifest[0]!
        : campaignManifest[0]!;
    boot.scene.start('GameScene', createCampaignGameSceneData(entry, campaign.getProgress()));
    return;
  }
  if (state.scene === 'leaderboard') {
    const entry = dailyCatalog.entries.find((candidate) => candidate.dateKey === TODAY)!;
    boot.scene.start('LeaderboardScene', { dailyId: entry.id, dateKey: TODAY });
    return;
  }
  const sceneKeys: Record<string, string> = {
    home: 'HomeScene', levels: 'LevelSelectScene', daily: 'DailyScene', mastery: 'MasteryScene',
    challenge: 'HomeScene', settings: 'SettingsScene', help: 'HelpScene', 'master-rating': 'MasterRatingLeaderboardScene',
  };
  const key = sceneKeys[state.scene] ?? 'HomeScene';
  if (state.scene === 'levels') {
    boot.scene.start(key, {
      mobilePageIndex: state.detail === 'last-page' ? 7 : state.detail === 'page-2' ? 2 : undefined,
      rowUnlock: state.id === 'levels-row-unlock'
        ? { completedRowStartSlot: 1, completedRowEndSlot: 8, nextRowStartSlot: 9 }
        : undefined,
    });
  } else if (state.scene === 'help') {
    boot.scene.start(key, { returnSceneKey: 'HomeScene' });
  } else {
    boot.scene.start(key);
  }
}
