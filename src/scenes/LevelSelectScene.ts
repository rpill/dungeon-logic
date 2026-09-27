import Phaser from 'phaser';

import { ANALYTICS_SERVICE_REGISTRY_KEY, type AnalyticsService } from '../analytics/AnalyticsService';

import { getAudioFeedback } from '../audio/AudioFeedbackService';
import { getUiCopy } from '../i18n/UiCopy';

import { CAMPAIGN_SERVICE_REGISTRY_KEY, CampaignService } from '../campaign/CampaignService';
import { CAMPAIGN_ROW_SIZE } from '../campaign/CampaignUnlocks';
import type { CampaignRowUnlockTransition } from '../campaign/types';
import type { CampaignLevelEntry } from '../content/campaign/types';
import type { TutorialLevelEntry } from '../content/tutorial/types';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import {
  calculateAvailableViewport,
  readCssSafeAreaInsets,
  type AvailableViewport,
} from '../runtime/AvailableViewport';
import { createCampaignLevelPreview, type CampaignLevelPreview } from '../runtime/CampaignLevelPreview';
import { CampaignRowUnlockGate } from '../runtime/CampaignRowUnlockGate';
import {
  createCampaignGameSceneData,
  createLevelSelectItems,
  createTutorialGameSceneData,
} from '../runtime/GameLaunch';
import { createHeaderActionButton } from '../runtime/HeaderActionButton';
import { createMetaPageHeader } from '../runtime/MetaPageHeader';
import { createMasteryProgressBar } from '../runtime/MasteryProgressBar';
import { createPrimaryActionButton } from '../runtime/PrimaryActionButton';
import { createSlateSurface } from '../runtime/SlateSurface';
import { MetaPointerGate } from '../runtime/MetaPointerGate';
import { HOME_SCENE_KEY } from '../runtime/MetaSelectors';
import {
  clampMetaScrollY,
  getMetaScrollMaxY,
  getMetaScrollVelocity,
  isMetaScrollDrag,
  stepMetaScrollInertia,
} from '../runtime/MetaScroll';
import {
  calculateLevelSelectLayout,
  calculateMobilePagedLevelSelectLayout,
  translateLevelSelectLayout,
  type LevelCardLayout,
  type LevelSelectLayout,
} from '../runtime/ResponsiveLayout';
import { createSceneBackground } from '../runtime/SceneBackground';
import { TUTORIAL_SERVICE_REGISTRY_KEY, TutorialService } from '../tutorial/TutorialService';
import { UI_ICON_KEYS } from '../runtime/UiIcons';
import { drawLevelThumbnail } from '../view/LevelThumbnailRenderer';

const STATE_COLOR = {
  completed: '#73d0bd',
  current: '#f0bd63',
  unlocked: '#f4ead7',
  locked: '#a2adc0',
} as const;

const STATE_FILL = {
  completed: { color: 0x15243d, alpha: 0.96 },
  current: { color: 0x1a2843, alpha: 0.98 },
  unlocked: { color: 0x142038, alpha: 0.94 },
  locked: { color: 0x0f1728, alpha: 0.74 },
} as const;

const INNER_FILL = {
  completed: { color: 0x243556, alpha: 0.78 },
  current: { color: 0x324468, alpha: 0.86 },
  unlocked: { color: 0x31425f, alpha: 0.62 },
  locked: { color: 0x192335, alpha: 0.66 },
} as const;

const PROGRESS_FILL = 0xf0bd63;
const SECTION_LINE_COLOR = 0xf0bd63;
const SCROLLBAR_TRACK_FILL = 0x1d2c44;
const SCROLLBAR_THUMB_FILL = 0xc89d50;
const SCROLLBAR_THUMB_MAX_RATIO = 0.36;
const SCROLLBAR_HIT_WIDTH = 30;
const WHEEL_SCROLL_SCALE = 0.32;
const WHEEL_SCROLL_MAX_STEP = 44;
const WHEEL_SCROLL_EASE = 0.18;
const WHEEL_SCROLL_SNAP_EPSILON = 0.15;
const CARD_RADIUS = 8;
const CURRENT_GLOW_TEXTURE_SCALE = 3;
const MOBILE_LEVELS_PER_PAGE = CAMPAIGN_ROW_SIZE;
const MOBILE_PAGE_SWIPE_THRESHOLD = 48;
const MOBILE_PAGE_DRAG_THRESHOLD = 14;

const ROW_UNLOCK_INITIAL_PAUSE_MS = 300;
const ROW_UNLOCK_ROW_PULSE_DURATION_MS = 170;
const ROW_UNLOCK_ROW_PULSE_HOLD_MS = 90;
const ROW_UNLOCK_ROW_PULSE_STAGGER_MS = 10;
const ROW_UNLOCK_DIVIDER_DURATION_MS = 160;
const ROW_UNLOCK_DIVIDER_HOLD_MS = 70;
const ROW_UNLOCK_PHASE_GAP_MS = 50;
const ROW_UNLOCK_CARD_STAGGER_MS = 150;
const ROW_UNLOCK_CARD_DURATION_MS = 260;
const ROW_UNLOCK_CURRENT_REVEAL_DELAY_MS = 220;
const ROW_UNLOCK_CURRENT_REVEAL_DURATION_MS = 260;
const ROW_UNLOCK_COMPLETED_CHECK_SCALE = 1.28;

type LevelSelectState = keyof typeof STATE_COLOR;

interface LevelSelectSceneData {
  readonly rowUnlock?: CampaignRowUnlockTransition;
  readonly mobilePageIndex?: number;
}

function shouldUseMobileLevelPaging(viewportWidth: number): boolean {
  if (viewportWidth < 700) return true;
  const coarsePointer = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(pointer: coarse)').matches;
  const touchCapable = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
  return viewportWidth < 1024 && (coarsePointer || touchCapable);
}

function resolveMobileLevelPageIndex(
  items: ReturnType<typeof createLevelSelectItems>,
  rowUnlock: CampaignRowUnlockTransition | null,
  requestedPageIndex: number | undefined,
  pageCount: number,
): number {
  const clampPage = (page: number): number => Math.max(0, Math.min(pageCount - 1, Math.floor(page)));
  if (requestedPageIndex !== undefined && Number.isFinite(requestedPageIndex)) {
    return clampPage(requestedPageIndex);
  }
  if (rowUnlock !== null) {
    return clampPage((rowUnlock.nextRowStartSlot - 1) / MOBILE_LEVELS_PER_PAGE);
  }

  const currentIndex = items.findIndex((item) => item.state === 'current');
  if (currentIndex >= 0) return clampPage(currentIndex / MOBILE_LEVELS_PER_PAGE);

  let latestPlayableIndex = -1;
  for (let index = 0; index < items.length; index += 1) {
    if (items[index]?.playable) latestPlayableIndex = index;
  }
  return latestPlayableIndex >= 0
    ? clampPage(latestPlayableIndex / MOBILE_LEVELS_PER_PAGE)
    : 0;
}

