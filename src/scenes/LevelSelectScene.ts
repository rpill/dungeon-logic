import Phaser from 'phaser';

import { ANALYTICS_SERVICE_REGISTRY_KEY, type AnalyticsService } from '../analytics/AnalyticsService';

import { getAudioFeedback } from '../audio/AudioFeedbackService';
import { getUiCopy } from '../i18n/UiCopy';

import { CAMPAIGN_SERVICE_REGISTRY_KEY, CampaignService } from '../campaign/CampaignService';
import type { CampaignLevelEntry } from '../content/campaign/types';
import type { TutorialLevelEntry } from '../content/tutorial/types';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import { createCampaignLevelPreview, type CampaignLevelPreview } from '../runtime/CampaignLevelPreview';
import {
  createCampaignGameSceneData,
  createLevelSelectItems,
  createTutorialGameSceneData,
} from '../runtime/GameLaunch';
import { createHomeMenuButton, type HomeMenuButtonHandle } from '../runtime/HomeMenuButton';
import { createMetaPageHeader } from '../runtime/MetaPageHeader';
import { MetaPointerGate } from '../runtime/MetaPointerGate';
import { HOME_SCENE_KEY } from '../runtime/MetaSelectors';
import {
  clampMetaScrollY,
  getMetaScrollMaxY,
  getMetaScrollVelocity,
  isMetaScrollDrag,
  stepMetaScrollInertia,
} from '../runtime/MetaScroll';
import { calculateLevelSelectLayout, type LevelCardLayout, type LevelSelectLayout } from '../runtime/ResponsiveLayout';
import { createSceneBackground } from '../runtime/SceneBackground';
import { TUTORIAL_SERVICE_REGISTRY_KEY, TutorialService } from '../tutorial/TutorialService';
import { UI_ICON_KEYS } from '../runtime/UiIcons';
import { drawLevelThumbnail } from '../view/LevelThumbnailRenderer';

