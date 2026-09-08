import Phaser from 'phaser';

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
import { chooseHint, requestHint, type PuzzleHint } from '../gameplay/HintService';
import { MonetizationService } from '../monetization/MonetizationService';
import { PuzzleInteractionSession } from '../gameplay/PuzzleInteractionSession';
import { ActiveTimer, formatActiveTime } from '../gameplay/ActiveTimer';
import { PuzzleSessionService } from '../gameplay/PuzzleSessionService';
import { validatePuzzle } from '../puzzle/LevelValidator';
import { PLATFORM_SERVICES_REGISTRY_KEY } from '../platform/PlatformRegistry';
import type { PlatformServices } from '../platform/services';
import { PuzzleState } from '../puzzle/PuzzleState';
import {
  createOnboardingFlow,
  isOnboardingStepSatisfied,
  type OnboardingStep,
} from '../onboarding/OnboardingFlow';
import { HELP_SCENE_KEY } from '../help/HelpNavigation';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import {
  completeDailyGameLaunch,
  completeGameLaunch,
  createNextCampaignGameSceneData,
} from '../runtime/GameLaunch';
import { ARCHIVE_SCENE_KEY, HOME_SCENE_KEY } from '../runtime/MetaSelectors';
import { calculateGameBoardLayout } from './GameBoardLayout';
import { calculatePuzzleChromeLayout } from '../runtime/ResponsiveLayout';
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

    const titleText = this.add.text(
      this.scale.width / 2,
      chrome.titleY + safeTop,
      launchData.context.mode === 'daily' ? 'Dungeon Logic · Daily' : 'Dungeon Logic',
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

    const backText = this.add.text(chrome.actionInset, chrome.titleY + safeTop, '← Back', {
      fontFamily: 'monospace',
      fontSize: `${chrome.actionFontSize}px`,
      color: '#89929d',
      fontStyle: 'bold',
    })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });

    const helpText = this.add.text(
      this.scale.width - chrome.actionInset,
      chrome.titleY + safeTop,
      this.scale.width < 700 ? 'ⓘ' : 'ⓘ Правила',
      {
        fontFamily: 'monospace',
        fontSize: `${chrome.actionFontSize}px`,
        color: '#89929d',
        fontStyle: 'bold',
      },
    ).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    const profileService = launchData.context.mode === 'dev'
      ? null
      : this.getPlayerProfileService();
    const campaignContext = launchData.context.mode === 'campaign'
      ? launchData.context
      : null;
    const platformServices = profileService !== null
      ? this.registry.get(PLATFORM_SERVICES_REGISTRY_KEY) as PlatformServices | null | undefined
      : undefined;
    const monetizationService = profileService !== null && platformServices != null
      ? MonetizationService.create(profileService, platformServices.ads)
      : null;
    const rewardedHintAvailable = platformServices?.kind === 'yandex'
      && monetizationService !== null;
    const completedCampaignSlot = campaignContext === null
      ? null
      : this.getCampaignService().getLevels().find(
        (entry) => entry.id === campaignContext.campaignLevelId,
      )?.slot ?? null;
    const puzzleSession = launchData.context.mode !== 'campaign' || profileService === null
      ? null
      : PuzzleSessionService.createCampaign(
        launchData.level,
        profileService,
        profileService.getProfile().campaign.activePuzzle ?? undefined,
      );
    const puzzle = puzzleSession?.getPuzzle() ?? new PuzzleState(launchData.level);
    puzzleSession?.saveNow();
    const interaction = new PuzzleInteractionSession(puzzle);
    let boardLayout = calculateSafeBoardLayout();

    let board: BoardView | null = null;
    let solved = false;
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
    let completionTransitionPending = false;
    const completionButtons: Array<{
      rectangle: Phaser.GameObjects.Rectangle;
      label: Phaser.GameObjects.Text;
    }> = [];
    const activeTimer = new ActiveTimer(puzzleSession?.getActivePlayMs() ?? 0);
    let syncedActivePlayMs = puzzleSession?.getActivePlayMs() ?? 0;
    let transientHintsUsed = 0;

    const updateTimerText = (nowMs = readActiveClockMs()): void => {
      timerText.setText(formatActiveTime(activeTimer.getElapsedMs(nowMs)));
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

    const pauseActiveTimer = (): void => {
      const nowMs = readActiveClockMs();
      activeTimer.pause(nowMs);
      syncTimerIntoSession(nowMs);
    };

    const timerMayRun = (): boolean => {
      if (solved || onboardingBlocksTimer || resetDialogOpen || hintConfirmOpen) return false;
      return typeof document === 'undefined' || !document.hidden;
    };

    const resumeActiveTimer = (): void => {
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
      if (launchData.context.mode === 'daily' && profileService !== null) {
        await profileService.flush();
      }
    };

    const showTouchToolButtons = shouldShowTouchToolButtons(
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(any-pointer: coarse)').matches
        : false,
      typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0,
    );

    const toolbarVisuals = new Map<
      PuzzleToolbarButtonId,
      { rectangle: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }
    >();
    let toolbarLayout: PuzzleToolbarLayout = calculatePuzzleToolbarLayout(
      this.scale.width,
      this.scale.height,
      readSafeArea('--safe-area-inset-bottom'),
      showTouchToolButtons,
    );

    const statusText = this.add.text(
      this.scale.width / 2,
      Math.min(...toolbarLayout.buttons.map((button) => button.y - button.height / 2)) - 18,
      showTouchToolButtons ? '' : 'LMB: Wall   •   RMB: Floor',
      {
        fontFamily: 'monospace',
        fontSize: `${chrome.statusFontSize}px`,
        color: '#89929d',
        fontStyle: 'bold',
      },
    ).setOrigin(0.5);

    const onboardingSteps = launchData.context.mode === 'campaign'
      && launchData.contextualOnboarding
      ? createOnboardingFlow(launchData.context.campaignLevelId)
      : [];
    let onboardingIndex = onboardingSteps.length > 0 ? 0 : -1;
    onboardingOpen = onboardingIndex >= 0;

    const onboardingGuides = Array.from({ length: 12 }, () => (
      this.add.rectangle(0, 0, 1, 1, 0xd0b978, 0.18)
        .setVisible(false)
        .setDepth(40)
    ));
    const onboardingFocusGuides = Array.from({ length: 4 }, () => (
      this.add.rectangle(0, 0, 1, 1, 0xd54a42, 0.22)
        .setVisible(false)
        .setDepth(41)
    ));
    const onboardingPanel = this.add.rectangle(0, 0, 1, 1, 0x171b20, 0.96)
      .setVisible(false)
      .setDepth(50);
    const onboardingText = this.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#f0e6d2',
      align: 'center',
      wordWrap: { width: 420 },
    })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(51);
    const onboardingActionText = this.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#d0b978',
      fontStyle: 'bold',
    })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(51);
    let onboardingAutoAdvance: Phaser.Time.TimerEvent | null = null;

    const currentOnboardingStep = (): OnboardingStep | null => (
      onboardingIndex >= 0 ? onboardingSteps[onboardingIndex] ?? null : null
    );

    const hideOnboardingGuides = (): void => {
      for (const guide of onboardingGuides) guide.setVisible(false);
      for (const guide of onboardingFocusGuides) guide.setVisible(false);
    };

    const relayoutOnboarding = (): void => {
      const step = currentOnboardingStep();
      hideOnboardingGuides();
      if (!onboardingOpen || step === null) {
        onboardingPanel.setVisible(false);
        onboardingText.setVisible(false);
        onboardingActionText.setVisible(false);
        return;
      }

      const toolbarTop = Math.min(
        ...toolbarLayout.buttons.map((button) => button.y - button.height / 2),
      );
      const panelWidth = Math.min(this.scale.width - 24, this.scale.width < 700 ? 390 : 620);
      const panelX = this.scale.width / 2;

      let action = '';
      if (step.target === 'board-cells') {
        const wallStep = step.expectedState === 'wall';
        if (showTouchToolButtons) {
          action = wallStep
            ? 'ПОСТАВЬ ВСЕ ЗОЛОТЫЕ КЛЕТКИ КАК СТЕНЫ'
            : 'ВЫБЕРИ ПОЛ И ОТМЕТЬ ВСЕ ЗОЛОТЫЕ КЛЕТКИ';
        } else {
          action = wallStep
            ? 'ЛКМ: ПОСТАВЬ ВСЕ ЗОЛОТЫЕ КЛЕТКИ КАК СТЕНЫ'
            : 'ПКМ: ОТМЕТЬ ВСЕ ЗОЛОТЫЕ КЛЕТКИ КАК ПОЛ';
        }
      }

      onboardingText
        .setWordWrapWidth(Math.max(120, panelWidth - 28), true)
        .setFontSize(this.scale.width < 700 ? 13 : 14)
        .setText(step.message);
      onboardingActionText.setText(action);

      const actionReserve = action.length > 0 ? 28 : 0;
      const panelHeight = Math.max(
        this.scale.width < 700 ? 92 : 76,
        onboardingText.height + 24 + actionReserve,
      );
      const panelY = toolbarTop - panelHeight / 2 - 10;

      onboardingPanel
        .setPosition(panelX, panelY)
        .setDisplaySize(panelWidth, panelHeight)
        .setVisible(true);
      onboardingText
        .setPosition(panelX, panelY - actionReserve / 2)
        .setVisible(true);
      onboardingActionText
        .setPosition(panelX, panelY + panelHeight / 2 - 14)
        .setVisible(action.length > 0);

      if (step.target !== 'board-cells') return;

      const guideSize = Math.max(1, boardLayout.cellSize - 6);
      let guideIndex = 0;
      let focusGuideIndex = 0;
      const placeGuide = (x: number, y: number): void => {
        const guide = onboardingGuides[guideIndex++];
        if (guide === undefined) return;
        guide
          .setPosition(x, y)
          .setDisplaySize(guideSize, guideSize)
          .setVisible(true);
      };
      const placeFocusGuide = (x: number, y: number): void => {
        const guide = onboardingFocusGuides[focusGuideIndex++];
        if (guide === undefined) return;
        guide
          .setPosition(x, y)
          .setDisplaySize(guideSize, guideSize)
          .setVisible(true);
      };

      if (step.guideClue !== undefined) {
        if (step.guideClue.axis === 'row') {
          placeGuide(
            boardLayout.originX - boardLayout.cellSize / 2,
            boardLayout.originY + step.guideClue.index * boardLayout.cellSize + boardLayout.cellSize / 2,
          );
        } else {
          placeGuide(
            boardLayout.originX + step.guideClue.index * boardLayout.cellSize + boardLayout.cellSize / 2,
            boardLayout.originY - boardLayout.cellSize / 2,
          );
        }
      }

      for (const { x, y } of step.cells) {
        placeGuide(
          boardLayout.originX + x * boardLayout.cellSize + boardLayout.cellSize / 2,
          boardLayout.originY + y * boardLayout.cellSize + boardLayout.cellSize / 2,
        );
      }

      for (const { x, y } of step.focusCells ?? []) {
        placeFocusGuide(
          boardLayout.originX + x * boardLayout.cellSize + boardLayout.cellSize / 2,
          boardLayout.originY + y * boardLayout.cellSize + boardLayout.cellSize / 2,
        );
      }
    };

    const controlsLocked = (): boolean => (
      solved || onboardingBlocksInteraction || resetDialogOpen || hintConfirmOpen
    );

    const onboardingAllowsTool = (tool: 'wall' | 'floor'): boolean => {
      const step = currentOnboardingStep();
      if (!onboardingOpen || step === null) return true;
      if (step.target === 'message') return step.allowInput === true;
      return step.expectedState === tool;
    };

    const syncToolbar = (): void => {
      const state = createPuzzleToolbarState(
        interaction.getActiveTool(),
        interaction.canUndo(),
        showTouchToolButtons,
        profileService?.getFreeHintsRemaining() ?? 0,
        rewardedHintAvailable,
      );
      const step = currentOnboardingStep();

      for (const buttonState of state.buttons) {
        const visual = toolbarVisuals.get(buttonState.id);
        if (visual === undefined) continue;

        const isToolButton = buttonState.id === 'wall' || buttonState.id === 'floor';
        const toolAllowed = isToolButton
          ? onboardingAllowsTool(buttonState.id)
          : !onboardingBlocksInteraction;
        const disabled = solved
          || resetDialogOpen
          || !toolAllowed
          || buttonState.disabled
          || (buttonState.id === 'reset' && interaction.getEditCount() === 0);
        const guided = onboardingOpen
          && step?.target === 'board-cells'
          && buttonState.id === step.expectedState;
        const fill = disabled
          ? 0x191d22
          : guided
            ? 0x8a5155
            : buttonState.active
              ? 0x714245
              : 0x2a3038;
        const textColor = disabled
          ? '#5f666f'
          : guided
            ? '#fff0e8'
            : buttonState.active
              ? '#f5ded7'
              : '#d8d1c4';

        visual.rectangle.setFillStyle(fill, 1);
        visual.label.setText(buttonState.label).setColor(textColor);
      }
    };

    const setToolbarVisible = (visible: boolean): void => {
      for (const visual of toolbarVisuals.values()) {
        visual.rectangle.setVisible(visible);
        visual.label.setVisible(visible);
      }
    };

    const defaultStatusCopy = (): string => (
      showTouchToolButtons ? '' : 'LMB: Wall   •   RMB: Floor'
    );

    const refreshStatusText = (): void => {
      if (completionMode || hintConfirmOpen || onboardingOpen) return;
      if (currentHint !== null) {
        statusText
          .setText(currentHint.state === 'wall'
            ? 'ПОДСКАЗКА: золотая клетка должна быть СТЕНОЙ'
            : 'ПОДСКАЗКА: золотая клетка должна быть ПОЛОМ')
          .setColor('#d0b978')
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
        board?.setInputEnabled(true);
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
      board?.setHintCellTarget(hint);
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
          .setText('ЗАГРУЗКА РЕКЛАМЫ…')
          .setColor('#d0b978')
          .setVisible(true);
      }

      await requestHint({
        puzzle,
        consumeFreeHint: () => profileService.consumeFreeHint(),
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
      const width = Math.min(360, this.scale.width - 24);
      const gap = 10;
      const buttonWidth = Math.floor((width - gap) / 2);
      const buttonHeight = 46;
      const y = this.scale.height - safeBottom - 12 - buttonHeight / 2;
      const container = this.add.container(this.scale.width / 2, y).setDepth(70);
      hintConfirmContainer = container;

      const cancelX = -buttonWidth / 2 - gap / 2;
      const showX = buttonWidth / 2 + gap / 2;
      const cancel = this.add.rectangle(cancelX, 0, buttonWidth, buttonHeight, 0x2a3038, 1)
        .setInteractive({ useHandCursor: true });
      const confirm = this.add.rectangle(showX, 0, buttonWidth, buttonHeight, 0x714245, 1)
        .setInteractive({ useHandCursor: true });
      const cancelLabel = this.add.text(cancelX, 0, 'ОТМЕНА', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#d8d1c4',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      const confirmLabel = this.add.text(
        showX,
        0,
        hintConfirmMode === 'rewarded' ? 'РЕКЛАМА' : 'ПОКАЗАТЬ',
        {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f5ded7',
        fontStyle: 'bold',
        },
      ).setOrigin(0.5);

      cancel.on('pointerup', closeHintConfirm);
      confirm.on('pointerup', () => {
        void deliverConfirmedHint();
      });
      container.add([cancel, confirm, cancelLabel, confirmLabel]);
    };

    const showHintConfirm = (): void => {
      if (controlsLocked() || profileService === null || chooseHint(puzzle) === null) return;
      const remaining = profileService.getFreeHintsRemaining();
      const mode: 'free' | 'rewarded' = remaining > 0 ? 'free' : 'rewarded';
      if (mode === 'rewarded' && !rewardedHintAvailable) return;

      hintConfirmOpen = true;
      hintConfirmMode = mode;
      board?.setInputEnabled(false);
      pauseActiveTimer();
      setToolbarVisible(false);
      statusText
        .setText(mode === 'rewarded'
          ? '1 РЕКЛАМА = 1 ПОДСКАЗКА. ПОКАЗАТЬ РЕКЛАМУ?'
          : `Показать одну клетку? Бесплатных подсказок: ${remaining}`)
        .setColor('#d0b978')
        .setVisible(true);
      renderHintConfirm();
      syncToolbar();
    };

    const clearCompletionButtons = (): void => {
      for (const visual of completionButtons.splice(0)) {
        visual.rectangle.destroy();
        visual.label.destroy();
      }
    };

    let completionActions: Array<{ readonly label: string; readonly action: () => void }> = [];

    const renderCompletionButtons = (): void => {
      clearCompletionButtons();
      if (!completionMode || completionActions.length === 0) return;

      const safeBottom = readSafeArea('--safe-area-inset-bottom');
      const gap = 10;
      const maxWidth = Math.min(this.scale.width - 24, 350);
      const buttonHeight = 48;
      const buttonWidth = completionActions.length === 1
        ? Math.min(190, maxWidth)
        : Math.floor((maxWidth - gap) / 2);
      const totalWidth = buttonWidth * completionActions.length + gap * (completionActions.length - 1);
      const startX = (this.scale.width - totalWidth) / 2;
      const y = this.scale.height - safeBottom - 12 - buttonHeight / 2;

      completionActions.forEach((definition, index) => {
        const x = startX + index * (buttonWidth + gap) + buttonWidth / 2;
        const rectangle = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0x2a3038, 1)
          .setInteractive({ useHandCursor: true })
          .setDepth(60);
        const label = this.add.text(x, y, definition.label, {
          fontFamily: 'monospace',
          fontSize: this.scale.width < 700 ? '14px' : '16px',
          color: '#f0d28a',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(61);
        rectangle.on('pointerup', definition.action);
        completionButtons.push({ rectangle, label });
      });
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
        boardLayout = calculateSafeBoardLayout(40);
        board?.relayout(boardLayout.originX, boardLayout.originY, boardLayout.cellSize);
      }
      setToolbarVisible(false);
      const hintCopy = metadata.minHintsUsed === 0
        ? 'БЕЗ ПОДСКАЗОК'
        : `ПОДСКАЗОК: ${metadata.minHintsUsed}`;
      const recordCopy = newBestTime ? '  ·  НОВЫЙ РЕКОРД' : '';
      const unlockCopy = result.unlockedManuscript === null
        ? ''
        : `
ОТКРЫТА РУКОПИСЬ ${result.unlockedManuscript.roman} · ${result.unlockedManuscript.title.toUpperCase()}`;
      statusText
        .setWordWrapWidth(Math.max(120, this.scale.width - 24), true)
        .setAlign('center')
        .setText(`✓ РЕШЕНО  ·  ${formatActiveTime(metadata.bestTimeMs)}  ·  ${hintCopy}${recordCopy}${unlockCopy}`)
        .setColor('#d8d1c4')
        .setVisible(true);

      completionActions = [
        {
          label: 'АРХИВ',
          action: () => this.scene.start(ARCHIVE_SCENE_KEY),
        },
      ];
      if (result.recommendedNextLevel !== null) {
        const service = this.getCampaignService();
        completionActions.push({
          label: 'ДАЛЬШЕ',
          action: () => {
            if (completionTransitionPending) return;
            completionTransitionPending = true;
            pauseActiveTimer();

            const continueCampaign = async (): Promise<void> => {
              if (monetizationService !== null && completedCampaignSlot !== null) {
                await monetizationService.maybeShowCampaignInterstitial(completedCampaignSlot);
              }
              if (createVersion !== this.createVersion) return;
              await this.startNextLevel(result.recommendedNextLevel!, service, createVersion);
            };

            void continueCampaign().finally(() => {
              if (createVersion === this.createVersion) {
                completionTransitionPending = false;
              }
            });
          },
        });
      }
      renderCompletionButtons();
    };

    const showDailyCompletionState = (
      result: DailyCompletionResult,
      metadata: CampaignCompletionMetadata,
      newBestTime: boolean,
    ): void => {
      completionMode = true;
      currentHint = null;
      board?.setHintCellTarget(null);
      if (this.scale.height < 520) {
        boardLayout = calculateSafeBoardLayout(40);
        board?.relayout(boardLayout.originX, boardLayout.originY, boardLayout.cellSize);
      }
      setToolbarVisible(false);

      const hintCopy = metadata.minHintsUsed === 0
        ? 'БЕЗ ПОДСКАЗОК'
        : `ПОДСКАЗОК: ${metadata.minHintsUsed}`;
      const recordCopy = newBestTime ? '  ·  НОВЫЙ РЕКОРД' : '';
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
          `✓ DAILY РЕШЁН  ·  ${formatActiveTime(metadata.bestTimeMs)}  ·  ${hintCopy}${recordCopy}`
          + `\nСЕРИЯ: ${result.currentStreak}  ·  7 ДНЕЙ: ${recentCopy}`,
        )
        .setColor('#d8d1c4')
        .setVisible(true);

      completionActions = [
        {
          label: 'ГЛАВНАЯ',
          action: () => this.scene.start(HOME_SCENE_KEY),
        },
      ];
      renderCompletionButtons();
    };

    const cancelOnboardingAutoAdvance = (): void => {
      onboardingAutoAdvance?.destroy();
      onboardingAutoAdvance = null;
    };

    const finishOnboarding = (): void => {
      cancelOnboardingAutoAdvance();
      onboardingIndex = -1;
      onboardingOpen = false;
      onboardingBlocksInteraction = false;
      onboardingBlocksTimer = false;
      board?.setInputCellTargets(null);
      if (!solved && !resetDialogOpen) {
        board?.setInputEnabled(true);
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
      cancelOnboardingAutoAdvance();

      while (true) {
        const step = currentOnboardingStep();
        if (step === null) {
          finishOnboarding();
          return;
        }
        if (
          step.target === 'board-cells'
          && isOnboardingStepSatisfied(step, (x, y) => puzzle.getCellState(x, y))
        ) {
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

      if (step.target === 'board-cells') {
        onboardingBlocksInteraction = true;
        onboardingBlocksTimer = true;
        pauseActiveTimer();
        board?.setInputCellTargets(step.cells);
        board?.setInputEnabled(true);
      } else {
        const blocksInput = step.allowInput !== true;
        onboardingBlocksInteraction = blocksInput;
        onboardingBlocksTimer = blocksInput;
        if (blocksInput) {
          pauseActiveTimer();
          board?.setInputEnabled(false);
        } else {
          board?.setInputEnabled(true);
          resumeActiveTimer();
        }
        onboardingAutoAdvance = this.time.delayedCall(step.autoAdvanceMs, () => {
          onboardingAutoAdvance = null;
          advanceOnboarding();
        });
      }

      relayoutOnboarding();
      syncToolbar();
    };

    const setActiveTool = (tool: 'wall' | 'floor'): void => {
      if (solved || resetDialogOpen) return;
      if (onboardingOpen && !onboardingAllowsTool(tool)) return;

      board?.setActiveTool(tool);
      syncToolbar();
    };

    const closeResetDialog = (): void => {
      resetDialog?.destroy(true);
      resetDialog = null;
      resetDialogOpen = false;
      if (!solved && !onboardingOpen) {
        board?.setInputEnabled(true);
      }
      resumeActiveTimer();
      syncToolbar();
    };

    const relayoutResetDialog = (): void => {
      if (resetDialog === null) return;
      resetDialog.setPosition(this.scale.width / 2, this.scale.height / 2);
    };

    const showResetDialog = (): void => {
      if (resetDialogOpen || solved) return;
      resetDialogOpen = true;
      board?.setInputEnabled(false);
      pauseActiveTimer();
      syncToolbar();

      const modalChrome = calculatePuzzleChromeLayout(this.scale.width, this.scale.height);
      const width = Math.min(380, modalChrome.modalWidth);
      const height = 180;
      const container = this.add.container(this.scale.width / 2, this.scale.height / 2);
      resetDialog = container;

      const panel = this.add.rectangle(0, 0, width, height, 0x15191f, 0.98)
        .setStrokeStyle(2, 0x6b7077);
      const title = this.add.text(0, -52, 'Reset puzzle?', {
        fontFamily: 'monospace',
        fontSize: `${modalChrome.modalTitleFontSize}px`,
        color: '#f0e6d2',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      const copy = this.add.text(0, -14, 'All marks on this board will be cleared.', {
        fontFamily: 'monospace',
        fontSize: `${modalChrome.modalCopyFontSize}px`,
        color: '#aeb4bc',
        align: 'center',
        wordWrap: { width: width - 36 },
      }).setOrigin(0.5);

      const buttonWidth = Math.floor((width - 54) / 2);
      const cancelX = -buttonWidth / 2 - 6;
      const resetX = buttonWidth / 2 + 6;
      const buttonY = 48;
      const cancel = this.add.rectangle(cancelX, buttonY, buttonWidth, 46, 0x2a3038, 1)
        .setInteractive({ useHandCursor: true });
      const confirm = this.add.rectangle(resetX, buttonY, buttonWidth, 46, 0x63383b, 1)
        .setInteractive({ useHandCursor: true });
      const cancelLabel = this.add.text(cancelX, buttonY, 'CANCEL', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#d8d1c4',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      const confirmLabel = this.add.text(resetX, buttonY, 'RESET', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#f0d8d2',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      cancel.on('pointerdown', () => {
        closeResetDialog();
      });
      confirm.on('pointerdown', () => {
        board?.reset();
        closeResetDialog();
      });

      container.add([panel, title, copy, cancel, confirm, cancelLabel, confirmLabel]);
    };

    const requestReset = (): void => {
      if (controlsLocked() || interaction.getEditCount() === 0) return;
      if (shouldConfirmReset(interaction.getEditCount())) {
        showResetDialog();
        return;
      }
      board?.reset();
      syncToolbar();
    };

    const handlePuzzleChanged = (): void => {
      syncToolbar();
      if (solved) return;
      if (!validatePuzzle(puzzle).isSolved) return;

      solved = true;
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
          .setText(`✓ РЕШЕНО  ·  ${formatActiveTime(metadata.bestTimeMs)}`)
          .setColor('#d8d1c4')
          .setVisible(true);
        return;
      }

      if (launchData.context.mode === 'daily') {
        const previousResult = profileService?.getProfile().daily.results[launchData.context.dateKey];
        const newBestTime = previousResult === undefined
          || metadata.bestTimeMs < previousResult.bestTimeMs;
        statusText.setText('').setVisible(false);

        void this.finishDailyLevel(
          launchData,
          createVersion,
          metadata,
        ).then((result) => {
          if (result === null || createVersion !== this.createVersion) return;
          this.time.delayedCall(500, () => {
            if (createVersion !== this.createVersion) return;
            showDailyCompletionState(result, metadata, newBestTime);
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

    const handleEditCommitted = (): void => {
      savePuzzleSession();
      if (
        currentHint !== null
        && puzzle.getCellState(currentHint.x, currentHint.y) === currentHint.state
      ) {
        currentHint = null;
        board?.setHintCellTarget(null);
        refreshStatusText();
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
    );

    const toolbarActions: Record<PuzzleToolbarButtonId, () => void> = {
      wall: () => setActiveTool('wall'),
      floor: () => setActiveTool('floor'),
      undo: () => {
        if (controlsLocked()) return;
        board?.undo();
        syncToolbar();
      },
      reset: requestReset,
      hint: showHintConfirm,
    };

    const initialToolbarState = createPuzzleToolbarState(
      'wall',
      false,
      showTouchToolButtons,
      profileService?.getFreeHintsRemaining() ?? 0,
      rewardedHintAvailable,
    );
    for (const buttonState of initialToolbarState.buttons) {
      const buttonLayout = toolbarLayout.buttons.find((button) => button.id === buttonState.id);
      if (buttonLayout === undefined) continue;

      const rectangle = this.add.rectangle(
        buttonLayout.x,
        buttonLayout.y,
        buttonLayout.width,
        buttonLayout.height,
        0x2a3038,
        1,
      )
        .setInteractive({ useHandCursor: true })
        .on('pointerup', toolbarActions[buttonState.id]);
      const label = this.add.text(buttonLayout.x, buttonLayout.y, buttonState.label, {
        fontFamily: 'monospace',
        fontSize: this.scale.width < 700 ? '15px' : '16px',
        color: '#d8d1c4',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      toolbarVisuals.set(buttonState.id, { rectangle, label });
    }

    backText.on('pointerdown', () => {
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
            launchData.context.mode === 'daily' ? HOME_SCENE_KEY : ARCHIVE_SCENE_KEY,
          );
        }
      };
      void leave();
    });

    helpText.on('pointerup', () => {
      if (resetDialogOpen || hintConfirmOpen || solved) return;
      board?.setInputEnabled(false);
      pauseActiveTimer();
      savePuzzleSession();
      this.scene.launch(HELP_SCENE_KEY, { returnSceneKey: 'GameScene' });
      this.scene.pause();
    });

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
            board?.undo();
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

      const width = this.scale.width;
      const height = this.scale.height;
      const nextChrome = calculatePuzzleChromeLayout(width, height);
      const nextSafeTop = readSafeArea('--safe-area-inset-top');
      const nextBoardLayout = calculateSafeBoardLayout(completionMode && height < 520 ? 40 : 0);
      toolbarLayout = calculatePuzzleToolbarLayout(
        width,
        height,
        readSafeArea('--safe-area-inset-bottom'),
        showTouchToolButtons,
      );

      titleText
        .setPosition(width / 2, nextChrome.titleY + nextSafeTop)
        .setFontSize(nextChrome.titleFontSize);
      timerText
        .setPosition(width / 2, nextChrome.titleY + nextSafeTop + (width < 700 ? 28 : 34))
        .setFontSize(Math.max(12, nextChrome.statusFontSize));
      backText
        .setPosition(nextChrome.actionInset, nextChrome.titleY + nextSafeTop)
        .setFontSize(nextChrome.actionFontSize);

      helpText
        .setPosition(width - nextChrome.actionInset, nextChrome.titleY + nextSafeTop)
        .setFontSize(nextChrome.actionFontSize)
        .setText(width < 700 ? 'ⓘ' : 'ⓘ Правила');

      for (const buttonLayout of toolbarLayout.buttons) {
        const visual = toolbarVisuals.get(buttonLayout.id);
        if (visual === undefined) continue;
        visual.rectangle
          .setPosition(buttonLayout.x, buttonLayout.y)
          .setDisplaySize(buttonLayout.width, buttonLayout.height);
        visual.label
          .setPosition(buttonLayout.x, buttonLayout.y)
          .setFontSize(width < 700 ? 15 : 16);
      }

      const toolbarTop = Math.min(
        ...toolbarLayout.buttons.map((button) => button.y - button.height / 2),
      );
      statusText
        .setPosition(width / 2, toolbarTop - 18)
        .setFontSize(nextChrome.statusFontSize);
      if (completionMode) {
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

    const handleSceneResume = (): void => {
      if (onboardingOpen) {
        applyOnboardingStep();
        return;
      }
      if (!solved && !resetDialogOpen) {
        board?.setInputEnabled(true);
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

    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      pauseActiveTimer();
      cancelOnboardingAutoAdvance();
      timerRefresh.destroy();
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
      keyboard?.off('keydown', handleKeyDown);
      this.events.off(Phaser.Scenes.Events.RESUME, handleSceneResume);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    });

    if (onboardingOpen) {
      applyOnboardingStep();
    } else {
      board.setInputCellTarget(null);
      board.setInputEnabled(true);
      resumeActiveTimer();
      syncToolbar();
    }
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

    if (result.persisted && puzzleSession !== null) {
      puzzleSession.clearActivePuzzle();
      try {
        await puzzleSession.flush();
      } catch (error) {
        console.warn('[Dungeon Logic] Campaign result persisted, but clearing active puzzle could not be flushed yet.', error);
      }
    }

    if (createVersion !== this.createVersion) return null;
    return result;
  }

  private async finishDailyLevel(
    launchData: GameSceneData,
    createVersion: number,
    resultMetadata: CampaignCompletionMetadata,
  ): Promise<DailyCompletionResult | null> {
    const service = this.getDailyService();
    const result = await completeDailyGameLaunch(launchData, service, resultMetadata);
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
