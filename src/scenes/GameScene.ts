import Phaser from 'phaser';

import { getAudioFeedback } from '../audio/AudioFeedbackService';
import { BoardView } from '../board/BoardView';
import { CAMPAIGN_SERVICE_REGISTRY_KEY, CampaignService } from '../campaign/CampaignService';
import type {
  CampaignCompletionMetadata,
  CampaignCompletionResult,
  GameSceneData,
} from '../campaign/types';
import {
  DAILY_SERVICE_REGISTRY_KEY,
  DailyService,
  getRecentDailyHistory,
  type DailyCompletionResult,
} from '../daily/DailyService';
import { encodeDailyLeaderboardScore, getDailyLeaderboardName } from '../daily/DailyLeaderboard';
import { chooseHint, requestHint, type PuzzleHint } from '../gameplay/HintService';
import { RANKED_DAILY_HINT_UNLOCK_MS } from '../gameplay/HintEconomy';
import { MonetizationService } from '../monetization/MonetizationService';
import { PuzzleInteractionSession } from '../gameplay/PuzzleInteractionSession';
import { ActiveTimer, formatActiveTime } from '../gameplay/ActiveTimer';
import { PuzzleSessionService } from '../gameplay/PuzzleSessionService';
import { validatePuzzle } from '../puzzle/LevelValidator';
import { PLATFORM_SERVICES_REGISTRY_KEY } from '../platform/PlatformRegistry';
import type { LeaderboardPlayerView, PlatformServices } from '../platform/services';
import { PuzzleState } from '../puzzle/PuzzleState';
import { CellState, type CellState as CellStateValue } from '../puzzle/types';
import {
  createOnboardingFlow,
  isOnboardingStepSatisfied,
  type OnboardingStep,
} from '../onboarding/OnboardingFlow';
import { HELP_SCENE_KEY } from '../help/HelpNavigation';
import { getUiCopy } from '../i18n/UiCopy';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import {
  completeDailyGameLaunch,
  completeGameLaunch,
  createCampaignGameSceneData,
  createNextCampaignGameSceneData,
  createTutorialGameSceneData,
} from '../runtime/GameLaunch';
import { HOME_SCENE_KEY, LEVELS_SCENE_KEY, SETTINGS_SCENE_KEY, STATS_SCENE_KEY } from '../runtime/MetaSelectors';
import {
  TUTORIAL_SERVICE_REGISTRY_KEY,
  TutorialService,
  type TutorialCompletionResult,
} from '../tutorial/TutorialService';
import { createCompletedReviewPuzzle, resolveCampaignPlayState } from '../runtime/CampaignPlayState';
import { calculateGameBoardLayout } from './GameBoardLayout';
import { LEADERBOARD_SCENE_KEY } from './LeaderboardScene';
import { DAILY_SCENE_KEY } from './DailyScene';
import { calculatePuzzleChromeLayout } from '../runtime/ResponsiveLayout';
import { PlatformGameplayActivity } from '../runtime/PlatformGameplayActivity';
import { createSceneBackground } from '../runtime/SceneBackground';
import { createCenteredTextMenuButton, createHomeMenuButton } from '../runtime/HomeMenuButton';
import {
  calculatePuzzleToolbarLayout,
  createPuzzleToolbarState,
  shouldConfirmReset,
  shouldShowTouchToolButtons,
  type PuzzleToolbarButtonId,
  type PuzzleToolbarLayout,
} from '../runtime/PuzzleUiState';

export class GameScene extends Phaser.Scene {
  private createVersion = 0;
  private launchData: GameSceneData | null = null;

  constructor() {
    super('GameScene');
  }

  init(data: GameSceneData): void {
    this.launchData = data;
  }

  create(): void {
    const launchData = this.launchData;
    if (launchData === null) {
      throw new Error('GameScene requires resolved GameSceneData from campaign, Daily, or dev routing.');
    }

    const createVersion = this.createVersion + 1;
    this.createVersion = createVersion;
    this.createGame(launchData, createVersion);
  }

  private createGame(launchData: GameSceneData, createVersion: number): void {
    const sceneBackground = createSceneBackground(this, 'gameplay');

    const readSafeArea = (name: '--safe-area-inset-top' | '--safe-area-inset-bottom'): number => {
      if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') {
        return 0;
      }
      const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const value = Number.parseFloat(raw);
      return Number.isFinite(value) ? Math.max(0, value) : 0;
    };

    const readActiveClockMs = (): number => {
      if (typeof performance !== 'undefined') {
        const value = performance.now();
        if (Number.isFinite(value) && value >= 0) return value;
      }
      return Date.now();
    };

    const calculateSafeBoardLayout = (extraBottomReserve = 0) => {
      const safeTop = readSafeArea('--safe-area-inset-top');
      const safeBottom = readSafeArea('--safe-area-inset-bottom');
      const safeHeight = Math.max(
        1,
        this.scale.height - safeTop - safeBottom - Math.max(0, extraBottomReserve),
      );
      const layout = calculateGameBoardLayout(
        this.scale.width,
        safeHeight,
        launchData.level.width,
        launchData.level.height,
      );
      return {
        ...layout,
        originY: layout.originY + safeTop,
      };
    };

    const safeTop = readSafeArea('--safe-area-inset-top');
    const chrome = calculatePuzzleChromeLayout(this.scale.width, this.scale.height);
    const profileService = launchData.context.mode === 'dev'
      ? null
      : this.getPlayerProfileService();
    let language = this.getPlayerProfileService().getProfile().settings.language;
    let copy = getUiCopy(language);
    const feedback = getAudioFeedback(this);
    const campaignContext = launchData.context.mode === 'campaign'
      ? launchData.context
      : null;
    const campaignService = campaignContext === null ? null : this.getCampaignService();
    const tutorialContext = launchData.context.mode === 'tutorial'
      ? launchData.context
      : null;
    const usesPersistentTutorialLayoutReserve = tutorialContext !== null
      && launchData.contextualOnboarding;
    const getTutorialLayoutBottomReserve = (): number => (
      usesPersistentTutorialLayoutReserve
        ? (this.scale.width < 700 ? 92 : 86)
        : 0
    );
    const applyTutorialBoardTopClearance = (
      layout: ReturnType<typeof calculateSafeBoardLayout>,
      chromeLayout: ReturnType<typeof calculatePuzzleChromeLayout>,
      safeTopInset: number,
    ): ReturnType<typeof calculateSafeBoardLayout> => {
      if (!usesPersistentTutorialLayoutReserve) return layout;

      const compactTutorial = this.scale.width < 700 || this.scale.height < 520;
      const reservedPanelHeight = compactTutorial ? 58 : 74;
      const panelGap = compactTutorial ? 10 : 16;
      const clueFontSize = Math.max(16, Math.round(layout.cellSize * 0.5));
      const clueCenterY = layout.originY - layout.cellSize * 0.3;
      const clueTopY = clueCenterY - clueFontSize * 0.65;
      const timerCenterY = safeTopInset
        + chromeLayout.titleY
        + (this.scale.width < 700 ? 28 : 34);
      const timerFontSize = Math.max(12, chromeLayout.statusFontSize);
      const minimumPanelTop = timerCenterY
        + timerFontSize * 0.75
        + (compactTutorial ? 8 : 12);
      const preferredPanelTop = clueTopY - panelGap - reservedPanelHeight;
      const availableShift = Math.max(0, getTutorialLayoutBottomReserve() - 12);
      const boardShift = Math.min(
        availableShift,
        Math.max(0, minimumPanelTop - preferredPanelTop),
      );

      return boardShift === 0
        ? layout
        : { ...layout, originY: layout.originY + boardShift };
    };
    const calculateStableBoardLayout = (
      extraBottomReserve = 0,
      chromeLayout = calculatePuzzleChromeLayout(this.scale.width, this.scale.height),
      safeTopInset = readSafeArea('--safe-area-inset-top'),
    ) => applyTutorialBoardTopClearance(
      calculateSafeBoardLayout(extraBottomReserve),
      chromeLayout,
      safeTopInset,
    );
    const dailyContext = launchData.context.mode === 'daily'
      ? launchData.context
      : null;
    const rankedDaily = dailyContext?.ranked === true;
    const dailyAlreadySolved = dailyContext !== null && profileService !== null
      ? profileService.getProfile().daily.results[dailyContext.dateKey] !== undefined
      : false;
    const tutorialService = tutorialContext === null ? null : this.getTutorialService();
    const tutorialEntry = tutorialContext === null
      ? null
      : tutorialService?.getLevels().find((entry) => entry.id === tutorialContext.tutorialLevelId) ?? null;
    const tutorialLevelTotal = tutorialService?.getLevels().length ?? 0;
    const campaignEntry = campaignContext === null
      ? null
      : campaignService?.getLevels().find((entry) => entry.id === campaignContext.campaignLevelId) ?? null;
    const completedCampaignSlot = campaignEntry?.slot ?? null;
    const campaignPlayState = campaignContext !== null && profileService !== null
      ? resolveCampaignPlayState(launchData.level, profileService.getProfile().campaign)
      : null;
    const completedReview = campaignPlayState?.mode === 'completed-review';

    if (
      completedReview
      && profileService?.getProfile().campaign.drafts[launchData.level.id] !== undefined
    ) {
      profileService.update((profile) => ({
        ...profile,
        campaign: {
          ...profile.campaign,
          drafts: Object.fromEntries(
            Object.entries(profile.campaign.drafts)
              .filter(([levelId]) => levelId !== launchData.level.id),
          ),
        },
      }));
    }

    const getTitleLabel = (): string => {
      if (campaignEntry !== null) {
        return copy.game.levelTitle(campaignEntry.slot);
      }
      if (tutorialEntry !== null) {
        return copy.game.tutorialTitle(tutorialEntry.slot, tutorialLevelTotal);
      }
      if (launchData.context.mode === 'daily') return copy.game.dailyTitle;
      return 'Dungeon Logic';
    };

    const titleText = this.add.text(
      this.scale.width / 2,
      chrome.titleY + safeTop,
      getTitleLabel(),
      {
        fontFamily: 'monospace',
        fontSize: `${chrome.titleFontSize}px`,
        color: '#f0e6d2',
        fontStyle: 'bold',
      },
    ).setOrigin(0.5);

    const timerText = this.add.text(
      this.scale.width / 2,
      chrome.titleY + safeTop + (this.scale.width < 700 ? 28 : 34),
      '00:00',
      {
        fontFamily: 'monospace',
        fontSize: `${Math.max(12, chrome.statusFontSize)}px`,
        color: '#89929d',
        fontStyle: 'bold',
      },
    ).setOrigin(0.5);