const STATE_COLOR = {
  completed: '#73d0bd',
  current: '#f0bd63',
  unlocked: '#f4ead7',
  locked: '#7f8ba2',
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

const PROGRESS_TRACK_FILL = 0x1f4375;
const PROGRESS_AVAILABLE_FILL = 0x2fd0bf;
const PROGRESS_FILL = 0xf0bd63;
const SECTION_LINE_COLOR = 0xf0bd63;
const SCROLLBAR_TRACK_FILL = 0x29466f;
const SCROLLBAR_THUMB_FILL = 0xf0bd63;
const SCROLLBAR_THUMB_MAX_RATIO = 0.36;
const SCROLLBAR_HIT_WIDTH = 30;
const WHEEL_SCROLL_SCALE = 0.32;
const WHEEL_SCROLL_MAX_STEP = 44;
const WHEEL_SCROLL_EASE = 0.18;
const WHEEL_SCROLL_SNAP_EPSILON = 0.15;
const CARD_RADIUS = 8;
const CURRENT_GLOW_TEXTURE_SCALE = 3;

type LevelSelectState = keyof typeof STATE_COLOR;

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
  private readonly pointerGate = new MetaPointerGate();

  constructor() {
    super('LevelSelectScene');
  }

  create(): void {
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
    const layout = calculateLevelSelectLayout(
      this.scale.width,
      this.scale.height,
      items.length,
    );
    this.contentBottom = layout.contentBottom;

    createMetaPageHeader(this, {
      title: copy.common.levels,
      backLabel: copy.common.backHome,
      backButton: true,
      fixedBack: true,
      onBack: (pointer) => {
        if (!this.shouldActivatePointer(pointer)) return;
        this.scene.start(HOME_SCENE_KEY);
      },
    });

    if (!profile.tutorial.completed) {
      const tutorialEntry = tutorial.getContinueLevel() ?? tutorial.getLevels()[0];
      if (tutorialEntry !== undefined) {
        this.createActionButton(
          this.scale.width / 2,
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
          this.scale.width / 2,
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
    this.drawLevelSectionDividers(layout, items.length);

    items.forEach((item, index) => {
      const cardLayout = layout.cards[index];
      const color = STATE_COLOR[item.state];
      const preview = createCampaignLevelPreview(item.entry, profile.campaign);
      const cardTone = STATE_FILL[item.state];
      const strokeColor = Phaser.Display.Color.HexStringToColor(color).color;

      if (item.state === 'current') {
        this.drawCurrentGlow(cardLayout, strokeColor);
      }

      this.drawRoundedCardShape(
        cardLayout.x,
        cardLayout.y + 3,
        cardLayout.width,
        cardLayout.height,
        0x040912,
        item.state === 'locked' ? 0.16 : 0.22,
        0x000000,
        0,
        0,
        CARD_RADIUS,
      );

      this.drawRoundedCardShape(
        cardLayout.x,
        cardLayout.y,
        cardLayout.width,
        cardLayout.height,
        cardTone.color,
        cardTone.alpha,
        strokeColor,
        item.state === 'locked' ? 0.72 : 0.96,
        item.state === 'current' ? 3 : 2.5,
        CARD_RADIUS,
      );

      this.drawLevelPreview(item.entry, preview, cardLayout, item.state);
      this.drawLevelStateMarkers(item.state, cardLayout);

      this.add.text(
        cardLayout.x,
        cardLayout.numberY,
        String(item.entry.slot),
        {
          fontFamily: 'monospace',
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
            getAudioFeedback(this).play('ui-hover');
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
    this.setupMetaScroll(layout);

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
    this.add.text(this.scale.width / 2, layout.progressLabelY, label, {
      fontFamily: 'monospace',
      fontSize: `${layout.progressLabelFontSize}px`,
      color: '#e7edf8',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const trackX = this.scale.width / 2 - layout.progressBarWidth / 2;
    const radius = layout.progressBarHeight / 2;
    const safeTotal = Math.max(1, totalCount);
    const completedWidth = completedCount <= 0
      ? 0
      : Math.max(layout.progressBarHeight * 2, Math.round(layout.progressBarWidth * (completedCount / safeTotal)));
    const availableCount = Math.max(0, Math.min(3, totalCount - completedCount));
    const availableReachWidth = availableCount <= 0
      ? 0
      : Math.max(
          layout.progressBarHeight * 2,
          Math.round(layout.progressBarWidth * ((completedCount + availableCount) / safeTotal)),
        );

    const bar = this.add.graphics();
    bar.fillStyle(PROGRESS_TRACK_FILL, 0.88);
    bar.fillRoundedRect(
      trackX,
      layout.progressBarY - layout.progressBarHeight / 2,
      layout.progressBarWidth,
      layout.progressBarHeight,
      radius,
    );

    if (availableReachWidth > 0) {
      bar.fillStyle(PROGRESS_AVAILABLE_FILL, 0.96);
      bar.fillRoundedRect(
        trackX,
        layout.progressBarY - layout.progressBarHeight / 2,
        Math.min(layout.progressBarWidth, availableReachWidth),
        layout.progressBarHeight,
        radius,
      );
    }

    if (completedWidth > 0) {
      bar.fillStyle(PROGRESS_FILL, 0.98);
      bar.fillRoundedRect(
        trackX,
        layout.progressBarY - layout.progressBarHeight / 2,
        Math.min(layout.progressBarWidth, completedWidth),
        layout.progressBarHeight,
        radius,
      );
    }
  }

  private drawLevelSectionDividers(layout: LevelSelectLayout, itemCount: number): void {
    if (itemCount <= 8 || layout.cards.length === 0) return;

    const rowsPerBlock = Math.max(1, Math.ceil(8 / layout.columns));
    const totalRows = Math.ceil(itemCount / layout.columns);
    const gridWidth = this.getGridWidth(layout);
    const lineWidth = Math.max(24, (gridWidth - 36) / 2);
    const centerX = this.scale.width / 2;

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
        Math.max(1, cardLayout.width - 6),
        Math.max(1, cardLayout.height - 6),
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

  private drawCurrentGlow(cardLayout: LevelCardLayout, strokeColor: number): void {
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

    this.add.image(cardLayout.x, cardLayout.y, textureKey)
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
    color: string,
    onActivate: () => void,
  ): void {
    const button = createHomeMenuButton(this, {
      x,
      y,
      width,
      height,
      label,
      labelColor: color,
      icon: 'play',
      accentFrame: true,
      onActivate: (pointer) => {
        if (!this.shouldActivatePointer(pointer)) return;
        onActivate();
      },
    });
    this.centerActionButtonContent(button, x, y);
  }

  private centerActionButtonContent(button: HomeMenuButtonHandle, x: number, y: number): void {
    const gap = this.scale.width < 700 ? 10 : 12;
    const contentWidth = button.icon.displayWidth + gap + button.label.width;
    const startX = x - contentWidth / 2;
    button.icon.setPosition(startX + button.icon.displayWidth / 2, y);
    button.label.setPosition(startX + button.icon.displayWidth + gap, y);
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

  private setupMetaScroll(layout: LevelSelectLayout): void {
    this.scrollMaxY = getMetaScrollMaxY(this.scale.height, this.contentBottom);
    if (this.scrollMaxY <= 0) return;

    const camera = this.cameras.main;
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
    const trackBottom = this.scale.height - viewportInset;
    const trackHeight = Math.max(72, trackBottom - trackTop);
    const trackWidth = 7;
    const thumbWidth = 10;
    const x = this.scale.width - 15;
    const totalScrollableHeight = this.scrollMaxY + this.scale.height;
    const naturalThumbHeight = Math.round(trackHeight * (this.scale.height / totalScrollableHeight));
    const maxThumbHeight = Math.max(32, Math.round(trackHeight * SCROLLBAR_THUMB_MAX_RATIO));
    const thumbHeight = Math.min(maxThumbHeight, Math.max(32, naturalThumbHeight));

    this.createScrollbarCapsule(
      x,
      trackTop + trackHeight / 2,
      trackWidth,
      trackHeight,
      SCROLLBAR_TRACK_FILL,
      0.68,
      0x5876a8,
      0.34,
    ).setScrollFactor(0).setDepth(2000);

    const thumbVisual = this.createScrollbarCapsule(
      x,
      trackTop + thumbHeight / 2,
      thumbWidth,
      thumbHeight,
      SCROLLBAR_THUMB_FILL,
      0.98,
      0xffe29b,
      0.42,
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