export class LevelSelectScene extends Phaser.Scene {
  private launchPending = false;
  private contentBottom = 0;
  private scrollMaxY = 0;
  private scrollPointerId: number | null = null;
  private scrollStartPointerY = 0;
  private scrollStartCameraY = 0;
  private scrollGestureDragged = false;
  private scrollVelocityY = 0;
  private lastScrollSampleY = 0;
  private lastScrollSampleAtMs = 0;
  private lastDraggedPointerId: number | null = null;
  private lastDragEndedAtMs = 0;
  private mobileSwipePointerId: number | null = null;
  private mobileSwipeStartX = 0;
  private mobileSwipeStartY = 0;
  private mobileSwipeDragged = false;
  private readonly pointerGate = new MetaPointerGate();
  private readonly rowUnlockGate = new CampaignRowUnlockGate();

  constructor() {
    super('LevelSelectScene');
  }

  create(data: LevelSelectSceneData = {}): void {
    this.launchPending = false;
    this.pointerGate.reset();
    this.contentBottom = 0;
    this.scrollMaxY = 0;
    this.scrollPointerId = null;
    this.scrollGestureDragged = false;
    this.scrollVelocityY = 0;
    this.lastScrollSampleY = 0;
    this.lastScrollSampleAtMs = 0;
    this.lastDraggedPointerId = null;
    this.lastDragEndedAtMs = 0;
    this.mobileSwipePointerId = null;
    this.mobileSwipeDragged = false;
    this.cameras.main.setScroll(0, 0);

    const sceneBackground = createSceneBackground(this, 'meta');
    sceneBackground.image.setScrollFactor(0);
    const service = this.getCampaignService();
    const tutorial = this.getTutorialService();
    const profile = this.getProfileService().getProfile();
    const copy = getUiCopy(profile.settings.language);
    const analytics = this.registry.get(ANALYTICS_SERVICE_REGISTRY_KEY) as AnalyticsService | undefined;
    analytics?.screenView('levels');
    const progress = service.getProgress();
    const items = createLevelSelectItems(service.getLevels(), progress, profile.tutorial.completed);
    const availableViewport = this.getAvailableViewport();
    const rowUnlock = this.rowUnlockGate.consume(data.rowUnlock);
    const mobilePaged = shouldUseMobileLevelPaging(availableViewport.width);
    const mobilePageCount = Math.max(1, Math.ceil(items.length / MOBILE_LEVELS_PER_PAGE));
    const mobilePageIndex = mobilePaged
      ? resolveMobileLevelPageIndex(items, rowUnlock, data.mobilePageIndex, mobilePageCount)
      : 0;
    const mobilePageStart = mobilePageIndex * MOBILE_LEVELS_PER_PAGE;
    const visibleItems = mobilePaged
      ? items.slice(mobilePageStart, mobilePageStart + MOBILE_LEVELS_PER_PAGE)
      : items;
    const layout = translateLevelSelectLayout(
      mobilePaged
        ? calculateMobilePagedLevelSelectLayout(
            availableViewport.width,
            availableViewport.height,
            visibleItems.length,
          )
        : calculateLevelSelectLayout(availableViewport.width, availableViewport.height, items.length),
      availableViewport.x,
      availableViewport.y,
    );
    this.contentBottom = layout.contentBottom;

    createMetaPageHeader(this, {
      title: copy.common.levels,
      backLabel: copy.common.back,
      backButton: true,
      fixedBack: true,
      viewport: availableViewport,
      onBack: (pointer) => {
        if (!this.shouldActivatePointer(pointer)) return;
        this.scene.start(HOME_SCENE_KEY);
      },
    });

    if (!profile.tutorial.completed) {
      const tutorialEntry = tutorial.getContinueLevel() ?? tutorial.getLevels()[0];
      if (tutorialEntry !== undefined) {
        this.createActionButton(
          availableViewport.centerX,
          layout.continueY,
          layout.continueWidth,
          layout.continueHeight,
          copy.home.continue,
          '#f0d28a',
          () => { void this.launchTutorial(tutorial, tutorialEntry); },
        );
      }
    } else {
      const continueLevel = service.getContinueLevel();
      if (continueLevel !== null) {
        this.createActionButton(
          availableViewport.centerX,
          layout.continueY,
          layout.continueWidth,
          layout.continueHeight,
          copy.home.continue,
          '#f0d28a',
          () => { void this.launchLevel(service, continueLevel); },
        );
      }
    }

    this.drawProgressSummary(
      layout,
      copy.levelSelect.progress(progress.completedLevelIds.length, items.length),
      progress.completedLevelIds.length,
      items.length,
    );
    this.drawLevelSectionDividers(layout, visibleItems.length);

    visibleItems.forEach((item, index) => {
      const cardLayout = layout.cards[index];
      const deferCurrentHighlight = rowUnlock !== null
        && item.state === 'current'
        && item.entry.slot === rowUnlock.nextRowStartSlot;
      const visualState: LevelSelectState = deferCurrentHighlight ? 'unlocked' : item.state;
      const color = STATE_COLOR[visualState];
      const preview = createCampaignLevelPreview(item.entry, profile.campaign);
      const cardTone = STATE_FILL[visualState];
      const strokeColor = Phaser.Display.Color.HexStringToColor(color).color;

      if (visualState === 'current') {
        this.drawCurrentGlow(cardLayout, strokeColor).setAlpha(0.22);
      }

      const surface = createSlateSurface(
        this,
        cardLayout.x,
        cardLayout.y,
        cardLayout.width,
        cardLayout.height,
      );
      if (visualState === 'locked') surface.setTint(0x9199a6);
      if (visualState === 'current') {
        this.drawRoundedCardShape(
          cardLayout.x,
          cardLayout.y,
          cardLayout.width - 2,
          cardLayout.height - 2,
          cardTone.color,
          0,
          strokeColor,
          0.82,
          2,
          CARD_RADIUS,
        );
      }

      this.drawLevelPreview(item.entry, preview, cardLayout, visualState);
      this.drawLevelStateMarkers(visualState, cardLayout);

      this.add.text(
        cardLayout.x,
        cardLayout.numberY,
        String(item.entry.slot),
        {
          fontFamily: "'Balsamiq Sans', sans-serif",
          fontSize: `${layout.cardTitleFontSize}px`,
          color,
          fontStyle: 'bold',
        },
      ).setOrigin(0.5);

      if (item.playable) {
        const hoverOverlay = this.drawRoundedOverlay(
          cardLayout.x,
          cardLayout.y,
          Math.max(1, cardLayout.width - 6),
          Math.max(1, cardLayout.height - 6),
          0x40577f,
          0.16,
          CARD_RADIUS - 2,
        ).setVisible(false);

        const cardZone = this.add.zone(
          cardLayout.x,
          cardLayout.y,
          cardLayout.width,
          cardLayout.height,
        ).setInteractive({ useHandCursor: true });

        cardZone
          .on('pointerover', () => {
            hoverOverlay.setAlpha(0.16).setVisible(true);
          })
          .on('pointerout', () => {
            hoverOverlay.setVisible(false);
          })
          .on('pointerdown', () => {
            hoverOverlay.setAlpha(0.28).setVisible(true);
          })
          .on('pointerup', (pointer: Phaser.Input.Pointer) => {
            hoverOverlay.setAlpha(0.16).setVisible(true);
            if (!this.shouldActivatePointer(pointer)) return;
            getAudioFeedback(this).play('ui-click');
            void this.launchLevel(service, item.entry);
          });
      }
    });

    this.setupPointerOwnership();
    if (mobilePaged) {
      this.createMobileLevelPager(
        layout,
        mobilePageIndex,
        mobilePageCount,
        mobilePageStart + 1,
        mobilePageStart + visibleItems.length,
      );
      this.setupMobileLevelPaging(mobilePageIndex, mobilePageCount);
      if (rowUnlock !== null) {
        this.playMobileRowUnlockTransition(layout, visibleItems, rowUnlock, mobilePageStart);
      }
    } else {
      const initialScrollY = rowUnlock === null
        ? 0
        : this.getRowUnlockInitialScrollY(layout, rowUnlock.nextRowStartSlot);
      this.setupMetaScroll(layout, initialScrollY);
      if (rowUnlock !== null) {
        this.playRowUnlockTransition(layout, items, rowUnlock);
      }
    }

    const handleResize = (): void => {
      sceneBackground.sync();
      if (this.scene.isActive()) {
        this.scene.restart();
      }
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
    });
  }

  private drawProgressSummary(
    layout: LevelSelectLayout,
    label: string,
    completedCount: number,
    totalCount: number,
  ): void {
    const availableViewport = this.getAvailableViewport();
    this.add.text(availableViewport.centerX, layout.progressLabelY, label, {
      fontFamily: "'Balsamiq Sans', sans-serif",
      fontSize: `${layout.progressLabelFontSize}px`,
      color: '#e7edf8',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    createMasteryProgressBar(this, {
      x: availableViewport.centerX,
      y: layout.progressBarY,
      width: layout.progressBarWidth,
      height: layout.progressBarHeight,
      current: completedCount,
      target: totalCount,
    });
  }

  private drawLevelSectionDividers(layout: LevelSelectLayout, itemCount: number): void {
    if (itemCount <= 8 || layout.cards.length === 0) return;

    const rowsPerBlock = Math.max(1, Math.ceil(8 / layout.columns));
    const totalRows = Math.ceil(itemCount / layout.columns);
    const gridWidth = this.getGridWidth(layout);
    const lineWidth = Math.max(24, (gridWidth - 36) / 2);
    const centerX = this.getAvailableViewport().centerX;

    for (let rowBreak = rowsPerBlock; rowBreak < totalRows; rowBreak += rowsPerBlock) {
      const lastPreviousIndex = Math.min(itemCount, rowBreak * layout.columns) - 1;
      const nextIndex = lastPreviousIndex + 1;
      if (nextIndex >= layout.cards.length) break;

      const previous = layout.cards[lastPreviousIndex];
      const next = layout.cards[nextIndex];
      const previousBottom = previous.numberY + layout.cardTitleFontSize / 2;
      const nextTop = next.y - next.height / 2;
      const y = Math.round((previousBottom + nextTop) / 2);

      this.add.rectangle(centerX - 10 - lineWidth / 2, y, lineWidth, 1, SECTION_LINE_COLOR, 0.72);
      this.add.rectangle(centerX + 10 + lineWidth / 2, y, lineWidth, 1, SECTION_LINE_COLOR, 0.72);
      this.add.rectangle(centerX, y, 7, 7, PROGRESS_FILL, 0.92).setRotation(Math.PI / 4);
    }
  }

  private getGridWidth(layout: LevelSelectLayout): number {
    if (layout.cards.length === 0) return 0;

    let left = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;
    for (const card of layout.cards) {
      left = Math.min(left, card.x - card.width / 2);
      right = Math.max(right, card.x + card.width / 2);
    }
    return right - left;
  }

  private drawLevelPreview(
    entry: CampaignLevelEntry,
    preview: CampaignLevelPreview,
    cardLayout: LevelCardLayout,
    state: LevelSelectState,
  ): void {
    if (preview.status === 'unstarted') {
      const innerTone = INNER_FILL[state];
      this.drawRoundedCardShape(
        cardLayout.x,
        cardLayout.y,
        Math.max(1, cardLayout.width - 14),
        Math.max(1, cardLayout.height - 14),
        innerTone.color,
        innerTone.alpha,
        0x000000,
        0,
        0,
        CARD_RADIUS - 2,
      );

      const iconKey = state === 'locked' ? UI_ICON_KEYS.lock : UI_ICON_KEYS.question;
      const tint = Phaser.Display.Color.HexStringToColor(STATE_COLOR[state]).color;
      const iconSize = Math.max(18, Math.floor(cardLayout.width * 0.38));
      this.add.image(cardLayout.x, cardLayout.y, iconKey)
        .setDisplaySize(iconSize, iconSize)
        .setTint(tint)
        .setAlpha(state === 'locked' ? 0.78 : 0.9);
      return;
    }

    drawLevelThumbnail(
      this,
      entry.level,
      preview.walls,
      {
        x: cardLayout.x,
        y: cardLayout.y,
        width: cardLayout.width,
        height: cardLayout.height,
      },
      { showIncompleteOverlay: preview.showIncompleteOverlay },
    );
  }

  private drawCurrentGlow(cardLayout: LevelCardLayout, strokeColor: number): Phaser.GameObjects.Image {
    const padding = Math.max(26, Math.round(cardLayout.width * 0.44));
    const logicalWidth = Math.ceil(cardLayout.width + padding * 2);
    const logicalHeight = Math.ceil(cardLayout.height + padding * 2);
    const textureKey = `level-current-glow-${Math.round(cardLayout.width)}-${Math.round(cardLayout.height)}-${strokeColor.toString(16)}`;

    if (!this.textures.exists(textureKey)) {
      const canvas = document.createElement('canvas');
      canvas.width = logicalWidth * CURRENT_GLOW_TEXTURE_SCALE;
      canvas.height = logicalHeight * CURRENT_GLOW_TEXTURE_SCALE;
      const context = canvas.getContext('2d');

      if (context !== null) {
        context.scale(CURRENT_GLOW_TEXTURE_SCALE, CURRENT_GLOW_TEXTURE_SCALE);
        const color = `#${strokeColor.toString(16).padStart(6, '0')}`;
        context.fillStyle = color;
        context.shadowColor = color;
        context.shadowBlur = Math.max(19, cardLayout.width * 0.32) * CURRENT_GLOW_TEXTURE_SCALE;
        context.globalAlpha = 0.68;
        this.traceRoundedCanvasRect(
          context,
          padding,
          padding,
          cardLayout.width,
          cardLayout.height,
          CARD_RADIUS,
        );
        context.fill();
        context.globalAlpha = 1;
      }

      this.textures.addCanvas(textureKey, canvas);
    }

    return this.add.image(cardLayout.x, cardLayout.y, textureKey)
      .setDisplaySize(logicalWidth, logicalHeight)
      .setAlpha(0.82);
  }

  private traceRoundedCanvasRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  private drawLevelStateMarkers(
    state: LevelSelectState,
    cardLayout: LevelCardLayout,
  ): void {
    if (state === 'completed') {
      this.drawCompletedCheck(cardLayout);
    }

    if (state === 'current') {
      this.add.rectangle(
        cardLayout.x,
        cardLayout.y - cardLayout.height / 2 - 8,
        8,
        8,
        0xf0bd63,
        0.96,
      ).setRotation(Math.PI / 4);
    }
  }

  private drawCompletedCheck(cardLayout: LevelCardLayout): void {
    const iconSize = Math.max(19, Math.floor(cardLayout.width * 0.34));
    const x = cardLayout.x + cardLayout.width / 2 - 3;
    const y = cardLayout.y + cardLayout.height / 2 - 3;
    const backingRadius = iconSize * 0.39;

    // The supplied check-circle SVG uses a transparent check cutout. A dark backing
    // keeps the card border/preview from showing through that cutout without adding
    // any visible outer ring around the icon.
    this.add.circle(x, y, backingRadius, 0x0d1b2d, 1);
    this.add.image(x, y, UI_ICON_KEYS.check)
      .setDisplaySize(iconSize, iconSize)
      .setTint(0x73d0bd);
  }

  private drawRoundedCardShape(
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: number,
    fillAlpha: number,
    strokeColor: number,
    strokeAlpha: number,
    strokeWidth: number,
    radius: number,
  ): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics();
    const left = x - width / 2;
    const top = y - height / 2;
    graphics.fillStyle(fillColor, fillAlpha);
    graphics.fillRoundedRect(left, top, width, height, radius);
    if (strokeWidth > 0 && strokeAlpha > 0) {
      graphics.lineStyle(strokeWidth, strokeColor, strokeAlpha);
      graphics.strokeRoundedRect(left, top, width, height, radius);
    }
    return graphics;
  }

  private drawRoundedOverlay(
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: number,
    fillAlpha: number,
    radius: number,
  ): Phaser.GameObjects.Graphics {
    return this.drawRoundedCardShape(x, y, width, height, fillColor, fillAlpha, fillColor, 0, 0, radius);
  }

  private createActionButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    _color: string,
    onActivate: () => void,
  ): void {
    createPrimaryActionButton(this, {
      x,
      y,
      width,
      height,
      label,
      iconKey: 'home-menu-icon-play',
      onActivate: (pointer) => {
        if (!this.shouldActivatePointer(pointer)) return;
        onActivate();
      },
    });
  }

  private createMobileLevelPager(
    layout: LevelSelectLayout,
    pageIndex: number,
    pageCount: number,
    firstSlot: number,
    lastSlot: number,
  ): void {
    const viewport = this.getAvailableViewport();
    const lastCard = layout.cards[layout.cards.length - 1];
    const naturalY = (lastCard?.numberY ?? layout.headerBottom) + 43;
    const pagerY = Math.min(viewport.bottom - 25, naturalY);
    const centerX = viewport.centerX;
    const arrowOffset = Math.min(150, viewport.width * 0.39);
    const arrowButtonSize = 42;
    const labelY = pagerY - 19;
    const dotsY = pagerY + 12;

    this.add.text(centerX, labelY, `${firstSlot}–${lastSlot}`, {
      fontFamily: "'Balsamiq Sans', sans-serif",
      fontSize: '12px',
      color: '#d7dfed',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const createArrow = (direction: -1 | 1): void => {
      const enabled = direction < 0 ? pageIndex > 0 : pageIndex < pageCount - 1;
      const x = centerX + direction * arrowOffset;
      const button = createHeaderActionButton(this, {
        x,
        y: pagerY,
        width: arrowButtonSize,
        height: arrowButtonSize,
        radius: 10,
        iconKey: UI_ICON_KEYS.back,
        iconSize: 22,
        fixed: true,
        depth: 20,
        onActivate: (pointer) => {
          if (!enabled || !this.shouldActivatePointer(pointer)) return;
          this.goToMobileLevelPage(pageIndex + direction, pageCount);
        },
      });

      if (direction > 0) button.icon.setRotation(Math.PI);
      if (!enabled) {
        button.background.setAlpha(0.34);
        button.icon.setAlpha(0.38);
        button.hit.disableInteractive();
      }
    };

    createArrow(-1);
    createArrow(1);

    const dotGap = 18;
    const dotStartX = centerX - ((pageCount - 1) * dotGap) / 2;
    for (let index = 0; index < pageCount; index += 1) {
      const x = dotStartX + index * dotGap;
      const current = index === pageIndex;
      const dot = this.add.rectangle(
        x,
        dotsY,
        current ? 8 : 6,
        current ? 8 : 6,
        current ? PROGRESS_FILL : 0x60708a,
        current ? 1 : 0.72,
      ).setRotation(Math.PI / 4);
      if (current) continue;

      const hit = this.add.zone(x, dotsY, 20, 24).setInteractive({ useHandCursor: true });
      hit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (!this.shouldActivatePointer(pointer)) return;
        getAudioFeedback(this).play('ui-click');
        this.goToMobileLevelPage(index, pageCount);
      });
      void dot;
    }
  }

  private setupMobileLevelPaging(pageIndex: number, pageCount: number): void {
    const handlePointerDown = (pointer: Phaser.Input.Pointer): void => {
      this.mobileSwipePointerId = pointer.id;
      this.mobileSwipeStartX = pointer.x;
      this.mobileSwipeStartY = pointer.y;
      this.mobileSwipeDragged = false;
    };
    const handlePointerMove = (pointer: Phaser.Input.Pointer): void => {
      if (this.mobileSwipePointerId !== pointer.id || !pointer.isDown) return;
      const deltaX = pointer.x - this.mobileSwipeStartX;
      const deltaY = pointer.y - this.mobileSwipeStartY;
      if (
        Math.abs(deltaX) >= MOBILE_PAGE_DRAG_THRESHOLD
        && Math.abs(deltaX) > Math.abs(deltaY) * 1.15
      ) {
        this.mobileSwipeDragged = true;
      }
    };
    const handlePointerUp = (pointer: Phaser.Input.Pointer): void => {
      if (this.mobileSwipePointerId !== pointer.id) return;
      const deltaX = pointer.x - this.mobileSwipeStartX;
      const deltaY = pointer.y - this.mobileSwipeStartY;
      const dragged = this.mobileSwipeDragged;

      if (dragged) {
        this.lastDraggedPointerId = pointer.id;
        this.lastDragEndedAtMs = Date.now();
        if (
          Math.abs(deltaX) >= MOBILE_PAGE_SWIPE_THRESHOLD
          && Math.abs(deltaX) > Math.abs(deltaY) * 1.15
        ) {
          const direction = deltaX < 0 ? 1 : -1;
          const targetPage = Phaser.Math.Clamp(pageIndex + direction, 0, pageCount - 1);
          if (targetPage !== pageIndex) {
            getAudioFeedback(this).play('ui-click');
            this.goToMobileLevelPage(targetPage, pageCount);
          }
        }
      }

      this.mobileSwipePointerId = null;
      this.mobileSwipeDragged = false;
    };

    this.input.on('pointerdown', handlePointerDown);
    this.input.on('pointermove', handlePointerMove);
    this.input.on('pointerup', handlePointerUp);
    this.input.on('pointerupoutside', handlePointerUp);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', handlePointerDown);
      this.input.off('pointermove', handlePointerMove);
      this.input.off('pointerup', handlePointerUp);
      this.input.off('pointerupoutside', handlePointerUp);
    });
  }

  private goToMobileLevelPage(pageIndex: number, pageCount: number): void {
    const safePage = Phaser.Math.Clamp(Math.floor(pageIndex), 0, Math.max(0, pageCount - 1));
    this.scene.restart({ mobilePageIndex: safePage });
  }

  private playMobileRowUnlockTransition(
    layout: LevelSelectLayout,
    visibleItems: ReturnType<typeof createLevelSelectItems>,
    transition: CampaignRowUnlockTransition,
    mobilePageStart: number,
  ): void {
    const newlyPlayable = visibleItems
      .map((item, localIndex) => ({ item, localIndex }))
      .filter(({ item }) => (
        item.entry.slot >= transition.nextRowStartSlot
        && item.entry.slot < transition.nextRowStartSlot + CAMPAIGN_ROW_SIZE
        && item.playable
        && item.state !== 'completed'
      ));
    const unlockStartDelay = ROW_UNLOCK_INITIAL_PAUSE_MS;
    const unlockWaveEnd = (
      unlockStartDelay
      + Math.max(0, newlyPlayable.length - 1) * ROW_UNLOCK_CARD_STAGGER_MS
      + ROW_UNLOCK_CARD_DURATION_MS
    );
    const currentRevealStart = unlockWaveEnd + ROW_UNLOCK_CURRENT_REVEAL_DELAY_MS;
    const transitionDuration = currentRevealStart + ROW_UNLOCK_CURRENT_REVEAL_DURATION_MS;

    this.launchPending = true;
    this.time.delayedCall(transitionDuration + ROW_UNLOCK_PHASE_GAP_MS, () => {
      if (this.scene.isActive()) this.launchPending = false;
    });

    newlyPlayable.forEach(({ localIndex }, unlockIndex) => {
      const card = layout.cards[localIndex];
      if (card === undefined) return;
      const cover = this.createTemporaryUnlockCover(card);
      this.tweens.add({
        targets: cover,
        alpha: 0,
        scaleX: 1.06,
        scaleY: 1.06,
        duration: ROW_UNLOCK_CARD_DURATION_MS,
        delay: unlockStartDelay + unlockIndex * ROW_UNLOCK_CARD_STAGGER_MS,
        ease: 'Cubic.easeOut',
        onStart: () => getAudioFeedback(this).play('campaign-unlock'),
        onComplete: () => cover.destroy(true),
      });
    });

    this.time.delayedCall(currentRevealStart, () => {
      if (!this.scene.isActive()) return;
      const currentLocalIndex = transition.nextRowStartSlot - 1 - mobilePageStart;
      const currentCard = layout.cards[currentLocalIndex];
      if (currentCard !== undefined) {
        this.revealCurrentLevelHighlight(
          currentCard,
          transition.nextRowStartSlot,
          layout.cardTitleFontSize,
        );
      }
    });
  }

  private getRowUnlockInitialScrollY(layout: LevelSelectLayout, nextRowStartSlot: number): number {
    const card = layout.cards[nextRowStartSlot - 1];
    if (card === undefined) return 0;
    const availableViewport = this.getAvailableViewport();
    return Math.max(0, card.y - availableViewport.y - availableViewport.height * 0.58);
  }

  private playRowUnlockTransition(
    layout: LevelSelectLayout,
    items: ReturnType<typeof createLevelSelectItems>,
    transition: CampaignRowUnlockTransition,
  ): void {
    const firstCompletedIndex = transition.completedRowStartSlot - 1;
    const lastCompletedIndex = transition.completedRowEndSlot - 1;
    const completedCardCount = Math.max(0, lastCompletedIndex - firstCompletedIndex + 1);
    const rowPulseDuration = (
      ROW_UNLOCK_ROW_PULSE_DURATION_MS * 2
      + ROW_UNLOCK_ROW_PULSE_HOLD_MS
      + Math.max(0, completedCardCount - 1) * ROW_UNLOCK_ROW_PULSE_STAGGER_MS
    );
    const dividerDelay = ROW_UNLOCK_INITIAL_PAUSE_MS + rowPulseDuration;
    const dividerDuration = ROW_UNLOCK_DIVIDER_DURATION_MS * 2 + ROW_UNLOCK_DIVIDER_HOLD_MS;
    const unlockStartDelay = dividerDelay + dividerDuration + ROW_UNLOCK_PHASE_GAP_MS;

    const newlyPlayable = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => (
        item.entry.slot >= transition.nextRowStartSlot
        && item.entry.slot < transition.nextRowStartSlot + CAMPAIGN_ROW_SIZE
        && item.playable
        && item.state !== 'completed'
      ));
    const unlockWaveEnd = (
      unlockStartDelay
      + Math.max(0, newlyPlayable.length - 1) * ROW_UNLOCK_CARD_STAGGER_MS
      + ROW_UNLOCK_CARD_DURATION_MS
    );
    const currentRevealStart = unlockWaveEnd + ROW_UNLOCK_CURRENT_REVEAL_DELAY_MS;
    const transitionDuration = currentRevealStart + ROW_UNLOCK_CURRENT_REVEAL_DURATION_MS;

    this.launchPending = true;
    this.time.delayedCall(transitionDuration + ROW_UNLOCK_PHASE_GAP_MS, () => {
      if (this.scene.isActive()) this.launchPending = false;
    });

    for (let index = firstCompletedIndex; index <= lastCompletedIndex; index += 1) {
      const card = layout.cards[index];
      if (card === undefined) continue;
      const pulse = this.createCompletedRowGoldPulse(card);
      const delay = ROW_UNLOCK_INITIAL_PAUSE_MS
        + Math.max(0, index - firstCompletedIndex) * ROW_UNLOCK_ROW_PULSE_STAGGER_MS;

      this.tweens.add({
        targets: pulse.border,
        alpha: { from: 0, to: 1 },
        duration: ROW_UNLOCK_ROW_PULSE_DURATION_MS,
        yoyo: true,
        hold: ROW_UNLOCK_ROW_PULSE_HOLD_MS,
        delay,
        ease: 'Sine.easeInOut',
        onComplete: () => pulse.border.destroy(),
      });
      this.tweens.add({
        targets: pulse.check,
        alpha: { from: 0, to: 1 },
        scaleX: { from: 1, to: ROW_UNLOCK_COMPLETED_CHECK_SCALE },
        scaleY: { from: 1, to: ROW_UNLOCK_COMPLETED_CHECK_SCALE },
        duration: ROW_UNLOCK_ROW_PULSE_DURATION_MS,
        yoyo: true,
        hold: ROW_UNLOCK_ROW_PULSE_HOLD_MS,
        delay,
        ease: 'Back.easeOut',
        onComplete: () => pulse.check.destroy(true),
      });
    }

    this.createRowDividerPulse(layout, transition.nextRowStartSlot, dividerDelay);

    newlyPlayable.forEach(({ index }, unlockIndex) => {
      const card = layout.cards[index];
      if (card === undefined) return;
      const cover = this.createTemporaryUnlockCover(card);
      this.tweens.add({
        targets: cover,
        alpha: 0,
        scaleX: 1.06,
        scaleY: 1.06,
        duration: ROW_UNLOCK_CARD_DURATION_MS,
        delay: unlockStartDelay + unlockIndex * ROW_UNLOCK_CARD_STAGGER_MS,
        ease: 'Cubic.easeOut',
        onStart: () => getAudioFeedback(this).play('campaign-unlock'),
        onComplete: () => cover.destroy(true),
      });
    });

    this.time.delayedCall(currentRevealStart, () => {
      if (!this.scene.isActive()) return;
      const currentCard = layout.cards[transition.nextRowStartSlot - 1];
      if (currentCard !== undefined) {
        this.revealCurrentLevelHighlight(currentCard, transition.nextRowStartSlot, layout.cardTitleFontSize);
      }
    });
  }

  private createCompletedRowGoldPulse(
    card: LevelCardLayout,
  ): {
    readonly border: Phaser.GameObjects.Graphics;
    readonly check: Phaser.GameObjects.Container;
  } {
    const border = this.drawRoundedCardShape(
      card.x,
      card.y,
      card.width,
      card.height,
      0x000000,
      0,
      PROGRESS_FILL,
      1,
      2.5,
      CARD_RADIUS,
    ).setDepth(320).setAlpha(0);

    const iconSize = Math.max(19, Math.floor(card.width * 0.34));
    const checkX = card.x + card.width / 2 - 3;
    const checkY = card.y + card.height / 2 - 3;
    const backingRadius = iconSize * 0.42;
    const backing = this.add.circle(0, 0, backingRadius, 0x0d1b2d, 1);
    const icon = this.add.image(0, 0, UI_ICON_KEYS.check)
      .setDisplaySize(iconSize, iconSize)
      .setTint(0xf0bd63);
    const check = this.add.container(checkX, checkY, [backing, icon])
      .setDepth(321)
      .setAlpha(0);

    return { border, check };
  }

  private revealCurrentLevelHighlight(
    card: LevelCardLayout,
    slot: number,
    titleFontSize: number,
  ): void {
    const strokeColor = Phaser.Display.Color.HexStringToColor(STATE_COLOR.current).color;
    const glow = this.drawCurrentGlow(card, strokeColor).setDepth(-1).setAlpha(0);
    const border = this.drawRoundedCardShape(
      card.x,
      card.y,
      card.width,
      card.height,
      STATE_FILL.current.color,
      0,
      strokeColor,
      0.96,
      3,
      CARD_RADIUS,
    ).setDepth(346).setAlpha(0);
    const marker = this.add.rectangle(
      card.x,
      card.y - card.height / 2 - 8,
      8,
      8,
      0xf0bd63,
      0.96,
    ).setRotation(Math.PI / 4).setDepth(347).setAlpha(0);
    const number = this.add.text(
      card.x,
      card.numberY,
      String(slot),
      {
        fontFamily: "'Balsamiq Sans', sans-serif",
        fontSize: `${titleFontSize}px`,
        color: STATE_COLOR.current,
        fontStyle: 'bold',
      },
    ).setOrigin(0.5).setDepth(347).setAlpha(0);

    this.tweens.add({
      targets: [glow, border, marker, number],
      alpha: 1,
      duration: ROW_UNLOCK_CURRENT_REVEAL_DURATION_MS,
      ease: 'Sine.easeOut',
    });
  }

  private createRowDividerPulse(
    layout: LevelSelectLayout,
    nextRowStartSlot: number,
    delayMs = 0,
  ): void {
    const previous = layout.cards[nextRowStartSlot - 2];
    const next = layout.cards[nextRowStartSlot - 1];
    if (previous === undefined || next === undefined) return;

    const previousBottom = previous.numberY + layout.cardTitleFontSize / 2;
    const nextTop = next.y - next.height / 2;
    const y = Math.round((previousBottom + nextTop) / 2);
    const gridWidth = this.getGridWidth(layout);
    const lineWidth = Math.max(24, (gridWidth - 36) / 2);
    const centerX = this.getAvailableViewport().centerX;
    const left = this.add.rectangle(centerX - 10 - lineWidth / 2, y, lineWidth, 2, 0xffd98a, 1)
      .setDepth(330)
      .setAlpha(0.15)
      .setScale(0.3, 1);
    const right = this.add.rectangle(centerX + 10 + lineWidth / 2, y, lineWidth, 2, 0xffd98a, 1)
      .setDepth(330)
      .setAlpha(0.15)
      .setScale(0.3, 1);
    const diamond = this.add.rectangle(centerX, y, 9, 9, 0xffd98a, 1)
      .setRotation(Math.PI / 4)
      .setDepth(331)
      .setAlpha(0.2)
      .setScale(0.65);

    this.tweens.add({
      targets: [left, right],
      alpha: { from: 0.15, to: 1 },
      scaleX: 1,
      duration: ROW_UNLOCK_DIVIDER_DURATION_MS,
      yoyo: true,
      hold: ROW_UNLOCK_DIVIDER_HOLD_MS,
      delay: delayMs,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        left.destroy();
        right.destroy();
      },
    });
    this.tweens.add({
      targets: diamond,
      alpha: { from: 0.2, to: 1 },
      scaleX: 1.25,
      scaleY: 1.25,
      duration: ROW_UNLOCK_DIVIDER_DURATION_MS,
      yoyo: true,
      hold: ROW_UNLOCK_DIVIDER_HOLD_MS,
      delay: delayMs,
      ease: 'Back.easeOut',
      onComplete: () => diamond.destroy(),
    });
  }

  private createTemporaryUnlockCover(card: LevelCardLayout): Phaser.GameObjects.Container {
    const cover = this.add.container(card.x, card.y).setDepth(340);
    const plate = this.add.graphics();
    plate.fillStyle(STATE_FILL.locked.color, 0.97);
    plate.fillRoundedRect(-card.width / 2, -card.height / 2, card.width, card.height, CARD_RADIUS);
    plate.lineStyle(2.5, 0x7f8ba2, 0.9);
    plate.strokeRoundedRect(-card.width / 2, -card.height / 2, card.width, card.height, CARD_RADIUS);
    const iconSize = Math.max(18, Math.floor(card.width * 0.38));
    const lock = this.add.image(0, 0, UI_ICON_KEYS.lock)
      .setDisplaySize(iconSize, iconSize)
      .setTint(0x7f8ba2)
      .setAlpha(0.9);
    cover.add([plate, lock]);
    return cover;
  }

  private getAvailableViewport(): AvailableViewport {
    return calculateAvailableViewport(
      this.scale.width,
      this.scale.height,
      readCssSafeAreaInsets(),
    );
  }

  private getScrollMaxY(contentBottom: number): number {
    const availableViewport = this.getAvailableViewport();
    return getMetaScrollMaxY(
      availableViewport.height,
      Math.max(0, contentBottom - availableViewport.y),
    );
  }

  private setupPointerOwnership(): void {
    const handlePointerDown = (pointer: Phaser.Input.Pointer): void => {
      this.pointerGate.notePointerDown(pointer.id);
    };

    this.input.on('pointerdown', handlePointerDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', handlePointerDown);
    });
  }

  private setupMetaScroll(layout: LevelSelectLayout, initialScrollY = 0): void {
    this.scrollMaxY = this.getScrollMaxY(this.contentBottom);
    if (this.scrollMaxY <= 0) {
      this.cameras.main.scrollY = 0;
      return;
    }

    const camera = this.cameras.main;
    camera.scrollY = clampMetaScrollY(initialScrollY, this.scrollMaxY);
    const scrollbar = this.createScrollIndicator(layout);
    let wheelTargetY = camera.scrollY;
    const syncScrollbar = (): void => {
      const ratio = this.scrollMaxY <= 0 ? 0 : Phaser.Math.Clamp(camera.scrollY / this.scrollMaxY, 0, 1);
      const thumbTravel = Math.max(0, scrollbar.trackHeight - scrollbar.thumbHeight);
      const thumbY = scrollbar.trackY + ratio * thumbTravel + scrollbar.thumbHeight / 2;
      scrollbar.thumbVisual.setY(thumbY);
      scrollbar.thumbHitArea.setY(thumbY);
    };

    const applyScrollY = (nextScrollY: number): void => {
      camera.scrollY = clampMetaScrollY(nextScrollY, this.scrollMaxY);
      wheelTargetY = camera.scrollY;
      syncScrollbar();
    };

    const scrollFromThumbCenterY = (thumbCenterY: number): void => {
      const minThumbY = scrollbar.trackY + scrollbar.thumbHeight / 2;
      const maxThumbY = scrollbar.trackY + scrollbar.trackHeight - scrollbar.thumbHeight / 2;
      const clampedThumbY = Phaser.Math.Clamp(thumbCenterY, minThumbY, maxThumbY);
      const travel = Math.max(1, maxThumbY - minThumbY);
      const ratio = (clampedThumbY - minThumbY) / travel;
      applyScrollY(ratio * this.scrollMaxY);
    };

    this.input.setDraggable(scrollbar.thumbHitArea);
    scrollbar.thumbHitArea
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        wheelTargetY = camera.scrollY;
        this.scrollVelocityY = 0;
        this.scrollPointerId = null;
        this.scrollGestureDragged = false;
        this.lastDraggedPointerId = pointer.id;
      })
      .on('drag', (
        pointer: Phaser.Input.Pointer,
        _dragX: number,
        _dragY: number,
      ) => {
        scrollFromThumbCenterY(pointer.y);
      });

    scrollbar.trackHitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.scrollVelocityY = 0;
      wheelTargetY = camera.scrollY;
      const thumbTop = scrollbar.thumbHitArea.y - scrollbar.thumbHeight / 2;
      const thumbBottom = scrollbar.thumbHitArea.y + scrollbar.thumbHeight / 2;
      if (pointer.y >= thumbTop && pointer.y <= thumbBottom) return;
      scrollFromThumbCenterY(pointer.y);
    });

    const handleWheel = (
      _pointer: Phaser.Input.Pointer,
      _gameObjects: readonly Phaser.GameObjects.GameObject[],
      _deltaX: number,
      deltaY: number,
    ): void => {
      this.scrollVelocityY = 0;
      const wheelStep = Phaser.Math.Clamp(
        deltaY * WHEEL_SCROLL_SCALE,
        -WHEEL_SCROLL_MAX_STEP,
        WHEEL_SCROLL_MAX_STEP,
      );
      wheelTargetY = clampMetaScrollY(wheelTargetY + wheelStep, this.scrollMaxY);
    };
    const handlePointerDown = (pointer: Phaser.Input.Pointer): void => {
      wheelTargetY = camera.scrollY;
      this.scrollVelocityY = 0;
      if (pointer.x >= scrollbar.interactionLeft) {
        this.scrollPointerId = null;
        this.scrollGestureDragged = false;
        return;
      }
      this.scrollPointerId = pointer.id;
      this.scrollStartPointerY = pointer.y;
      this.scrollStartCameraY = camera.scrollY;
      this.scrollGestureDragged = false;
      this.lastScrollSampleY = pointer.y;
      this.lastScrollSampleAtMs = performance.now();
    };
    const handlePointerMove = (pointer: Phaser.Input.Pointer): void => {
      if (this.scrollPointerId !== pointer.id || !pointer.isDown) return;

      const sampleAtMs = performance.now();
      const sampleElapsedMs = sampleAtMs - this.lastScrollSampleAtMs;
      const sampleVelocityY = getMetaScrollVelocity(
        this.lastScrollSampleY,
        pointer.y,
        sampleElapsedMs,
        this.scrollVelocityY,
      );
      this.lastScrollSampleY = pointer.y;
      this.lastScrollSampleAtMs = sampleAtMs;

      if (!this.scrollGestureDragged) {
        this.scrollGestureDragged = isMetaScrollDrag(this.scrollStartPointerY, pointer.y);
      }
      if (!this.scrollGestureDragged) return;

      this.scrollVelocityY = sampleVelocityY;
      const dragDelta = pointer.y - this.scrollStartPointerY;
      applyScrollY(this.scrollStartCameraY - dragDelta);
    };
    const handlePointerUp = (pointer: Phaser.Input.Pointer): void => {
      if (this.scrollPointerId !== pointer.id) return;
      if (this.scrollGestureDragged) {
        this.lastDraggedPointerId = pointer.id;
        this.lastDragEndedAtMs = Date.now();
        if (performance.now() - this.lastScrollSampleAtMs > 100) {
          this.scrollVelocityY = 0;
        }
      } else {
        this.scrollVelocityY = 0;
      }
      this.scrollPointerId = null;
      this.scrollGestureDragged = false;
    };

    const handleSmoothWheelUpdate = (_time: number, delta: number): void => {
      if (this.scrollPointerId === null && this.scrollVelocityY !== 0) {
        const inertia = stepMetaScrollInertia(
          camera.scrollY,
          this.scrollVelocityY,
          delta,
          this.scrollMaxY,
        );
        camera.scrollY = inertia.scrollY;
        this.scrollVelocityY = inertia.velocityY;
        wheelTargetY = camera.scrollY;
        syncScrollbar();
        return;
      }

      const remaining = wheelTargetY - camera.scrollY;
      if (Math.abs(remaining) > WHEEL_SCROLL_SNAP_EPSILON) {
        const normalizedDelta = Math.max(0, delta) / (1000 / 60);
        const frameEase = 1 - Math.pow(1 - WHEEL_SCROLL_EASE, normalizedDelta);
        camera.scrollY = Phaser.Math.Linear(camera.scrollY, wheelTargetY, frameEase);
      } else if (camera.scrollY !== wheelTargetY) {
        camera.scrollY = wheelTargetY;
      }
      syncScrollbar();
    };

    this.input.on('wheel', handleWheel);
    this.input.on('pointerdown', handlePointerDown);
    this.input.on('pointermove', handlePointerMove);
    this.input.on('pointerup', handlePointerUp);
    this.input.on('pointerupoutside', handlePointerUp);

    this.events.on(Phaser.Scenes.Events.UPDATE, handleSmoothWheelUpdate);
    syncScrollbar();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('wheel', handleWheel);
      this.input.off('pointerdown', handlePointerDown);
      this.input.off('pointermove', handlePointerMove);
      this.input.off('pointerup', handlePointerUp);
      this.input.off('pointerupoutside', handlePointerUp);
      this.events.off(Phaser.Scenes.Events.UPDATE, handleSmoothWheelUpdate);
    });
  }

  private createScrollIndicator(
    layout: LevelSelectLayout,
  ): {
    readonly trackY: number;
    readonly trackHeight: number;
    readonly thumbHeight: number;
    readonly thumbVisual: Phaser.GameObjects.Graphics;
    readonly thumbHitArea: Phaser.GameObjects.Zone;
    readonly trackHitArea: Phaser.GameObjects.Zone;
    readonly interactionLeft: number;
  } {
    const gridTop = layout.cards.length === 0
      ? layout.headerBottom
      : layout.cards[0].y - layout.cards[0].height / 2;
    const viewportInset = 18;
    const trackTop = Math.max(gridTop, layout.progressBarY + 28);
    const availableViewport = this.getAvailableViewport();
    const trackBottom = availableViewport.bottom - viewportInset;
    const trackHeight = Math.max(72, trackBottom - trackTop);
    const trackWidth = 5;
    const thumbWidth = 7;
    const gridRight = layout.cards.reduce(
      (right, card) => Math.max(right, card.x + card.width / 2),
      availableViewport.centerX,
    );
    const x = Math.min(availableViewport.right - 15, gridRight + 24);
    const totalScrollableHeight = this.scrollMaxY + availableViewport.height;
    const naturalThumbHeight = Math.round(trackHeight * (availableViewport.height / totalScrollableHeight));
    const maxThumbHeight = Math.max(32, Math.round(trackHeight * SCROLLBAR_THUMB_MAX_RATIO));
    const thumbHeight = Math.min(maxThumbHeight, Math.max(32, naturalThumbHeight));

    this.createScrollbarCapsule(
      x,
      trackTop + trackHeight / 2,
      trackWidth,
      trackHeight,
      SCROLLBAR_TRACK_FILL,
      0.78,
      0x64758b,
      0.28,
    ).setScrollFactor(0).setDepth(2000);

    const thumbVisual = this.createScrollbarCapsule(
      x,
      trackTop + thumbHeight / 2,
      thumbWidth,
      thumbHeight,
      SCROLLBAR_THUMB_FILL,
      0.94,
      0xe2c488,
      0.28,
    ).setScrollFactor(0).setDepth(2002);

    const trackHitArea = this.add.zone(
      x,
      trackTop + trackHeight / 2,
      SCROLLBAR_HIT_WIDTH,
      trackHeight,
    ).setScrollFactor(0).setDepth(2001).setInteractive({ useHandCursor: true });

    const thumbHitArea = this.add.zone(
      x,
      trackTop + thumbHeight / 2,
      SCROLLBAR_HIT_WIDTH,
      Math.max(44, thumbHeight),
    ).setScrollFactor(0).setDepth(2003).setInteractive({ useHandCursor: true });

    return {
      trackY: trackTop,
      trackHeight,
      thumbHeight,
      thumbVisual,
      thumbHitArea,
      trackHitArea,
      interactionLeft: x - SCROLLBAR_HIT_WIDTH / 2,
    };
  }

  private createScrollbarCapsule(
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: number,
    fillAlpha: number,
    strokeColor: number,
    strokeAlpha: number,
  ): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics();
    const radius = Math.min(width / 2, height / 2);
    graphics.fillStyle(fillColor, fillAlpha);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    graphics.lineStyle(1, strokeColor, strokeAlpha);
    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
    graphics.setPosition(x, y);
    return graphics;
  }

  private shouldActivatePointer(pointer: Phaser.Input.Pointer): boolean {
    if (!this.pointerGate.canActivate(pointer.id)) return false;
    if (this.scrollPointerId === pointer.id && this.scrollGestureDragged) return false;
    if (this.mobileSwipePointerId === pointer.id && this.mobileSwipeDragged) return false;
    return !(
      this.lastDraggedPointerId === pointer.id
      && Date.now() - this.lastDragEndedAtMs < 160
    );
  }

  private getProfileService(): PlayerProfileService {
    const service = this.registry.get(PLAYER_PROFILE_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof PlayerProfileService)) {
      throw new Error('LevelSelectScene requires PlayerProfileService in Phaser registry.');
    }
    return service;
  }

  private getTutorialService(): TutorialService {
    const service = this.registry.get(TUTORIAL_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof TutorialService)) {
      throw new Error('LevelSelectScene requires TutorialService in Phaser registry.');
    }
    return service;
  }

  private getCampaignService(): CampaignService {
    const service = this.registry.get(CAMPAIGN_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof CampaignService)) {
      throw new Error('LevelSelectScene requires CampaignService in Phaser registry.');
    }
    return service;
  }

  private async launchTutorial(service: TutorialService, entry: TutorialLevelEntry): Promise<void> {
    if (this.launchPending || !service.canPlayLevel(entry.id)) return;
    this.launchPending = true;

    try {
      const startedEntry = await service.startLevel(entry.id);
      this.scene.start('GameScene', createTutorialGameSceneData(startedEntry));
    } catch (error) {
      this.launchPending = false;
      console.error(`[Dungeon Logic] Could not start ${entry.id}.`, error);
    }
  }

  private async launchLevel(service: CampaignService, entry: CampaignLevelEntry): Promise<void> {
    if (this.launchPending || !service.canPlayLevel(entry.id)) return;
    this.launchPending = true;

    try {
      const startedEntry = await service.startLevel(entry.id);
      const data = createCampaignGameSceneData(startedEntry, service.getProgress());
      this.scene.start('GameScene', data);
    } catch (error) {
      this.launchPending = false;
      console.error(`[Dungeon Logic] Could not start ${entry.id}.`, error);
    }
  }
}