    const getBackLabel = (): string => copy.game.back.replace(/^←\s*/, '');
    const topActionBackground = this.add.graphics();
    const backHit = this.add.zone(0, 0, 1, 1).setInteractive({ useHandCursor: true });
    const menuHit = this.add.zone(0, 0, 1, 1).setInteractive({ useHandCursor: true });
    const backIcon = this.add.image(0, 0, 'ui-icon-back').setTint(0xf4ead7);
    const backText = this.add.text(0, 0, getBackLabel(), {
      fontFamily: 'monospace',
      fontSize: `${chrome.actionFontSize}px`,
      color: '#f4ead7',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const menuIcon = this.add.image(0, 0, 'ui-icon-menu').setTint(0xf4ead7);
    const menuText = this.add.text(0, 0, copy.game.menu, {
      fontFamily: 'monospace',
      fontSize: `${chrome.actionFontSize}px`,
      color: '#f4ead7',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    let backHovered = false;
    let menuHovered = false;

    const redrawTopActions = (): void => {
      const draw = (hit: Phaser.GameObjects.Zone, hovered: boolean): void => {
        topActionBackground.fillStyle(hovered ? 0x2a3d66 : 0x1d2b4b, 1);
        topActionBackground.fillRoundedRect(
          hit.x - hit.width / 2,
          hit.y - hit.height / 2,
          hit.width,
          hit.height,
          this.scale.width < 700 ? 9 : 11,
        );
      };
      topActionBackground.clear();
      draw(backHit, backHovered);
      draw(menuHit, menuHovered);
    };

    const layoutTopActions = (layout = chrome, insetTop = safeTop): void => {
      const narrowTop = this.scale.width < 700;
      const height = narrowTop ? 38 : 48;
      const backWidth = narrowTop ? 100 : 150;
      const menuWidth = narrowTop ? 92 : 138;
      const gap = narrowTop ? 6 : 9;
      const iconSize = narrowTop ? 20 : 28;
      const y = layout.titleY + insetTop - (narrowTop ? 2 : 0);
      const backX = layout.actionInset + backWidth / 2;
      const menuX = this.scale.width - layout.actionInset - menuWidth / 2;

      backHit.setPosition(backX, y).setSize(backWidth, height);
      menuHit.setPosition(menuX, y).setSize(menuWidth, height);
      backText.setFontSize(layout.actionFontSize).setText(getBackLabel());
      menuText.setFontSize(layout.actionFontSize).setText(copy.game.menu);
      backIcon.setDisplaySize(iconSize, iconSize);
      menuIcon.setDisplaySize(iconSize, iconSize);

      const backContentWidth = iconSize + gap + backText.width;
      const backStartX = backX - backContentWidth / 2;
      backIcon.setPosition(backStartX + iconSize / 2, y);
      backText.setPosition(backStartX + iconSize + gap, y);

      const menuContentWidth = iconSize + gap + menuText.width;
      const menuStartX = menuX - menuContentWidth / 2;
      menuIcon.setPosition(menuStartX + iconSize / 2, y);
      menuText.setPosition(menuStartX + iconSize + gap, y);

      const titleY = y + (narrowTop ? 28 : 0);
      titleText
        .setPosition(this.scale.width / 2, titleY)
        .setFontSize(layout.titleFontSize)
        .setText(getTitleLabel());
      const availableTitleWidth = Math.max(120, (menuX - menuWidth / 2) - (backX + backWidth / 2) - (narrowTop ? 16 : 40));
      if (titleText.width > availableTitleWidth) {
        const fitted = Math.max(narrowTop ? 18 : 24, Math.floor(layout.titleFontSize * availableTitleWidth / titleText.width));
        titleText.setFontSize(fitted);
      }
      timerText
        .setPosition(this.scale.width / 2, titleText.y + (narrowTop ? 24 : 34))
        .setFontSize(Math.max(12, layout.statusFontSize));

      redrawTopActions();
    };

    backHit
      .on('pointerover', () => {
        backHovered = true;
        redrawTopActions();
        feedback.play('ui-hover');
      })
      .on('pointerout', () => { backHovered = false; redrawTopActions(); });
    menuHit
      .on('pointerover', () => {
        menuHovered = true;
        redrawTopActions();
        feedback.play('ui-hover');
      })
      .on('pointerout', () => { menuHovered = false; redrawTopActions(); });
    layoutTopActions();

    const platformServices = this.registry.get(PLATFORM_SERVICES_REGISTRY_KEY) as PlatformServices | null | undefined;
    const monetizationService = profileService !== null && platformServices != null
      ? MonetizationService.create(profileService, platformServices.ads)
      : null;
    const rewardedHintAvailable = platformServices?.kind === 'yandex'
      && monetizationService !== null;
    const submitRankedDailyResult = async (
      result: DailyCompletionResult,
    ): Promise<LeaderboardPlayerView | null> => {
      if (!result.ranked || platformServices == null) return null;
      const leaderboardName = getDailyLeaderboardName(result.dailyId);
      const packedScore = encodeDailyLeaderboardScore(result.dateKey, result.result.bestTimeMs);
      const submission = await platformServices.leaderboards.submitScore(
        leaderboardName,
        packedScore,
        JSON.stringify({
          dailyId: result.dailyId,
          dateKey: result.dateKey,
          timeMs: Math.floor(result.result.bestTimeMs),
        }),
      );
      if (submission !== 'submitted') return null;
      return platformServices.leaderboards.getPlayerEntry(leaderboardName);
    };
    const puzzleSession = profileService === null || completedReview
      ? null
      : campaignContext !== null
        ? PuzzleSessionService.createCampaign(
          launchData.level,
          profileService,
          campaignPlayState?.mode === 'active' ? campaignPlayState.savedPuzzle : undefined,
        )
        : tutorialContext !== null
          ? PuzzleSessionService.createTutorial(
            launchData.level,
            profileService,
            profileService.getProfile().tutorial.activePuzzle ?? undefined,
          )
          : dailyContext !== null && !dailyAlreadySolved
            ? PuzzleSessionService.createDaily(
              launchData.level,
              profileService,
              dailyContext.dateKey,
              profileService.getProfile().daily.drafts[dailyContext.dateKey],
            )
            : null;
    const puzzle = completedReview
      ? createCompletedReviewPuzzle(launchData.level)
      : puzzleSession?.getPuzzle() ?? new PuzzleState(launchData.level);
    puzzleSession?.saveNow();
    const interaction = new PuzzleInteractionSession(puzzle);
    let boardLayout = calculateStableBoardLayout(getTutorialLayoutBottomReserve(), chrome, safeTop);

    let board: BoardView | null = null;
    let solved = completedReview;
    let onboardingOpen = false;
    let onboardingBlocksInteraction = false;
    let onboardingBlocksTimer = false;
    let resetDialogOpen = false;
    let resetDialog: Phaser.GameObjects.Container | null = null;
    let hintConfirmOpen = false;
    let hintConfirmMode: 'free' | 'rewarded' | null = null;
    let rewardedHintRequestPending = false;
    let hintConfirmContainer: Phaser.GameObjects.Container | null = null;
    let currentHint: PuzzleHint | null = null;
    let completionMode = false;
    const getCurrentBoardBottomReserve = (): number => {
      const tutorialReserve = getTutorialLayoutBottomReserve();
      if (tutorialReserve > 0) return tutorialReserve;
      return completionMode && this.scale.height < 520 ? 40 : 0;
    };
    let completionTransitionPending = false;
    const completionButtons: Phaser.GameObjects.GameObject[] = [];
    const initialTimerMs = completedReview
      ? campaignPlayState?.displayTimeMs ?? 0
      : rankedDaily
        ? dailyContext?.elapsedMsAtLaunch ?? 0
        : puzzleSession?.getActivePlayMs() ?? 0;
    const activeTimer = new ActiveTimer(initialTimerMs);
    const rankedDailyDisplayAnchorMs = rankedDaily ? Date.now() : 0;
    const rankedDailyInitialElapsedMs = rankedDaily ? initialTimerMs : 0;
    const getDisplayedElapsedMs = (nowMs = readActiveClockMs()): number => {
      if (!rankedDaily) return activeTimer.getElapsedMs(nowMs);
      return rankedDailyInitialElapsedMs + Math.max(0, Date.now() - rankedDailyDisplayAnchorMs);
    };
    const formatHintCountdown = (ms: number): string => {
      const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };
    const rankedDailyHintRemainingMs = (): number => (
      rankedDaily ? Math.max(0, RANKED_DAILY_HINT_UNLOCK_MS - getDisplayedElapsedMs()) : 0
    );
    const rankedDailyHintUnlocked = (): boolean => rankedDailyHintRemainingMs() <= 0;
    let syncedActivePlayMs = initialTimerMs;
    let transientHintsUsed = 0;
    let sceneOverlayPaused = false;
    let gameMenuOpen = false;
    let gameMenuContainer: Phaser.GameObjects.Container | null = null;
    const platformGameplayActivity = platformServices == null
      ? null
      : new PlatformGameplayActivity(
        platformServices.gameplay,
        platformServices.lifecycle.isPaused(),
      );

    const updateTimerText = (nowMs = readActiveClockMs()): void => {
      timerText.setText(formatActiveTime(getDisplayedElapsedMs(nowMs)));
    };

    const syncTimerIntoSession = (nowMs = readActiveClockMs()): void => {
      const elapsedMs = activeTimer.getElapsedMs(nowMs);
      if (elapsedMs > syncedActivePlayMs) {
        const activeDeltaMs = elapsedMs - syncedActivePlayMs;
        puzzleSession?.addActiveTime(activeDeltaMs);
        profileService?.addActivePlayTime(activeDeltaMs);
        syncedActivePlayMs = elapsedMs;
      }
      updateTimerText(nowMs);
    };

    const internalTimerMayRun = (): boolean => {
      if (solved || onboardingBlocksTimer || resetDialogOpen || hintConfirmOpen || gameMenuOpen || sceneOverlayPaused) return false;
      return typeof document === 'undefined' || !document.hidden;
    };

    const timerMayRun = (): boolean => (
      internalTimerMayRun() && platformGameplayActivity?.isPlatformPaused() !== true
    );

    const pauseActiveTimer = (syncGameplayMarkup = true): void => {
      const nowMs = readActiveClockMs();
      activeTimer.pause(nowMs);
      syncTimerIntoSession(nowMs);
      if (syncGameplayMarkup) platformGameplayActivity?.stopInternal();
    };

    const resumeActiveTimer = (syncGameplayMarkup = true): void => {
      if (!internalTimerMayRun()) return;
      if (syncGameplayMarkup) platformGameplayActivity?.startInternal();
      if (!timerMayRun()) return;
      const nowMs = readActiveClockMs();
      activeTimer.resume(nowMs);
      updateTimerText(nowMs);
    };

    const savePuzzleSession = (): void => {
      syncTimerIntoSession();
      puzzleSession?.saveNow();
    };

    const flushProfileState = async (): Promise<void> => {
      if (puzzleSession !== null) {
        await puzzleSession.flush();
        return;
      }
      if (profileService !== null) {
        await profileService.flush();
      }
    };

    const showTouchToolButtons = shouldShowTouchToolButtons(
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(any-pointer: coarse)').matches
        : false,
      typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0,
    );

    type ToolbarVisual = {
      readonly id: PuzzleToolbarButtonId;
      readonly background: Phaser.GameObjects.Graphics;
      readonly hitArea: Phaser.GameObjects.Zone;
      readonly icon: Phaser.GameObjects.Image | null;
      readonly label: Phaser.GameObjects.Text;
      width: number;
      height: number;
      baseFill: number;
      disabled: boolean;
      hovered: boolean;
      pressed: boolean;
    };
    const toolbarVisuals = new Map<PuzzleToolbarButtonId, ToolbarVisual>();
    const toolbarIconKeys: Partial<Record<PuzzleToolbarButtonId, string>> = {
      wall: 'board-wall-01',
      floor: 'board-floor-mark',
      undo: 'ui-icon-undo',
      reset: 'ui-icon-reset',
      hint: 'ui-icon-hint',
    };
    const getToolbarRadius = (id: PuzzleToolbarButtonId): number => (
      id === 'wall' || id === 'floor'
        ? (this.scale.width < 700 ? 7 : 8)
        : (this.scale.width < 700 ? 9 : 10)
    );
    const adjustToolbarColor = (color: number, amount: number): number => {
      const r = Math.max(0, Math.min(255, ((color >> 16) & 0xff) + amount));
      const g = Math.max(0, Math.min(255, ((color >> 8) & 0xff) + amount));
      const b = Math.max(0, Math.min(255, (color & 0xff) + amount));
      return (r << 16) | (g << 8) | b;
    };
    const redrawToolbarBackground = (visual: ToolbarVisual): void => {
      const fill = visual.disabled
        ? visual.baseFill
        : visual.pressed
          ? adjustToolbarColor(visual.baseFill, -18)
          : visual.hovered
            ? adjustToolbarColor(visual.baseFill, 16)
            : visual.baseFill;
      visual.background.clear();
      visual.background.fillStyle(fill, 1);
      visual.background.fillRoundedRect(
        visual.hitArea.x - visual.width / 2,
        visual.hitArea.y - visual.height / 2,
        visual.width,
        visual.height,
        getToolbarRadius(visual.id),
      );
    };
    const fitToolbarLabelToButton = (
      visual: ToolbarVisual,
      width: number,
      iconSize: number,
      gap: number,
    ): void => {
      const narrowToolbar = this.scale.width < 700;
      const baseFontSize = narrowToolbar ? 15 : 17;
      const minFontSize = narrowToolbar ? 10 : 12;
      const horizontalPadding = narrowToolbar ? 12 : 16;
      visual.label.setFontSize(baseFontSize);
      const availableTextWidth = Math.max(24, width - iconSize - gap - horizontalPadding * 2);
      if (visual.label.width > availableTextWidth) {
        visual.label.setFontSize(
          Math.max(minFontSize, Math.floor(baseFontSize * availableTextWidth / visual.label.width)),
        );
      }
    };

    const layoutToolbarContent = (
      visual: ToolbarVisual,
      x: number,
      y: number,
      width: number,
      height: number,
    ): void => {
      visual.width = width;
      visual.height = height;
      visual.hitArea.setPosition(x, y).setSize(width, height);
      const narrowToolbar = this.scale.width < 700;
      const iconSize = visual.id === 'wall'
        ? (narrowToolbar ? 30 : 34)
        : visual.id === 'floor'
          ? (narrowToolbar ? 26 : 30)
          : (narrowToolbar ? 22 : 28);
      if (visual.icon === null) {
        visual.label.setPosition(x, y).setOrigin(0.5);
      } else {
        visual.icon.setDisplaySize(iconSize, iconSize);
        const gap = narrowToolbar ? 8 : 10;
        fitToolbarLabelToButton(visual, width, iconSize, gap);
        const totalWidth = iconSize + gap + visual.label.width;
        const startX = x - totalWidth / 2;
        visual.icon.setPosition(startX + iconSize / 2, y);
        visual.label.setPosition(startX + iconSize + gap, y).setOrigin(0, 0.5);
      }
      redrawToolbarBackground(visual);
    };
    let toolbarLayout: PuzzleToolbarLayout = calculatePuzzleToolbarLayout(
      this.scale.width,
      this.scale.height,
      readSafeArea('--safe-area-inset-bottom'),
      showTouchToolButtons,
      boardLayout.originY + boardLayout.boardHeight,
      showTouchToolButtons && currentHint !== null,
    );
    const recalculateToolbarLayout = (layout = boardLayout): void => {
      toolbarLayout = calculatePuzzleToolbarLayout(
        this.scale.width,
        this.scale.height,
        readSafeArea('--safe-area-inset-bottom'),
        showTouchToolButtons,
        layout.originY + layout.boardHeight,
        showTouchToolButtons && currentHint !== null,
      );
    };

    const statusText = this.add.text(
      this.scale.width / 2,
      Math.min(...toolbarLayout.buttons.map((button) => button.y - button.height / 2)) - 18,
      showTouchToolButtons ? '' : copy.game.mouseControls,
      {
        fontFamily: 'monospace',
        fontSize: `${chrome.statusFontSize}px`,
        color: '#89929d',
        fontStyle: 'bold',
      },
    ).setOrigin(0.5);

    const positionStatusText = (): void => {
      const width = this.scale.width;
      const currentChrome = calculatePuzzleChromeLayout(width, this.scale.height);
      if (showTouchToolButtons && currentHint !== null && toolbarLayout.mode === 'stacked') {
        const toolButtons = toolbarLayout.buttons.filter((button) => button.id === 'wall' || button.id === 'floor');
        const actionButtons = toolbarLayout.buttons.filter((button) => button.id === 'undo' || button.id === 'reset' || button.id === 'hint');
        if (toolButtons.length > 0 && actionButtons.length > 0) {
          const toolBottom = Math.max(...toolButtons.map((button) => button.y + button.height / 2));
          const actionTop = Math.min(...actionButtons.map((button) => button.y - button.height / 2));
          statusText
            .setPosition(width / 2, (toolBottom + actionTop) / 2)
            .setWordWrapWidth(Math.min(Math.max(180, width - 32), 520), true)
            .setFontSize(this.scale.height < 500 ? 12 : width < 700 ? 15 : currentChrome.statusFontSize)
            .setAlign('center');
          return;
        }
      }
      const toolbarTop = Math.min(
        ...toolbarLayout.buttons.map((button) => button.y - button.height / 2),
      );
      statusText
        .setPosition(width / 2, toolbarTop - 18)
        .setWordWrapWidth(Math.max(120, width - 24), true)
        .setFontSize(width < 700 ? 14 : currentChrome.statusFontSize)
        .setAlign('center');
    };

    const onboardingSteps = launchData.context.mode === 'tutorial'
      && launchData.contextualOnboarding
      ? createOnboardingFlow(launchData.context.tutorialLevelId, language)
      : [];
    const hasSavedTutorialProgress = tutorialContext !== null && onboardingSteps.some((step) => (
      step.cells.some(({ x, y }) => puzzle.getCellState(x, y) !== 'unknown')
    ));
    const firstUnsatisfiedTutorialStep = hasSavedTutorialProgress
      ? onboardingSteps.findIndex((step) => (
        !isOnboardingStepSatisfied(step, (x, y) => puzzle.getCellState(x, y))
      ))
      : -1;
    let onboardingIndex = onboardingSteps.length === 0
      ? -1
      : firstUnsatisfiedTutorialStep >= 0
        ? firstUnsatisfiedTutorialStep
        : hasSavedTutorialProgress
          ? onboardingSteps.length - 1
          : 0;
    onboardingOpen = onboardingIndex >= 0;

    const onboardingPanel = this.add.graphics()
      .setVisible(false)
      .setDepth(50);
    const onboardingText = this.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#f4ead7',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 420 },
    })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(52);
    const currentOnboardingStep = (): OnboardingStep | null => (
      onboardingIndex >= 0 ? onboardingSteps[onboardingIndex] ?? null : null
    );

    const relayoutOnboarding = (): void => {
      const step = currentOnboardingStep();
      if (!onboardingOpen || step === null) {
        onboardingPanel.setVisible(false);
        onboardingText.setVisible(false);
        board?.setTutorialCellTargets(null);
        return;
      }

      const narrowScreen = this.scale.width < 700 || this.scale.height < 520;
      const panelWidth = Math.min(
        this.scale.width - (narrowScreen ? 28 : 56),
        Math.max(
          narrowScreen ? 300 : 420,
          boardLayout.boardWidth + boardLayout.cellSize * 1.6,
        ),
        narrowScreen ? 360 : 520,
      );
      const panelX = boardLayout.originX + boardLayout.boardWidth / 2;

      onboardingText
        .setWordWrapWidth(Math.max(120, panelWidth - 36), true)
        .setFontSize(narrowScreen ? 15 : 18)
        .setText(step.message);

      const verticalPadding = narrowScreen ? 12 : 15;
      const panelHeight = Math.max(
        narrowScreen ? 56 : 68,
        onboardingText.height + verticalPadding * 2,
      );
      const clueFontSize = Math.max(16, Math.round(boardLayout.cellSize * 0.5));
      const tutorialClueTopY = boardLayout.originY
        - boardLayout.cellSize * 0.3
        - clueFontSize * 0.65;
      const panelBottomGap = narrowScreen ? 10 : 16;
      const panelY = tutorialClueTopY - panelBottomGap - panelHeight / 2;

      const panelLeft = panelX - panelWidth / 2;
      const panelTop = panelY - panelHeight / 2;
      const panelRadius = narrowScreen ? 10 : 12;
      onboardingPanel
        .clear()
        .fillStyle(0x111b2f, 0.98)
        .fillRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, panelRadius)
        .lineStyle(narrowScreen ? 1 : 2, 0x6482ad, 0.95)
        .strokeRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, panelRadius)
        .setVisible(true);
      onboardingText
        .setPosition(panelX, panelY)
        .setVisible(true);

      board?.setTutorialCellTargets(step.cells, step.expectedState);
    };

