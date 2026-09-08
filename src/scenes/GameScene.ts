import Phaser from 'phaser';

import { BoardView } from '../board/BoardView';
import { CAMPAIGN_SERVICE_REGISTRY_KEY, CampaignService } from '../campaign/CampaignService';
import type { CampaignCompletionResult, GameSceneData } from '../campaign/types';
import { PuzzleInteractionSession } from '../gameplay/PuzzleInteractionSession';
import { ActiveTimer, formatActiveTime } from '../gameplay/ActiveTimer';
import { PuzzleSessionService } from '../gameplay/PuzzleSessionService';
import { validatePuzzle } from '../puzzle/LevelValidator';
import { PuzzleState } from '../puzzle/PuzzleState';
import { createOnboardingFlow, type OnboardingStep } from '../onboarding/OnboardingFlow';
import { HELP_SCENE_KEY } from '../help/HelpNavigation';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import {
  completeGameLaunch,
  createNextCampaignGameSceneData,
  getCampaignCompletionActions,
} from '../runtime/GameLaunch';
import { ARCHIVE_SCENE_KEY } from '../runtime/MetaSelectors';
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
      throw new Error('GameScene requires resolved GameSceneData from campaign or dev routing.');
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

    const calculateSafeBoardLayout = () => {
      const safeTop = readSafeArea('--safe-area-inset-top');
      const safeBottom = readSafeArea('--safe-area-inset-bottom');
      const safeHeight = Math.max(1, this.scale.height - safeTop - safeBottom);
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

    const titleText = this.add.text(this.scale.width / 2, chrome.titleY + safeTop, 'Dungeon Logic', {
      fontFamily: 'monospace',
      fontSize: `${chrome.titleFontSize}px`,
      color: '#f0e6d2',
      fontStyle: 'bold',
    }).setOrigin(0.5);

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

    const profileService = launchData.context.mode === 'campaign'
      ? this.getPlayerProfileService()
      : null;
    const puzzleSession = profileService === null
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
    let resetDialogOpen = false;
    let resetDialog: Phaser.GameObjects.Container | null = null;
    const activeTimer = new ActiveTimer(puzzleSession?.getActivePlayMs() ?? 0);
    let syncedActivePlayMs = puzzleSession?.getActivePlayMs() ?? 0;

    const updateTimerText = (nowMs = readActiveClockMs()): void => {
      timerText.setText(formatActiveTime(activeTimer.getElapsedMs(nowMs)));
    };

    const syncTimerIntoSession = (nowMs = readActiveClockMs()): void => {
      const elapsedMs = activeTimer.getElapsedMs(nowMs);
      if (puzzleSession !== null && elapsedMs > syncedActivePlayMs) {
        puzzleSession.addActiveTime(elapsedMs - syncedActivePlayMs);
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
      if (solved || onboardingOpen || resetDialogOpen) return false;
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

    const onboardingGuide = this.add.rectangle(0, 0, 1, 1, 0xd0b978, 0.18)
      .setVisible(false)
      .setDepth(40);
    const onboardingPanel = this.add.rectangle(0, 0, 1, 1, 0x171b20, 0.96)
      .setVisible(false)
      .setDepth(50)
      .setInteractive({ useHandCursor: true });
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

    const currentOnboardingStep = (): OnboardingStep | null => (
      onboardingIndex >= 0 ? onboardingSteps[onboardingIndex] ?? null : null
    );

    const stepCanContinueFromCallout = (step: OnboardingStep | null): boolean => {
      if (step === null) return false;
      if (step.target === 'clue' || step.target === 'message') return true;
      if (step.target === 'board-cell') return step.expectedState === undefined;
      if (step.target === 'tool-wall' || step.target === 'tool-floor') {
        return !showTouchToolButtons;
      }
      return false;
    };

    const relayoutOnboarding = (): void => {
      const step = currentOnboardingStep();
      if (!onboardingOpen || step === null) {
        onboardingGuide.setVisible(false);
        onboardingPanel.setVisible(false);
        onboardingText.setVisible(false);
        onboardingActionText.setVisible(false);
        return;
      }

      const toolbarTop = Math.min(
        ...toolbarLayout.buttons.map((button) => button.y - button.height / 2),
      );
      const panelWidth = Math.min(this.scale.width - 24, this.scale.width < 700 ? 360 : 520);
      const panelHeight = this.scale.width < 700 ? 78 : 68;
      const panelX = this.scale.width / 2;
      const panelY = toolbarTop - panelHeight / 2 - 10;

      onboardingPanel
        .setPosition(panelX, panelY)
        .setDisplaySize(panelWidth, panelHeight)
        .setVisible(true);
      onboardingText
        .setPosition(panelX, panelY - 8)
        .setWordWrapWidth(Math.max(120, panelWidth - 26), true)
        .setFontSize(this.scale.width < 700 ? 13 : 14)
        .setText(step.message)
        .setVisible(true);

      const canContinue = stepCanContinueFromCallout(step);
      let action = '';
      if (canContinue) {
        action = this.scale.width < 700 ? 'НАЖМИ, ЧТОБЫ ПРОДОЛЖИТЬ' : 'КЛИКНИ, ЧТОБЫ ПРОДОЛЖИТЬ';
      } else if (step.target === 'tool-wall') {
        action = 'НАЖМИ СТЕНА';
      } else if (step.target === 'tool-floor') {
        action = 'НАЖМИ ПОЛ';
      } else if (step.target === 'board-cell') {
        action = 'СДЕЛАЙ ХОД В ПОДСВЕЧЕННОЙ КЛЕТКЕ';
      }
      onboardingActionText
        .setPosition(panelX, panelY + panelHeight / 2 - 13)
        .setText(action)
        .setVisible(action.length > 0);

      let guideX = 0;
      let guideY = 0;
      let guideSize = Math.max(1, boardLayout.cellSize - 6);
      let showGuide = false;

      if (step.target === 'clue') {
        if (step.axis === 'row') {
          guideX = boardLayout.originX - boardLayout.cellSize / 2;
          guideY = boardLayout.originY + step.index * boardLayout.cellSize + boardLayout.cellSize / 2;
        } else {
          guideX = boardLayout.originX + step.index * boardLayout.cellSize + boardLayout.cellSize / 2;
          guideY = boardLayout.originY - boardLayout.cellSize / 2;
        }
        showGuide = true;
      } else if (step.target === 'board-cell') {
        guideX = boardLayout.originX + step.x * boardLayout.cellSize + boardLayout.cellSize / 2;
        guideY = boardLayout.originY + step.y * boardLayout.cellSize + boardLayout.cellSize / 2;
        showGuide = true;
      }

      onboardingGuide
        .setPosition(guideX, guideY)
        .setDisplaySize(guideSize, guideSize)
        .setVisible(showGuide);
    };

    const controlsLocked = (): boolean => solved || onboardingOpen || resetDialogOpen;

    const onboardingAllowsTool = (tool: 'wall' | 'floor'): boolean => {
      const step = currentOnboardingStep();
      if (!onboardingOpen || step === null) return true;
      if (step.target === 'board-cell' && step.expectedState !== undefined) return true;
      return step.target === `tool-${tool}`;
    };

    const syncToolbar = (): void => {
      const state = createPuzzleToolbarState(
        interaction.getActiveTool(),
        interaction.canUndo(),
        showTouchToolButtons,
      );
      const step = currentOnboardingStep();

      for (const buttonState of state.buttons) {
        const visual = toolbarVisuals.get(buttonState.id);
        if (visual === undefined) continue;

        const isToolButton = buttonState.id === 'wall' || buttonState.id === 'floor';
        const toolAllowed = isToolButton
          ? onboardingAllowsTool(buttonState.id)
          : !onboardingOpen;
        const disabled = solved
          || resetDialogOpen
          || !toolAllowed
          || buttonState.disabled
          || (buttonState.id === 'reset' && interaction.getEditCount() === 0);
        const guided = onboardingOpen && (
          (step?.target === 'tool-wall' && buttonState.id === 'wall')
          || (step?.target === 'tool-floor' && buttonState.id === 'floor')
          || (step?.target === 'board-cell' && step.expectedState === 'wall' && buttonState.id === 'wall')
          || (step?.target === 'board-cell' && step.expectedState === 'floor' && buttonState.id === 'floor')
        );
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
        visual.label.setColor(textColor);
      }
    };

    const finishOnboarding = (): void => {
      onboardingIndex = -1;
      onboardingOpen = false;
      board?.setInputCellTarget(null);
      if (!solved && !resetDialogOpen) {
        board?.setInputEnabled(true);
      }
      statusText.setVisible(true);
      relayoutOnboarding();
      resumeActiveTimer();
      syncToolbar();
    };

    const applyOnboardingStep = (): void => {
      const step = currentOnboardingStep();
      if (step === null) {
        finishOnboarding();
        return;
      }

      pauseActiveTimer();
      statusText.setVisible(false);
      board?.setInputCellTarget(null);

      if (step.target === 'board-cell' && step.expectedState !== undefined) {
        board?.setInputCellTarget({ x: step.x, y: step.y });
        board?.setInputEnabled(true);
      } else {
        board?.setInputEnabled(false);
      }

      relayoutOnboarding();
      syncToolbar();
    };

    const advanceOnboarding = (): void => {
      if (!onboardingOpen) return;
      onboardingIndex += 1;
      if (onboardingIndex >= onboardingSteps.length) {
        finishOnboarding();
        return;
      }
      applyOnboardingStep();
    };

    onboardingPanel.on('pointerup', () => {
      if (stepCanContinueFromCallout(currentOnboardingStep())) {
        advanceOnboarding();
      }
    });

    const setActiveTool = (tool: 'wall' | 'floor'): void => {
      if (solved || resetDialogOpen) return;
      if (onboardingOpen && !onboardingAllowsTool(tool)) return;

      board?.setActiveTool(tool);
      const step = currentOnboardingStep();
      if (
        onboardingOpen
        && ((step?.target === 'tool-wall' && tool === 'wall')
          || (step?.target === 'tool-floor' && tool === 'floor'))
      ) {
        advanceOnboarding();
        return;
      }
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

      if (launchData.context.mode === 'dev') {
        statusText.setText('Dungeon complete!').setColor('#d8d1c4');
        return;
      }

      statusText.setText('Level complete!').setColor('#d8d1c4');
      void this.finishCampaignLevel(launchData, createVersion, puzzleSession);
    };

    const handleEditCommitted = (): void => {
      savePuzzleSession();
      const step = currentOnboardingStep();
      if (
        onboardingOpen
        && step?.target === 'board-cell'
        && step.expectedState !== undefined
        && puzzle.getCellState(step.x, step.y) === step.expectedState
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
    };

    const initialToolbarState = createPuzzleToolbarState('wall', false, showTouchToolButtons);
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
        .on('pointerdown', toolbarActions[buttonState.id]);
      const label = this.add.text(buttonLayout.x, buttonLayout.y, buttonState.label, {
        fontFamily: 'monospace',
        fontSize: this.scale.width < 700 ? '15px' : '16px',
        color: '#d8d1c4',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      toolbarVisuals.set(buttonState.id, { rectangle, label });
    }

    backText.on('pointerdown', () => {
      if (resetDialogOpen) return;
      board?.setInputEnabled(false);
      pauseActiveTimer();
      savePuzzleSession();

      const leave = async (): Promise<void> => {
        try {
          await puzzleSession?.flush();
        } catch (error) {
          console.warn('[Dungeon Logic] Could not flush active puzzle before leaving; keeping dirty in-memory state.', error);
        }
        if (this.scene.isActive()) {
          this.scene.start(ARCHIVE_SCENE_KEY);
        }
      };
      void leave();
    });

    helpText.on('pointerup', () => {
      if (resetDialogOpen) return;
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
      }
    };
    keyboard?.on('keydown', handleKeyDown);

    const handleResize = (): void => {
      if (!this.scene.isActive()) return;

      const width = this.scale.width;
      const height = this.scale.height;
      const nextChrome = calculatePuzzleChromeLayout(width, height);
      const nextSafeTop = readSafeArea('--safe-area-inset-top');
      const nextBoardLayout = calculateSafeBoardLayout();
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

      boardLayout = nextBoardLayout;
      board?.relayout(
        boardLayout.originX,
        boardLayout.originY,
        boardLayout.cellSize,
      );
      relayoutResetDialog();
      relayoutOnboarding();
      syncToolbar();
    };

    const handleVisibilityChange = (): void => {
      if (typeof document === 'undefined') return;

      if (document.hidden) {
        pauseActiveTimer();
        savePuzzleSession();
        if (puzzleSession !== null) {
          void puzzleSession.flush().catch((error) => {
            console.warn('[Dungeon Logic] Could not flush active puzzle on visibility loss; keeping dirty in-memory state.', error);
          });
        }
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
  ): Promise<void> {
    const service = this.getCampaignService();
    const result = await completeGameLaunch(launchData, service);

    if (createVersion !== this.createVersion || result === null) return;

    if (result.persisted && puzzleSession !== null) {
      puzzleSession.clearActivePuzzle();
      try {
        await puzzleSession.flush();
      } catch (error) {
        console.warn('[Dungeon Logic] Campaign result persisted, but clearing active puzzle could not be flushed yet.', error);
      }
    }

    if (createVersion !== this.createVersion) return;
    this.createCompletionOverlay(result, service, createVersion);
  }

  private createCompletionOverlay(
    result: CampaignCompletionResult,
    service: CampaignService,
    createVersion: number,
  ): void {
    const actions = getCampaignCompletionActions(result);
    const x = this.scale.width / 2;
    const y = this.scale.height / 2;
    const chrome = calculatePuzzleChromeLayout(this.scale.width, this.scale.height);
    const panelHeight = actions.includes('next') ? 250 : 205;
    const panelWidth = Math.min(460, chrome.modalWidth);

    this.add.rectangle(x, y, panelWidth, panelHeight, 0x15191f, 0.97)
      .setStrokeStyle(3, 0xd0b978);

    this.add.text(x, y - panelHeight / 2 + 45, 'Level complete', {
      fontFamily: 'monospace',
      fontSize: `${Math.min(28, chrome.modalTitleFontSize + 4)}px`,
      color: '#f0e6d2',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    let buttonY = y - 5;
    if (actions.includes('next') && result.recommendedNextLevel !== null) {
      this.createOverlayButton(x, buttonY, 'Next level', () => {
        void this.startNextLevel(result.recommendedNextLevel!, service, createVersion);
      });
      buttonY += 58;
    }

    this.createOverlayButton(x, buttonY, 'Archive', () => {
      this.scene.start(ARCHIVE_SCENE_KEY);
    });

    if (!result.persisted) {
      this.add.text(x, y + panelHeight / 2 - 26, 'Progress is kept for this session.', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#89929d',
      }).setOrigin(0.5);
    }
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

  private createOverlayButton(
    x: number,
    y: number,
    label: string,
    onActivate: () => void,
  ): void {
    const chrome = calculatePuzzleChromeLayout(this.scale.width, this.scale.height);
    const button = this.add.rectangle(x, y, chrome.overlayButtonWidth, 44, 0x2a3038, 1)
      .setStrokeStyle(2, 0xd0b978)
      .setInteractive({ useHandCursor: true });

    this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#f0d28a',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    button.on('pointerdown', onActivate);
  }

  private getPlayerProfileService(): PlayerProfileService {
    const service = this.registry.get(PLAYER_PROFILE_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof PlayerProfileService)) {
      throw new Error('Campaign GameScene requires PlayerProfileService in Phaser registry.');
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