    const controlsLocked = (): boolean => (
      solved
      || onboardingBlocksInteraction
      || resetDialogOpen
      || hintConfirmOpen
      || gameMenuOpen
      || platformGameplayActivity?.isPlatformPaused() === true
    );

    const closeGameMenu = (): void => {
      if (!gameMenuOpen) return;
      gameMenuOpen = false;
      gameMenuContainer?.destroy(true);
      gameMenuContainer = null;
      if (!solved && !resetDialogOpen && !hintConfirmOpen) {
        board?.setInputEnabled(platformGameplayActivity?.isPlatformPaused() !== true);
      }
      resumeActiveTimer();
    };

    const leaveGameTo = (sceneKey: string): void => {
      board?.setInputEnabled(false);
      pauseActiveTimer();
      savePuzzleSession();
      const leave = async (): Promise<void> => {
        try {
          await flushProfileState();
        } catch (error) {
          console.warn('[Dungeon Logic] Could not flush profile state before leaving; keeping dirty in-memory state.', error);
        }
        if (this.scene.isActive()) this.scene.start(sceneKey);
      };
      void leave();
    };

    const openSceneOverlayFromMenu = (sceneKey: string): void => {
      gameMenuOpen = false;
      gameMenuContainer?.destroy(true);
      gameMenuContainer = null;
      board?.setInputEnabled(false);
      pauseActiveTimer();
      savePuzzleSession();
      sceneOverlayPaused = true;
      this.scene.launch(sceneKey, { returnSceneKey: 'GameScene' });
      this.scene.pause();
    };

    const renderGameMenu = (): void => {
      gameMenuContainer?.destroy(true);
      const container = this.add.container(0, 0).setDepth(200);
      gameMenuContainer = container;

      const narrowMenu = this.scale.width < 700;
      const overlay = this.add.rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height,
        0x080d18,
        0.82,
      ).setInteractive();
      container.add(overlay);

      const buttonWidth = Math.min(
        this.scale.width - (narrowMenu ? 36 : 72),
        narrowMenu ? 340 : 420,
      );
      const buttonHeight = narrowMenu ? 54 : 60;
      const buttonGap = narrowMenu ? 10 : 14;
      const titleHeight = narrowMenu ? 44 : 52;
      const totalHeight = titleHeight
        + 18
        + buttonHeight * 4
        + buttonGap * 3;
      const centerX = this.scale.width / 2;
      const topY = this.scale.height / 2 - totalHeight / 2;
      const title = this.add.text(centerX, topY, copy.game.menu, {
        fontFamily: 'monospace',
        fontSize: narrowMenu ? '22px' : '28px',
        color: '#f4ead7',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0);
      container.add(title);

      const options = [
        {
          label: copy.game.continueGame,
          icon: 'play' as const,
          labelColor: '#f4ead7',
          action: closeGameMenu,
        },
        {
          label: copy.game.rules,
          icon: 'info' as const,
          labelColor: '#f4ead7',
          action: () => openSceneOverlayFromMenu(HELP_SCENE_KEY),
        },
        {
          label: copy.common.settings,
          icon: 'settings' as const,
          labelColor: '#f4ead7',
          action: () => openSceneOverlayFromMenu(SETTINGS_SCENE_KEY),
        },
        {
          label: copy.game.exitHome,
          icon: 'back' as const,
          labelColor: '#d98a8e',
          action: () => leaveGameTo(HOME_SCENE_KEY),
        },
      ];

      const firstButtonY = topY + titleHeight + 18 + buttonHeight / 2;
      options.forEach((option, index) => {
        const button = createHomeMenuButton(this, {
          x: centerX,
          y: firstButtonY + index * (buttonHeight + buttonGap),
          width: buttonWidth,
          height: buttonHeight,
          label: option.label,
          labelColor: option.labelColor,
          icon: option.icon,
          onActivate: () => option.action(),
        });
        container.add([button.fill, button.frame, button.icon, button.label]);
      });
    };

    const openGameMenu = (): void => {
      if (gameMenuOpen || resetDialogOpen || hintConfirmOpen || rewardedHintRequestPending) return;
      gameMenuOpen = true;
      board?.setInputEnabled(false);
      pauseActiveTimer();
      savePuzzleSession();
      renderGameMenu();
    };

    const onboardingAllowsTool = (tool: 'wall' | 'floor'): boolean => {
      const step = currentOnboardingStep();
      if (!onboardingOpen || step === null) return true;
      return step.expectedState === tool;
    };

    let toolbarVisible = true;
    const syncToolbar = (): void => {
      recalculateToolbarLayout();
      const hintStatus = profileService?.getHintRechargeStatus(Date.now());
      const rankedHintOpen = !rankedDaily || rankedDailyHintUnlocked();
      const state = createPuzzleToolbarState(
        interaction.getActiveTool(),
        interaction.canUndo(),
        showTouchToolButtons,
        rankedHintOpen ? hintStatus?.freeRemaining ?? 0 : 0,
        rankedHintOpen && rewardedHintAvailable,
        language,
        rankedDaily && !rankedHintOpen
          ? {
            label: copy.game.hintLocked(formatHintCountdown(rankedDailyHintRemainingMs())),
            disabled: true,
          }
          : undefined,
      );
      const step = currentOnboardingStep();

      for (const buttonState of state.buttons) {
        const visual = toolbarVisuals.get(buttonState.id);
        if (visual === undefined) continue;

        const isToolSelector = buttonState.id === 'wall' || buttonState.id === 'floor';
        const toolAllowed = isToolSelector
          ? onboardingAllowsTool(buttonState.id)
          : !onboardingBlocksInteraction;
        const resetAllowedInReview = completedReview && buttonState.id === 'reset';
        const disabled = (solved && !resetAllowedInReview)
          || resetDialogOpen
          || !toolAllowed
          || buttonState.disabled
          || (buttonState.id === 'reset' && !completedReview && interaction.getEditCount() === 0)
          || (buttonState.id === 'hint' && currentHint !== null);
        const guided = onboardingOpen
          && step !== null
          && buttonState.id === step.expectedState;
        const fill = disabled
          ? 0x1a2238
          : buttonState.id === 'reset'
            ? 0xc96568
            : guided
              ? 0x8a5155
              : isToolSelector
                ? (buttonState.active ? 0x40577f : 0x18233a)
                : 0x1f2c4a;
        const textColor = disabled
          ? '#6f788c'
          : guided
            ? '#fff0e8'
            : '#f4ead7';
        const buttonLayout = toolbarLayout.buttons.find((button) => button.id === buttonState.id);
        const buttonVisible = toolbarVisible && buttonLayout !== undefined;

        visual.baseFill = fill;
        visual.disabled = disabled;
        visual.pressed = false;
        visual.label.setText(buttonState.label).setColor(textColor);
        if (visual.icon !== null) {
          visual.icon.setAlpha(disabled ? 0.52 : 1);
          if (!isToolSelector) {
            visual.icon.setTint(Phaser.Display.Color.HexStringToColor(textColor).color);
          } else {
            visual.icon.clearTint();
          }
        }
        visual.hitArea.disableInteractive();
        if (!disabled && buttonVisible) visual.hitArea.setInteractive({ useHandCursor: true });
        if (buttonLayout !== undefined) {
          layoutToolbarContent(
            visual,
            buttonLayout.x,
            buttonLayout.y,
            buttonLayout.width,
            buttonLayout.height,
          );
        } else {
          redrawToolbarBackground(visual);
        }

        visual.background.setVisible(buttonVisible);
        visual.hitArea.setVisible(buttonVisible);
        visual.icon?.setVisible(buttonVisible);
        visual.label.setVisible(buttonVisible);
      }
    };

    const setToolbarVisible = (visible: boolean): void => {
      toolbarVisible = visible;
      recalculateToolbarLayout();
      const visibleIds = new Set(toolbarLayout.buttons.map((button) => button.id));
      for (const [id, visual] of toolbarVisuals) {
        const buttonVisible = visible && visibleIds.has(id);
        visual.background.setVisible(buttonVisible);
        visual.hitArea.setVisible(buttonVisible);
        visual.icon?.setVisible(buttonVisible);
        visual.label.setVisible(buttonVisible);
      }
    };

    const defaultStatusCopy = (): string => (
      showTouchToolButtons ? '' : copy.game.mouseControls
    );

    const refreshStatusText = (): void => {
      if (completedReview) {
        const result = campaignContext === null || profileService === null
          ? undefined
          : profileService.getProfile().campaign.levelResults[campaignContext.campaignLevelId];
        const hintCopy = result === undefined || result.minHintsUsed === 0
          ? copy.game.withoutHints
          : copy.game.hintsCount(result.minHintsUsed);
        statusText
          .setWordWrapWidth(Math.max(120, this.scale.width - 24), true)
          .setAlign('center')
          .setText(result === undefined
            ? copy.common.solved
            : copy.game.solvedCampaign(formatActiveTime(result.bestTimeMs), hintCopy, '', ''))
          .setColor('#d8d1c4')
          .setVisible(true);
        return;
      }
      if (completionMode || hintConfirmOpen || onboardingOpen) return;
      if (currentHint !== null) {
        positionStatusText();
        statusText
          .setText(currentHint.state === 'wall'
            ? copy.game.hintWall
            : copy.game.hintFloor)
          .setColor('#f4ead7')
          .setFontStyle('bold')
          .setVisible(true);
        return;
      }
      const hintStatus = profileService?.getHintRechargeStatus(Date.now());
      if (!rankedDaily && hintStatus?.freeRemaining === 0 && hintStatus.nextRefillInMs !== null) {
        statusText
          .setText(copy.game.hintRechargeStatus(formatHintCountdown(hintStatus.nextRefillInMs)))
          .setColor('#89929d')
          .setVisible(true);
        return;
      }
      statusText
        .setText(defaultStatusCopy())
        .setColor('#89929d')
        .setVisible(true);
    };

    const closeHintConfirm = (): void => {
      if (rewardedHintRequestPending) return;
      hintConfirmContainer?.destroy(true);
      hintConfirmContainer = null;
      hintConfirmOpen = false;
      hintConfirmMode = null;
      if (!solved && !onboardingOpen && !resetDialogOpen) {
        board?.setInputEnabled(platformGameplayActivity?.isPlatformPaused() !== true);
      }
      setToolbarVisible(!completionMode);
      refreshStatusText();
      resumeActiveTimer();
      syncToolbar();
    };

    const applyDeliveredHint = (hint: PuzzleHint): void => {
      if (profileService === null) return;

      if (puzzleSession !== null) {
        puzzleSession.recordHint();
      } else if (launchData.context.mode === 'daily') {
        transientHintsUsed += 1;
      }
      currentHint = hint;
      feedback.play('hint');
      board?.setHintCellTarget(hint);
      recalculateToolbarLayout();
      if (showTouchToolButtons) {
        board?.setActiveTool(hint.state === 'wall' ? 'wall' : 'floor');
      }
      savePuzzleSession();
    };

    const deliverConfirmedHint = async (): Promise<void> => {
      if (profileService === null || rewardedHintRequestPending) {
        closeHintConfirm();
        return;
      }

      const rewardedMode = hintConfirmMode === 'rewarded';
      if (rewardedMode && (monetizationService === null || !rewardedHintAvailable)) {
        closeHintConfirm();
        return;
      }

      rewardedHintRequestPending = true;
      if (rewardedMode) {
        statusText
          .setText(copy.game.loadingAd)
          .setColor('#d0b978')
          .setVisible(true);
      }

      await requestHint({
        puzzle,
        consumeFreeHint: () => profileService.consumeFreeHint(Date.now()),
        requestRewarded: monetizationService === null
          ? null
          : () => monetizationService.requestRewardedHint(),
        recordRewardedHintUsed: () => profileService.recordRewardedHintUsed(),
        deliverHint: applyDeliveredHint,
      });

      rewardedHintRequestPending = false;
      if (createVersion !== this.createVersion || !this.scene.isActive()) return;
      closeHintConfirm();
    };

    const renderHintConfirm = (): void => {
      hintConfirmContainer?.destroy(true);
      hintConfirmContainer = null;
      if (!hintConfirmOpen) return;

      const safeBottom = readSafeArea('--safe-area-inset-bottom');
      const width = Math.min(390, this.scale.width - 24);
      const gap = 10;
      const buttonWidth = Math.floor((width - gap) / 2);
      const buttonHeight = this.scale.width < 700 ? 44 : 48;
      const rankedWarning = rankedDaily ? copy.game.dailyHintOutsideRating : '';
      const buttonLocalY = rankedWarning.length > 0 ? 34 : 12;
      const containerY = this.scale.height - safeBottom - 12 - buttonHeight / 2 - buttonLocalY;
      const container = this.add.container(this.scale.width / 2, containerY).setDepth(70);
      hintConfirmContainer = container;

      statusText.setVisible(false);

      const remaining = profileService?.getFreeHintsRemaining(Date.now()) ?? 0;
      const rewardedMode = hintConfirmMode === 'rewarded';
      const hintConfirmTitle = this.add.text(0, -54, rewardedMode
        ? copy.game.rewardedHintConfirmTitle
        : copy.game.hintConfirmTitle, {
        fontFamily: 'monospace',
        fontSize: this.scale.width < 700 ? '15px' : '18px',
        color: '#f4ead7',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5);
      const hintConfirmMeta = this.add.text(0, -28, rewardedMode
        ? copy.game.rewardedHintConfirmMeta
        : copy.game.freeHintsRemaining(remaining), {
        fontFamily: 'monospace',
        fontSize: this.scale.width < 700 ? '11px' : '13px',
        color: '#aebbd2',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5);

      const children: Phaser.GameObjects.GameObject[] = [hintConfirmTitle, hintConfirmMeta];
      if (rankedWarning.length > 0) {
        const warning = this.add.text(0, -4, rankedWarning, {
          fontFamily: 'monospace',
          fontSize: this.scale.width < 700 ? '10px' : '11px',
          color: '#aebbd2',
          align: 'center',
          wordWrap: { width: width - 20 },
        }).setOrigin(0.5);
        children.push(warning);
      }

      const cancelX = -buttonWidth / 2 - gap / 2;
      const showX = buttonWidth / 2 + gap / 2;
      const cancelButton = createCenteredTextMenuButton(this, {
        x: cancelX,
        y: buttonLocalY,
        width: buttonWidth,
        height: buttonHeight,
        label: copy.common.cancel,
        labelColor: '#f4ead7',
        compact: true,
        onActivate: () => closeHintConfirm(),
      });
      const confirmButton = createCenteredTextMenuButton(this, {
        x: showX,
        y: buttonLocalY,
        width: buttonWidth,
        height: buttonHeight,
        label: rewardedMode ? copy.game.ad : copy.game.show,
        labelColor: '#f0d28a',
        accentFrame: true,
        compact: true,
        onActivate: () => { void deliverConfirmedHint(); },
      });
      children.push(
        cancelButton.fill, cancelButton.frame, cancelButton.label,
        confirmButton.fill, confirmButton.frame, confirmButton.label,
      );
      container.add(children);
    };

    const showHintConfirm = (): void => {
      if (rankedDaily && !rankedDailyHintUnlocked()) {
        syncToolbar();
        return;
      }
      if (currentHint !== null) {
        refreshStatusText();
        return;
      }
      if (controlsLocked() || profileService === null || chooseHint(puzzle) === null) return;
      const remaining = profileService.getFreeHintsRemaining(Date.now());
      const mode: 'free' | 'rewarded' = remaining > 0 ? 'free' : 'rewarded';
      if (mode === 'rewarded' && !rewardedHintAvailable) return;

      hintConfirmOpen = true;
      hintConfirmMode = mode;
      board?.setInputEnabled(false);
      pauseActiveTimer();
      setToolbarVisible(false);
      statusText.setVisible(false);
      renderHintConfirm();
      syncToolbar();
    };

    const clearCompletionButtons = (): void => {
      for (const visual of completionButtons.splice(0)) {
        visual.destroy();
      }
    };

    let completionActions: Array<{ readonly label: string; readonly action: () => void }> = [];

    const positionCompletionStatusText = (): void => {
      const safeBottom = readSafeArea('--safe-area-inset-bottom');
      const buttonHeight = 48;
      const buttonTop = this.scale.height - safeBottom - 12 - buttonHeight;
      statusText
        .setOrigin(0.5, 1)
        .setPosition(this.scale.width / 2, buttonTop - 18)
        .setWordWrapWidth(Math.max(120, this.scale.width - 32), true)
        .setAlign('center');
    };

    const renderCompletionButtons = (): void => {
      clearCompletionButtons();
      if (!completionMode || completionActions.length === 0) return;
      positionCompletionStatusText();

      const safeBottom = readSafeArea('--safe-area-inset-bottom');
      const count = completionActions.length;
      const gap = count >= 3 ? 8 : 10;
      const maxWidth = Math.min(this.scale.width - 24, count >= 3 ? 560 : 350);
      const buttonHeight = 48;
      const buttonWidth = count === 1
        ? Math.min(190, maxWidth)
        : Math.floor((maxWidth - gap * (count - 1)) / count);
      const totalWidth = buttonWidth * count + gap * (count - 1);
      const startX = (this.scale.width - totalWidth) / 2;
      const y = this.scale.height - safeBottom - 12 - buttonHeight / 2;

      completionActions.forEach((definition, index) => {
        const x = startX + index * (buttonWidth + gap) + buttonWidth / 2;
        const handle = createCenteredTextMenuButton(this, {
          x,
          y,
          width: buttonWidth,
          height: buttonHeight,
          label: definition.label,
          labelColor: '#f0d28a',
          compact: count >= 3,
          accentFrame: false,
          onActivate: () => definition.action(),
        });
        handle.fill.setDepth(60);
        handle.frame.setDepth(61);
        handle.label.setDepth(62);
        completionButtons.push(handle.fill, handle.frame, handle.label);
      });
    };

    const launchUnlockedDaily = (): void => {
      if (completionTransitionPending) return;
      completionTransitionPending = true;
      pauseActiveTimer();
      this.scene.start(DAILY_SCENE_KEY);
    };

    const showCompletionState = (
      result: CampaignCompletionResult,
      metadata: CampaignCompletionMetadata,
      newBestTime: boolean,
    ): void => {
      completionMode = true;
      currentHint = null;
      board?.setHintCellTarget(null);
      if (this.scale.height < 520) {
        boardLayout = calculateStableBoardLayout(40);
        board?.relayout(boardLayout.originX, boardLayout.originY, boardLayout.cellSize);
      }
      setToolbarVisible(false);
      const hintCopy = metadata.minHintsUsed === 0
        ? copy.game.withoutHints
        : copy.game.hintsCount(metadata.minHintsUsed);
      const recordCopy = newBestTime ? copy.game.newRecord : '';
      const unlockCopy = '';
      const solvedCopy = copy.game.solvedCampaign(
        formatActiveTime(metadata.bestTimeMs),
        hintCopy,
        recordCopy,
        unlockCopy,
      );
      const featureUnlockCopy = result.unlockedFeatures.length > 0
        ? `

${copy.game.featuresUnlocked}`
        : '';
      statusText
        .setWordWrapWidth(Math.max(120, this.scale.width - 24), true)
        .setAlign('center')
        .setText(`${solvedCopy}${featureUnlockCopy}`)
        .setColor('#d8d1c4')
        .setVisible(true);

      const continueCampaign = (): void => {
        if (result.recommendedNextLevel === null || completionTransitionPending) return;
        completionTransitionPending = true;
        pauseActiveTimer();
        const service = this.getCampaignService();
        const transition = async (): Promise<void> => {
          if (monetizationService !== null && completedCampaignSlot !== null) {
            await monetizationService.maybeShowCampaignInterstitial(completedCampaignSlot);
          }
          if (createVersion !== this.createVersion) return;
          await this.startNextLevel(result.recommendedNextLevel!, service, createVersion);
        };
        void transition().finally(() => {
          if (createVersion === this.createVersion) completionTransitionPending = false;
        });
      };

      if (result.unlockedFeatures.length > 0) {
        completionActions = [
          {
            label: copy.game.dailyTitle,
            action: launchUnlockedDaily,
          },
          {
            label: copy.common.statistics,
            action: () => this.scene.start(STATS_SCENE_KEY),
          },
          result.recommendedNextLevel === null
            ? {
              label: copy.game.home,
              action: () => this.scene.start(HOME_SCENE_KEY),
            }
            : {
              label: copy.game.next,
              action: continueCampaign,
            },
        ];
      } else {
        completionActions = [
          {
            label: copy.common.levels,
            action: () => this.scene.start(LEVELS_SCENE_KEY),
          },
        ];
        if (result.recommendedNextLevel !== null) {
          completionActions.push({
            label: copy.game.next,
            action: continueCampaign,
          });
        }
      }
      renderCompletionButtons();
    };

    const showTutorialCompletionState = (
      result: TutorialCompletionResult,
    ): void => {
      completionMode = true;
      onboardingIndex = -1;
      onboardingOpen = false;
      onboardingBlocksInteraction = false;
      onboardingBlocksTimer = false;
      currentHint = null;
      board?.setHintCellTarget(null);
      board?.setInputCellTargets(null);
      board?.setTutorialCellTargets(null);
      relayoutOnboarding();
      setToolbarVisible(false);

      statusText
        .setWordWrapWidth(Math.max(120, this.scale.width - 24), true)
        .setAlign('center')
        .setText(
          result.tutorialCompleted && result.recommendedNextLevel === null
            ? copy.game.tutorialComplete
            : `✓ ${copy.common.solved}`,
        )
        .setColor('#d8d1c4')
        .setVisible(true);

      completionActions = [
        {
          label: copy.game.home,
          action: () => this.scene.start(HOME_SCENE_KEY),
        },
      ];

      if (result.recommendedNextLevel !== null) {
        const nextLevel = result.recommendedNextLevel;
        const service = this.getTutorialService();
        completionActions.push({
          label: copy.game.next,
          action: () => {
            if (completionTransitionPending) return;
            completionTransitionPending = true;
            void service.startLevel(nextLevel.id)
              .then((started) => {
                if (createVersion !== this.createVersion) return;
                this.scene.restart(createTutorialGameSceneData(started));
              })
              .catch((error) => {
                console.error(`[Dungeon Logic] Could not start ${nextLevel.id}.`, error);
                completionTransitionPending = false;
              });
          },
        });
      } else if (result.tutorialCompleted) {
        completionActions.push({
          label: copy.game.startLevels,
          action: () => {
            if (completionTransitionPending) return;
            const service = this.getCampaignService();
            const firstLevel = service.getLevels()[0];
            if (firstLevel === undefined) return;
            completionTransitionPending = true;
            void service.startLevel(firstLevel.id)
              .then((started) => {
                if (createVersion !== this.createVersion) return;
                this.scene.restart(createCampaignGameSceneData(started, service.getProgress()));
              })
              .catch((error) => {
                console.error('[Dungeon Logic] Could not start Campaign after Tutorial.', error);
                completionTransitionPending = false;
              });
          },
        });
      }
      renderCompletionButtons();
    };

    const showDailyCompletionState = (
      result: DailyCompletionResult,
      leaderboardEntry: LeaderboardPlayerView | null,
    ): void => {
      completionMode = true;
      currentHint = null;
      board?.setHintCellTarget(null);
      if (this.scale.height < 520) {
        boardLayout = calculateStableBoardLayout(40);
        board?.relayout(boardLayout.originX, boardLayout.originY, boardLayout.cellSize);
      }
      setToolbarVisible(false);

      const recent = getRecentDailyHistory(
        result.dateKey,
        this.getDailyService().getHistory().solvedDates,
        7,
      );
      const recentCopy = recent
        .map((day) => day.solved ? (day.isToday ? '◆' : '●') : '·')
        .join(' ');
      const rankingCopy = leaderboardEntry === null
        ? copy.game.dailyResultFixed
        : `${copy.game.dailyResultFixed} · ${copy.game.dailyPlace(leaderboardEntry.place)}`;

      statusText
        .setWordWrapWidth(Math.max(120, this.scale.width - 24), true)
        .setAlign('center')
        .setText(
          `${rankingCopy}
${copy.game.solvedDaily(formatActiveTime(result.result.bestTimeMs), copy.game.withoutHints, '')}`
          + `
${copy.game.streakRecent(result.currentStreak, recentCopy)}`,
        )
        .setColor('#d8d1c4')
        .setVisible(true);

      completionActions = [
        {
          label: copy.game.home,
          action: () => this.scene.start(HOME_SCENE_KEY),
        },
        {
          label: copy.common.leaderboard,
          action: () => this.scene.start(LEADERBOARD_SCENE_KEY, {
            dailyId: result.dailyId,
            dateKey: result.dateKey,
          }),
        },
      ];
      renderCompletionButtons();
    };

    const showDailyArchiveCompletionState = (
      result: DailyCompletionResult,
    ): void => {
      completionMode = true;
      currentHint = null;
      board?.setHintCellTarget(null);
      setToolbarVisible(false);
      statusText
        .setWordWrapWidth(Math.max(120, this.scale.width - 24), true)
        .setAlign('center')
        .setText(
          `${copy.game.dailyArchiveComplete}
${copy.game.dailyArchiveFirstResult(formatActiveTime(result.result.bestTimeMs))}
${copy.game.dailyArchiveOutsideRating}`,
        )
        .setColor('#d8d1c4')
        .setVisible(true);
      completionActions = [
        {
          label: copy.game.dailyTitle,
          action: () => this.scene.start(DAILY_SCENE_KEY),
        },
        {
          label: copy.game.home,
          action: () => this.scene.start(HOME_SCENE_KEY),
        },
      ];
      renderCompletionButtons();
    };

    const showDailyAssistedCompletionState = (
      result: DailyCompletionResult,
    ): void => {
      completionMode = true;
      currentHint = null;
      board?.setHintCellTarget(null);
      setToolbarVisible(false);
      const recent = getRecentDailyHistory(
        result.dateKey,
        this.getDailyService().getHistory().solvedDates,
        7,
      );
      const recentCopy = recent
        .map((day) => day.solved ? (day.isToday ? '◆' : '●') : '·')
        .join(' ');
      statusText
        .setWordWrapWidth(Math.max(120, this.scale.width - 24), true)
        .setAlign('center')
        .setText(
          `${copy.game.solvedDaily(
            formatActiveTime(result.result.bestTimeMs),
            copy.game.hintsCount(result.result.minHintsUsed),
            '',
          )}
${copy.game.dailyArchiveOutsideRating}
${copy.game.streakRecent(result.currentStreak, recentCopy)}`,
        )
        .setColor('#d8d1c4')
        .setVisible(true);
      completionActions = [
        {
          label: copy.game.dailyTitle,
          action: () => this.scene.start(DAILY_SCENE_KEY),
        },
        {
          label: copy.game.home,
          action: () => this.scene.start(HOME_SCENE_KEY),
        },
      ];
      renderCompletionButtons();
    };

    const showDailyPracticeCompletionState = (
      metadata: CampaignCompletionMetadata,
    ): void => {
      completionMode = true;
      currentHint = null;
      board?.setHintCellTarget(null);
      setToolbarVisible(false);
      statusText
        .setWordWrapWidth(Math.max(120, this.scale.width - 24), true)
        .setAlign('center')
        .setText(`✓ ${copy.common.solved} · ${formatActiveTime(metadata.bestTimeMs)} · ${copy.game.dailyPractice}`)
        .setColor('#d8d1c4')
        .setVisible(true);
      completionActions = [
        {
          label: copy.game.dailyTitle,
          action: () => this.scene.start(DAILY_SCENE_KEY),
        },
        {
          label: copy.game.home,
          action: () => this.scene.start(HOME_SCENE_KEY),
        },
      ];
      renderCompletionButtons();
    };

    const finishOnboarding = (): void => {
      onboardingIndex = -1;
      onboardingOpen = false;
      onboardingBlocksInteraction = false;
      onboardingBlocksTimer = false;
      board?.setInputCellTargets(null);
      board?.setTutorialCellTargets(null);
      boardLayout = calculateStableBoardLayout(getCurrentBoardBottomReserve());
      board?.relayout(boardLayout.originX, boardLayout.originY, boardLayout.cellSize);
      if (!solved && !resetDialogOpen) {
        board?.setInputEnabled(platformGameplayActivity?.isPlatformPaused() !== true);
      }
      statusText.setVisible(true);
      relayoutOnboarding();
      resumeActiveTimer();
      syncToolbar();
    };

    function advanceOnboarding(): void {
      if (!onboardingOpen) return;
      onboardingIndex += 1;
      if (onboardingIndex >= onboardingSteps.length) {
        finishOnboarding();
        return;
      }
      applyOnboardingStep();
    }

    const applyOnboardingStep = (): void => {

      while (true) {
        const step = currentOnboardingStep();
        if (step === null) {
          finishOnboarding();
          return;
        }
        if (isOnboardingStepSatisfied(step, (x, y) => puzzle.getCellState(x, y))) {
          onboardingIndex += 1;
          continue;
        }
        break;
      }

      const step = currentOnboardingStep();
      if (step === null) {
        finishOnboarding();
        return;
      }

      statusText.setVisible(false);
      board?.setInputCellTargets(null);

      onboardingBlocksInteraction = true;
      onboardingBlocksTimer = true;
      pauseActiveTimer();
      boardLayout = calculateStableBoardLayout(getCurrentBoardBottomReserve());
      board?.relayout(boardLayout.originX, boardLayout.originY, boardLayout.cellSize);
      board?.setInputCellTargets(step.cells);
      board?.setInputEnabled(platformGameplayActivity?.isPlatformPaused() !== true);

      relayoutOnboarding();
      syncToolbar();
    };

    const setActiveTool = (tool: 'wall' | 'floor'): void => {
      if (solved || resetDialogOpen) return;
      if (onboardingOpen && !onboardingAllowsTool(tool)) return;

      board?.setActiveTool(tool);
      feedback.play('ui-click');
      syncToolbar();
    };

    const startFreshCampaignReplay = async (): Promise<void> => {
      if (!completedReview || profileService === null || campaignContext === null) return;

      const freshSession = PuzzleSessionService.createCampaign(
        launchData.level,
        profileService,
        undefined,
      );
      freshSession.saveNow();
      try {
        await freshSession.flush();
      } catch (error) {
        console.warn('[Dungeon Logic] Could not persist fresh campaign replay before restart; using in-memory state.', error);
      }
      if (createVersion !== this.createVersion || !this.scene.isActive()) return;
      this.scene.restart(launchData);
    };

    const closeResetDialog = (): void => {
      resetDialog?.destroy(true);
      resetDialog = null;
      resetDialogOpen = false;
      if (!solved && !onboardingOpen) {
        board?.setInputEnabled(platformGameplayActivity?.isPlatformPaused() !== true);
      }
      resumeActiveTimer();
      syncToolbar();
    };

    const relayoutResetDialog = (): void => {
      if (resetDialog === null) return;
      resetDialog.setPosition(this.scale.width / 2, this.scale.height / 2);
    };

    const showResetDialog = (): void => {
      if (resetDialogOpen || (solved && !completedReview)) return;
      resetDialogOpen = true;
      board?.setInputEnabled(false);
      pauseActiveTimer();
      syncToolbar();

      const modalChrome = calculatePuzzleChromeLayout(this.scale.width, this.scale.height);
      const width = Math.min(390, modalChrome.modalWidth);
      const height = 194;
      const container = this.add.container(this.scale.width / 2, this.scale.height / 2).setDepth(80);
      resetDialog = container;

      const shadow = this.add.graphics();
      shadow.fillStyle(0x050a13, 0.42);
      shadow.fillRoundedRect(-width / 2 + 4, -height / 2 + 7, width, height, 12);

      const panel = this.add.graphics();
      panel.fillStyle(0x1f2c4a, 0.98);
      panel.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
      panel.lineStyle(1, 0x4b6386, 0.92);
      panel.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);

      const title = this.add.text(0, -66, copy.game.resetTitle, {
        fontFamily: 'monospace',
        fontSize: `${modalChrome.modalTitleFontSize}px`,
        color: '#f0bd63',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5);

      const titleAccent = this.add.graphics();
      const titleGap = title.width / 2 + 16;
      const diamondOffset = titleGap + 10;
      titleAccent.lineStyle(1, 0xf0b14f, 0.45);
      titleAccent.lineBetween(-width / 2 + 28, -66, -diamondOffset - 6, -66);
      titleAccent.lineBetween(diamondOffset + 6, -66, width / 2 - 28, -66);
      titleAccent.fillStyle(0xf0b14f, 0.85);
      for (const x of [-diamondOffset, diamondOffset]) {
        titleAccent.beginPath();
        titleAccent.moveTo(x, -70);
        titleAccent.lineTo(x + 4, -66);
        titleAccent.lineTo(x, -62);
        titleAccent.lineTo(x - 4, -66);
        titleAccent.closePath();
        titleAccent.fillPath();
      }
      const dialogCopy = this.add.text(0, -20, copy.game.resetBody, {
        fontFamily: 'monospace',
        fontSize: `${modalChrome.modalCopyFontSize}px`,
        color: '#e7e1d6',
        align: 'center',
        lineSpacing: 3,
        wordWrap: { width: width - 48 },
      }).setOrigin(0.5);

      const gap = 10;
      const buttonWidth = Math.floor((width - 44 - gap) / 2);
      const cancelX = -buttonWidth / 2 - gap / 2;
      const resetX = buttonWidth / 2 + gap / 2;
      const buttonY = 54;
      const buttonHeight = 48;

      const cancelButton = createCenteredTextMenuButton(this, {
        x: cancelX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        label: copy.common.cancel,
        labelColor: '#f4ead7',
        compact: true,
        onActivate: () => closeResetDialog(),
      });
      const confirmButton = createCenteredTextMenuButton(this, {
        x: resetX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        label: copy.common.reset,
        labelColor: '#f4ead7',
        compact: true,
        onActivate: () => {
          if (completedReview) {
            resetDialog?.destroy(true);
            resetDialog = null;
            resetDialogOpen = false;
            void startFreshCampaignReplay();
            return;
          }
          if (board?.reset()) feedback.play('reset');
          closeResetDialog();
        },
      });
      confirmButton.fill.setTint(0x8b5661);

      container.add([
        shadow, panel, titleAccent, title, dialogCopy,
        cancelButton.fill, cancelButton.frame, cancelButton.label,
        confirmButton.fill, confirmButton.frame, confirmButton.label,
      ]);
    };

    const requestReset = (): void => {
      if (completedReview) {
        if (resetDialogOpen || hintConfirmOpen || platformGameplayActivity?.isPlatformPaused() === true) return;
        showResetDialog();
        return;
      }
      if (controlsLocked() || interaction.getEditCount() === 0) return;
      if (shouldConfirmReset(interaction.getEditCount())) {
        showResetDialog();
        return;
      }
      if (board?.reset()) feedback.play('reset');
      syncToolbar();
    };

    const handlePuzzleChanged = (): void => {
      syncToolbar();
      if (solved) return;
      if (!validatePuzzle(puzzle).isSolved) return;

      solved = true;
      feedback.play('complete');
      board?.setSolvedVisualState(true);
      board?.setInputEnabled(false);
      pauseActiveTimer();
      savePuzzleSession();
      syncToolbar();
      setToolbarVisible(false);
      currentHint = null;
      board?.setHintCellTarget(null);

      const hintsUsed = puzzleSession?.getHintsUsed() ?? transientHintsUsed;
      const metadata: CampaignCompletionMetadata = {
        bestTimeMs: puzzleSession?.getActivePlayMs() ?? activeTimer.getElapsedMs(readActiveClockMs()),
        minHintsUsed: hintsUsed,
        solveCount: 1,
        solvedWithoutHints: hintsUsed === 0,
      };

      if (launchData.context.mode === 'dev') {
        completionMode = true;
        statusText
          .setText(copy.game.solvedCampaign(
            formatActiveTime(metadata.bestTimeMs),
            copy.game.withoutHints,
            '',
            '',
          ))
          .setColor('#d8d1c4')
          .setVisible(true);
        return;
      }

      if (launchData.context.mode === 'tutorial') {
        statusText.setText('').setVisible(false);
        void this.finishTutorialLevel(
          launchData,
          createVersion,
          puzzleSession,
        ).then((result) => {
          if (result === null || createVersion !== this.createVersion) return;
          showTutorialCompletionState(result);
        });
        return;
      }

      if (launchData.context.mode === 'daily') {
        statusText.setText('').setVisible(false);
        void this.finishDailyLevel(
          launchData,
          createVersion,
          metadata,
        ).then((result) => {
          if (result === null || createVersion !== this.createVersion) return;

          if (!result.wasFirstSolve) {
            this.time.delayedCall(350, () => {
              if (createVersion !== this.createVersion) return;
              showDailyPracticeCompletionState(metadata);
            });
            return;
          }

          if (!result.ranked) {
            this.time.delayedCall(350, () => {
              if (createVersion !== this.createVersion) return;
              if (result.archive) {
                showDailyArchiveCompletionState(result);
              } else {
                showDailyAssistedCompletionState(result);
              }
            });
            return;
          }

          let leaderboardEntry: LeaderboardPlayerView | null = null;
          let resultShown = false;
          void submitRankedDailyResult(result)
            .then((entry) => {
              if (createVersion !== this.createVersion) return;
              leaderboardEntry = entry;
              if (resultShown) showDailyCompletionState(result, leaderboardEntry);
            })
            .catch((error) => {
              console.warn('[Dungeon Logic] Could not submit ranked Daily result yet.', error);
            });
          this.time.delayedCall(500, () => {
            if (createVersion !== this.createVersion) return;
            resultShown = true;
            showDailyCompletionState(result, leaderboardEntry);
          });
        });
        return;
      }

      const previousResult = profileService?.getProfile().campaign.levelResults[launchData.context.campaignLevelId];
      const newBestTime = previousResult === undefined || metadata.bestTimeMs < previousResult.bestTimeMs;
      statusText.setText('').setVisible(false);

      void this.finishCampaignLevel(
        launchData,
        createVersion,
        puzzleSession,
        metadata,
      ).then((result) => {
        if (result === null || createVersion !== this.createVersion) return;
        this.time.delayedCall(500, () => {
          if (createVersion !== this.createVersion) return;
          showCompletionState(result, metadata, newBestTime);
        });
      });
    };

    const handleCellEdited = (
      x: number,
      y: number,
      previousState: CellStateValue,
      state: CellStateValue,
    ): void => {
      if (validatePuzzle(puzzle).isSolved) return;
      if (previousState === CellState.Wall && state === CellState.Unknown) {
        feedback.play('wall-remove');
        return;
      }
      if (
        (previousState === CellState.Unknown && state === CellState.Floor)
        || (previousState === CellState.Floor && state === CellState.Unknown)
      ) {
        feedback.play('marker-toggle');
        return;
      }
      if (state === CellState.Wall) {
        const overfilled = puzzle.getRowWallCount(y) > launchData.level.rowClues[y]
          || puzzle.getColumnWallCount(x) > launchData.level.columnClues[x];
        feedback.play(overfilled ? 'error' : 'wall-place');
      }
    };

    const handleEditCommitted = (): void => {
      savePuzzleSession();
      if (
        currentHint !== null
        && puzzle.getCellState(currentHint.x, currentHint.y) === currentHint.state
      ) {
        currentHint = null;
        board?.setHintCellTarget(null);
        refreshStatusText();
        syncToolbar();
      }
      const step = currentOnboardingStep();
      if (
        onboardingOpen
        && step !== null
        && isOnboardingStepSatisfied(step, (x, y) => puzzle.getCellState(x, y))
      ) {
        advanceOnboarding();
      }
    };

    board = new BoardView(
      this,
      puzzle,
      interaction,
      boardLayout.originX,
      boardLayout.originY,
      boardLayout.cellSize,
      handlePuzzleChanged,
      handleEditCommitted,
      handleCellEdited,
    );

    const toolbarActions: Record<PuzzleToolbarButtonId, () => void> = {
      wall: () => setActiveTool('wall'),
      floor: () => setActiveTool('floor'),
      undo: () => {
        if (controlsLocked()) return;
        if (board?.undo()) feedback.play('undo');
        syncToolbar();
      },
      reset: requestReset,
      hint: showHintConfirm,
    };

    const initialToolbarState = createPuzzleToolbarState(
      'wall',
      false,
      showTouchToolButtons,
      rankedDaily ? 0 : profileService?.getFreeHintsRemaining() ?? 0,
      rankedDaily ? false : rewardedHintAvailable,
      language,
    );
    for (const buttonState of initialToolbarState.buttons) {
      const buttonLayout = toolbarLayout.buttons.find((button) => button.id === buttonState.id);
      if (buttonLayout === undefined) continue;

      const background = this.add.graphics();
      const hitArea = this.add.zone(
        buttonLayout.x,
        buttonLayout.y,
        buttonLayout.width,
        buttonLayout.height,
      ).setInteractive({ useHandCursor: true });
      const label = this.add.text(buttonLayout.x, buttonLayout.y, buttonState.label, {
        fontFamily: 'monospace',
        fontSize: this.scale.width < 700 ? '15px' : '19px',
        color: '#f4ead7',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      const iconKey = toolbarIconKeys[buttonState.id];
      const icon = iconKey === undefined
        ? null
        : this.add.image(buttonLayout.x, buttonLayout.y, iconKey);
      if (icon !== null && buttonState.id !== 'wall' && buttonState.id !== 'floor') {
        icon.setTint(0xf4ead7);
      }
      const visual: ToolbarVisual = {
        id: buttonState.id,
        background,
        hitArea,
        icon,
        label,
        width: buttonLayout.width,
        height: buttonLayout.height,
        baseFill: buttonState.id === 'reset' ? 0xc96568 : 0x1f2c4a,
        disabled: buttonState.disabled,
        hovered: false,
        pressed: false,
      };
      hitArea
        .on('pointerover', () => {
          visual.hovered = true;
          redrawToolbarBackground(visual);
          if (!visual.disabled) feedback.play('ui-hover');
        })
        .on('pointerout', () => {
          visual.hovered = false;
          visual.pressed = false;
          redrawToolbarBackground(visual);
        })
        .on('pointerdown', () => {
          if (visual.disabled) return;
          visual.pressed = true;
          redrawToolbarBackground(visual);
        })
        .on('pointerup', () => {
          if (visual.disabled) return;
          visual.pressed = false;
          redrawToolbarBackground(visual);
          toolbarActions[buttonState.id]();
        });
      toolbarVisuals.set(buttonState.id, visual);
      layoutToolbarContent(
        visual,
        buttonLayout.x,
        buttonLayout.y,
        buttonLayout.width,
        buttonLayout.height,
      );
    }

    const handleBackAction = (): void => {
      feedback.play('ui-click');
      if (gameMenuOpen) {
        closeGameMenu();
        return;
      }
      if (hintConfirmOpen) {
        closeHintConfirm();
        return;
      }
      if (resetDialogOpen) return;
      board?.setInputEnabled(false);
      pauseActiveTimer();
      savePuzzleSession();

      const leave = async (): Promise<void> => {
        try {
          await flushProfileState();
        } catch (error) {
          console.warn('[Dungeon Logic] Could not flush profile state before leaving; keeping dirty in-memory state.', error);
        }
        if (this.scene.isActive()) {
          this.scene.start(
            launchData.context.mode === 'daily' || launchData.context.mode === 'tutorial'
              ? HOME_SCENE_KEY
              : LEVELS_SCENE_KEY,
          );
        }
      };
      void leave();
    };
    backHit.on('pointerup', handleBackAction);

    const handleMenuAction = (): void => {
      feedback.play('ui-click');
      openGameMenu();
    };
    menuHit.on('pointerup', handleMenuAction);

    const keyboard = this.input.keyboard;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.repeat || controlsLocked()) return;

      switch (event.code) {
        case 'Digit1':
        case 'Numpad1':
          setActiveTool('wall');
          break;
        case 'Digit2':
        case 'Numpad2':
          setActiveTool('floor');
          break;
        case 'KeyZ':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (board?.undo()) feedback.play('undo');
            syncToolbar();
          }
          break;
        case 'KeyR':
          requestReset();
          break;
        case 'KeyH':
          showHintConfirm();
          break;
      }
    };
    keyboard?.on('keydown', handleKeyDown);

    const handleResize = (): void => {
      if (!this.scene.isActive()) return;

      sceneBackground.sync();

      const width = this.scale.width;
      const height = this.scale.height;
      const nextChrome = calculatePuzzleChromeLayout(width, height);
      const nextSafeTop = readSafeArea('--safe-area-inset-top');
      const nextBoardLayout = calculateStableBoardLayout(getCurrentBoardBottomReserve(), nextChrome, nextSafeTop);
      recalculateToolbarLayout(nextBoardLayout);

      layoutTopActions(nextChrome, nextSafeTop);

      for (const buttonLayout of toolbarLayout.buttons) {
        const visual = toolbarVisuals.get(buttonLayout.id);
        if (visual === undefined) continue;
        visual.label.setFontSize(width < 700 ? 15 : 17);
        layoutToolbarContent(
          visual,
          buttonLayout.x,
          buttonLayout.y,
          buttonLayout.width,
          buttonLayout.height,
        );
      }

      positionStatusText();
      if (completionMode || completedReview) {
        statusText.setWordWrapWidth(Math.max(120, width - 24), true).setAlign('center');
      }

      boardLayout = nextBoardLayout;
      board?.relayout(
        boardLayout.originX,
        boardLayout.originY,
        boardLayout.cellSize,
      );
      relayoutResetDialog();
      relayoutOnboarding();
      if (hintConfirmOpen) renderHintConfirm();
      if (completionMode) renderCompletionButtons();
      if (gameMenuOpen) renderGameMenu();
      syncToolbar();
    };

    const handleVisibilityChange = (): void => {
      if (typeof document === 'undefined') return;

      if (document.hidden) {
        pauseActiveTimer();
        savePuzzleSession();
        void flushProfileState().catch((error) => {
          console.warn('[Dungeon Logic] Could not flush profile state on visibility loss; keeping dirty in-memory state.', error);
        });
        return;
      }

      resumeActiveTimer();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    const restoreBoardInputAfterPlatformResume = (): void => {
      if (solved || resetDialogOpen || hintConfirmOpen || gameMenuOpen || sceneOverlayPaused) {
        board?.setInputEnabled(false);
        return;
      }
      if (!onboardingOpen) {
        board?.setInputEnabled(true);
        return;
      }

      board?.setInputEnabled(currentOnboardingStep() !== null);
    };

    const unsubscribePlatformLifecycle = platformServices?.lifecycle.subscribe({
      onPause: () => {
        platformGameplayActivity?.pauseFromPlatform();
        board?.setInputEnabled(false);
        pauseActiveTimer(false);
        savePuzzleSession();
        void flushProfileState().catch((error) => {
          console.warn('[Dungeon Logic] Could not flush profile state on platform pause; keeping dirty in-memory state.', error);
        });
        syncToolbar();
      },
      onResume: () => {
        const canResume = internalTimerMayRun();
        platformGameplayActivity?.resumeFromPlatform(canResume);
        if (platformGameplayActivity?.isPlatformPaused() !== true) {
          restoreBoardInputAfterPlatformResume();
        }
        resumeActiveTimer(false);
        syncToolbar();
      },
    }) ?? (() => {});

    const handleSceneResume = (): void => {
      sceneOverlayPaused = false;
      const latestLanguage = this.getPlayerProfileService().getProfile().settings.language;
      if (latestLanguage !== language) {
        if (campaignContext !== null || tutorialContext !== null) {
          this.scene.restart(launchData);
          return;
        }
        language = latestLanguage;
        copy = getUiCopy(language);
        titleText.setText(getTitleLabel());
        backText.setText(getBackLabel());
        menuText.setText(copy.game.menu);
        layoutTopActions(calculatePuzzleChromeLayout(this.scale.width, this.scale.height), readSafeArea('--safe-area-inset-top'));
        refreshStatusText();
      }
      if (onboardingOpen) {
        applyOnboardingStep();
        return;
      }
      if (!solved && !resetDialogOpen) {
        board?.setInputEnabled(platformGameplayActivity?.isPlatformPaused() !== true);
      }
      resumeActiveTimer();
      syncToolbar();
    };
    this.events.on(Phaser.Scenes.Events.RESUME, handleSceneResume);

    const timerRefresh = this.time.addEvent({
      delay: 250,
      loop: true,
      callback: updateTimerText,
    });
    const hintUiRefresh = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (solved || completionMode || onboardingOpen || hintConfirmOpen || resetDialogOpen) return;
        syncToolbar();
        refreshStatusText();
      },
    });

    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      pauseActiveTimer();
      timerRefresh.destroy();
      hintUiRefresh.destroy();
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
      keyboard?.off('keydown', handleKeyDown);
      this.events.off(Phaser.Scenes.Events.RESUME, handleSceneResume);
      unsubscribePlatformLifecycle();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    });

    board.setSolvedVisualState(completedReview);

    if (completedReview) {
      board.setInputCellTarget(null);
      board.setInputEnabled(false);
      updateTimerText();
      refreshStatusText();
      syncToolbar();
    } else if (onboardingOpen) {
      applyOnboardingStep();
    } else {
      board.setInputCellTarget(null);
      board.setInputEnabled(platformGameplayActivity?.isPlatformPaused() !== true);
      resumeActiveTimer();
      syncToolbar();
    }

    void platformServices?.readiness.ready();
  }

  private async finishCampaignLevel(
    launchData: GameSceneData,
    createVersion: number,
    puzzleSession: PuzzleSessionService | null,
    resultMetadata: CampaignCompletionMetadata,
  ): Promise<CampaignCompletionResult | null> {
    const service = this.getCampaignService();
    const result = await completeGameLaunch(launchData, service, resultMetadata);

    if (createVersion !== this.createVersion || result === null) return null;

    if (puzzleSession !== null) {
      puzzleSession.clearActivePuzzle();
      try {
        await puzzleSession.flush();
      } catch (error) {
        console.warn('[Dungeon Logic] Campaign completion cleared the active puzzle in memory, but the clear could not be flushed yet.', error);
      }
    }

    if (createVersion !== this.createVersion) return null;
    return result;
  }

  private async finishTutorialLevel(
    launchData: GameSceneData,
    createVersion: number,
    puzzleSession: PuzzleSessionService | null,
  ): Promise<TutorialCompletionResult | null> {
    if (launchData.context.mode !== 'tutorial') return null;
    const service = this.getTutorialService();
    const result = await service.completeLevel(launchData.context.tutorialLevelId);
    if (createVersion !== this.createVersion) return null;

    if (puzzleSession !== null) {
      puzzleSession.clearActivePuzzle();
      try {
        await puzzleSession.flush();
      } catch (error) {
        console.warn('[Dungeon Logic] Tutorial completion cleared the active puzzle in memory, but the clear could not be flushed yet.', error);
      }
    }

    if (createVersion !== this.createVersion) return null;
    return result;
  }

  private async finishDailyLevel(
    launchData: GameSceneData,
    createVersion: number,
    metadata: CampaignCompletionMetadata,
  ): Promise<DailyCompletionResult | null> {
    const service = this.getDailyService();
    const result = await completeDailyGameLaunch(
      launchData,
      service,
      metadata.bestTimeMs,
      metadata.minHintsUsed,
    );
    if (createVersion !== this.createVersion) return null;
    return result;
  }

  private async startNextLevel(
    nextLevel: NonNullable<CampaignCompletionResult['recommendedNextLevel']>,
    service: CampaignService,
    createVersion: number,
  ): Promise<void> {
    const nextData = await createNextCampaignGameSceneData(nextLevel, service);
    if (createVersion !== this.createVersion) return;
    this.scene.restart(nextData);
  }

  private getPlayerProfileService(): PlayerProfileService {
    const service = this.registry.get(PLAYER_PROFILE_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof PlayerProfileService)) {
      throw new Error('Profile-backed GameScene requires PlayerProfileService in Phaser registry.');
    }
    return service;
  }

  private getTutorialService(): TutorialService {
    const service = this.registry.get(TUTORIAL_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof TutorialService)) {
      throw new Error('Tutorial GameScene requires TutorialService in Phaser registry.');
    }
    return service;
  }

  private getDailyService(): DailyService {
    const service = this.registry.get(DAILY_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof DailyService)) {
      throw new Error('Daily GameScene requires DailyService in Phaser registry.');
    }
    return service;
  }

  private getCampaignService(): CampaignService {
    const service = this.registry.get(CAMPAIGN_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof CampaignService)) {
      throw new Error('Campaign GameScene requires CampaignService in Phaser registry.');
    }
    return service;
  }
}
