import Phaser from 'phaser';

import { ANALYTICS_SERVICE_REGISTRY_KEY, type AnalyticsService } from '../analytics/AnalyticsService';
import { getUiCopy } from '../i18n/UiCopy';
import { formatMasterRating } from '../mastery/MasterRating';
import {
  MASTERY_RANK_IDS,
  getMasteryRankIndex,
  getMasterySnapshot,
  type MasteryRankId,
  type MasteryRequirementProgress,
} from '../mastery/MasteryProgress';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import { calculateAvailableViewport, readCssSafeAreaInsets } from '../runtime/AvailableViewport';
import { HOME_SCENE_KEY, MASTERY_SCENE_KEY } from '../runtime/MetaSelectors';
import { createHeaderActionButton, getHeaderActionButtonMetrics, getHeaderActionPlacement, getHeaderBackButtonPresentation } from '../runtime/HeaderActionButton';
import { calculateMetaPageHeaderMetrics } from '../runtime/MetaPageHeaderLayout';
import { createMaterialActionButton } from '../runtime/MaterialActionButton';
import { createMasteryEdgeGlow, createMasteryGlow, createMasterySeal } from '../runtime/MasterySeal';
import { calculateMasteryDesktopLayout, type MasteryDesktopLayout } from '../runtime/MasteryDesktopLayout';
import { createSceneBackground } from '../runtime/SceneBackground';
import { createMasteryRequirementPanel } from '../runtime/MasteryRequirementPanel';
import { MASTER_RATING_LEADERBOARD_SCENE_KEY } from './MasterRatingLeaderboardScene';
import { UI_ICON_KEYS } from '../runtime/UiIcons';
import { resolveUiDensity, type UiDensity } from '../ui/UiDensity';
import { createMasteryRequirementRowPanel } from '../runtime/MasteryRequirementRowPanel';
import { createUiProgressBar } from '../ui/UiProgressBar';
import { createUiSceneHeader } from '../ui/UiSceneHeader';
import { createUiTextStyle } from '../ui/UiText';
import { UI_THEME } from '../ui/UiTheme';

export class MasteryScene extends Phaser.Scene {
  private uiDensity: UiDensity = 'comfortable';

  constructor() {
    super(MASTERY_SCENE_KEY);
  }

  create(): void {
    const background = createSceneBackground(this, 'meta');
    const profile = this.getProfileService().getProfile();
    const copy = getUiCopy(profile.settings.language);
    const mastery = getMasterySnapshot(profile);
    const masterRatingLabel = mastery.currentRank === 'MASTER'
      ? formatMasterRating(profile.mastery.rating, profile.settings.language)
      : undefined;
    const analytics = this.registry.get(ANALYTICS_SERVICE_REGISTRY_KEY) as AnalyticsService | undefined;
    analytics?.masteryOpen(mastery.currentRank);

    const viewport = calculateAvailableViewport(this.scale.width, this.scale.height, readCssSafeAreaInsets());
    const density = resolveUiDensity(this.scale.width, this.scale.height);
    this.uiDensity = density;
    const narrow = viewport.width < 680;

    const headerMetrics = calculateMetaPageHeaderMetrics(viewport.width, viewport.height);
    const actionMetrics = getHeaderActionButtonMetrics(headerMetrics.narrow);
    const backPresentation = getHeaderBackButtonPresentation(headerMetrics.narrow, copy.common.back);
    const backPlacement = getHeaderActionPlacement(viewport, 'left', backPresentation.width, actionMetrics.height);
    createHeaderActionButton(this, {
      x: backPlacement.x,
      y: backPlacement.y,
      width: backPresentation.width,
      height: actionMetrics.height,
      radius: actionMetrics.radius,
      iconKey: 'ui-icon-back',
      iconSize: actionMetrics.iconSize,
      label: backPresentation.label,
      fontSize: actionMetrics.fontSize,
      gap: actionMetrics.gap,
      onActivate: () => this.scene.start(HOME_SCENE_KEY),
    });
    createUiSceneHeader(this, {
      x: viewport.centerX,
      y: viewport.y + headerMetrics.titleY,
      label: copy.mastery.title,
      density,
      maxWidth: Math.max(160, viewport.width - backPresentation.width * 2 - 64),
    });

    const maxWidth = narrow ? Math.min(420, viewport.width - 26) : Math.min(1120, viewport.width - 96);
    const top = viewport.y + headerMetrics.headerHeight + (narrow ? 12 : 18);

    if (narrow) {
      this.renderMobileLayout(viewport.centerX, top, maxWidth, mastery, copy, masterRatingLabel);
    } else {
      this.renderDesktopLayout(viewport.centerX, top, maxWidth, Math.max(1, viewport.bottom - top - 8), mastery, copy, masterRatingLabel);
    }

    const handleResize = (): void => {
      background.sync();
      if (this.scene.isActive()) {
        this.scene.restart();
      }
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
    });
  }

  private renderDesktopLayout(
    centerX: number,
    top: number,
    width: number,
    availableHeight: number,
    mastery: ReturnType<typeof getMasterySnapshot>,
    copy: ReturnType<typeof getUiCopy>,
    masterRatingLabel?: string,
  ): void {
    const layout = calculateMasteryDesktopLayout(availableHeight);
    const short = availableHeight < 610;
    const panelWidth = width * 0.57;
    const panelX = centerX + width * 0.205;
    const panelTop = top + (short ? 18 : Math.min(112, availableHeight * 0.12));
    const panelHeight = mastery.nextRank === null
      ? Math.min(short ? 285 : 340, availableHeight - 112)
      : Math.min(short ? 330 : 505, availableHeight * 0.61);
    const sealX = centerX - width * 0.285;
    const sealSize = Math.min(short ? 190 : 300, availableHeight * (short ? 0.35 : 0.36));
    const sealY = panelTop + Math.min(panelHeight * 0.43, 225);
    createMasteryGlow(this, { x: sealX, y: sealY - sealSize * 0.07, size: sealSize * 0.82, alpha: 0.28, variant: 'page' });
    createMasteryEdgeGlow(this, { x: sealX, y: sealY, size: sealSize, rank: mastery.currentRank, alpha: 0.28 });
    createMasterySeal(this, { x: sealX, y: sealY, size: sealSize, rank: mastery.currentRank, plaqueLabel: masterRatingLabel });

    this.add.text(sealX, sealY - sealSize * 0.57, copy.mastery.rankKicker(mastery.currentRank), {
      ...createUiTextStyle('meta', this.uiDensity, { color: UI_THEME.colors.border.bright, fontStyle: 'bold' }),
      fontSize: `${Math.max(15, Math.round(layout.rankLabelFontSize))}px`,
    }).setOrigin(0.5);
    const rankTitle = this.add.text(sealX, sealY + sealSize * 0.54, copy.mastery.rankTitles[mastery.currentRank], {
      ...createUiTextStyle('heading', this.uiDensity),
      fontSize: `${Math.max(22, Math.round(layout.rankTitleFontSize))}px`,
    }).setOrigin(0.5);
    this.fitTextWidth(rankTitle, width * 0.39, 18);
    this.add.text(sealX, rankTitle.y + (short ? 38 : 48), `«${copy.mastery.rankDescriptions[mastery.currentRank]}»`, {
      ...createUiTextStyle('body', this.uiDensity, { color: UI_THEME.colors.text.secondary }),
      fontSize: `${Math.max(13, Math.round(layout.descriptionFontSize))}px`,
      wordWrap: { width: width * 0.39 },
      align: 'center',
    }).setOrigin(0.5, 0);

    this.renderRequirementPanel(panelX, panelTop, panelWidth, panelHeight, mastery, copy, false, masterRatingLabel, layout);

    const pathTop = Math.min(top + availableHeight - 66, panelTop + panelHeight + (short ? 24 : 42));
    this.renderRankTrack(centerX, pathTop, width, layout.pathHeight, mastery.currentRank, false, copy, layout);
  }

  private renderMobileLayout(
    centerX: number,
    top: number,
    width: number,
    mastery: ReturnType<typeof getMasterySnapshot>,
    copy: ReturnType<typeof getUiCopy>,
    masterRatingLabel?: string,
  ): void {
    const sealSize = Math.min(164, width * 0.43);
    const sealX = centerX;
    const sealY = top + 100;
    createMasteryGlow(this, { x: sealX, y: sealY - sealSize * 0.07, size: sealSize * 0.82, alpha: 0.24, variant: 'page' });
    createMasteryEdgeGlow(this, { x: sealX, y: sealY, size: sealSize, rank: mastery.currentRank, alpha: 0.24 });
    createMasterySeal(this, { x: sealX, y: sealY, size: sealSize, rank: mastery.currentRank, plaqueLabel: masterRatingLabel });

    this.add.text(centerX, top + 5, copy.mastery.rankKicker(mastery.currentRank), createUiTextStyle('meta', this.uiDensity, {
      color: UI_THEME.colors.border.bright, fontStyle: 'bold',
    })).setOrigin(0.5);
    const rankTitle = this.add.text(centerX, top + 190, copy.mastery.rankTitles[mastery.currentRank], createUiTextStyle('heading', this.uiDensity)).setOrigin(0.5);
    this.fitTextWidth(rankTitle, width - 40, 16);
    this.add.text(centerX, top + 221, `«${copy.mastery.rankDescriptions[mastery.currentRank]}»`, {
      ...createUiTextStyle('body', this.uiDensity, { color: UI_THEME.colors.text.secondary }),
      wordWrap: { width: width - 56 },
      align: 'center',
      lineSpacing: 2,
    }).setOrigin(0.5, 0);

    const panelTop = top + 270;
    const panelHeight = mastery.nextRank === null
      ? 230
      : 170 + Math.max(0, Math.min(3, mastery.conditions.length) - 1) * 70;
    this.renderRequirementPanel(centerX, panelTop, width, panelHeight, mastery, copy, true, masterRatingLabel);
    this.renderRankTrack(centerX, panelTop + panelHeight + 10, width, 100, mastery.currentRank, true, copy);
  }

  private renderRequirementPanel(
    centerX: number,
    topY: number,
    width: number,
    height: number,
    mastery: ReturnType<typeof getMasterySnapshot>,
    copy: ReturnType<typeof getUiCopy>,
    narrow: boolean,
    masterRatingLabel?: string,
    desktopLayout?: MasteryDesktopLayout,
  ): void {
    createMasteryRequirementPanel(
      this,
      centerX,
      topY + height / 2,
      width,
      height,
    ).setDepth(0).setAlpha(0.98);

    const title = mastery.nextRank === null
      ? copy.mastery.maxRank
      : `${copy.mastery.nextRank} (${mastery.nextRank})`;
    this.add.text(centerX, topY + (narrow ? 34 : 49), title, {
      ...createUiTextStyle('bodyStrong', this.uiDensity, { align: 'center' }),
      fontSize: `${Math.max(UI_THEME.typography.bodyStrong[this.uiDensity], Math.round(narrow ? UI_THEME.typography.bodyStrong[this.uiDensity] : desktopLayout?.panelTitleFontSize ?? 18))}px`,
    }).setOrigin(0.5);

    if (mastery.nextRank === null && masterRatingLabel !== undefined) {
      this.add.text(centerX, topY + height * (narrow ? 0.43 : 0.4), copy.mastery.rating(masterRatingLabel), {
        ...createUiTextStyle('heading', this.uiDensity, { color: UI_THEME.colors.semantic.gold, align: 'center' }),
      }).setOrigin(0.5);

      const buttonWidth = Math.min(width * 0.72, narrow ? 280 : 360);
      const button = createMaterialActionButton(this, {
        x: centerX,
        y: topY + height * (narrow ? 0.68 : 0.64),
        width: buttonWidth,
        height: narrow ? 54 : 60,
        label: copy.mastery.ratingLeaderboard,
        variant: 'secondary',
        onActivate: () => this.scene.start(MASTER_RATING_LEADERBOARD_SCENE_KEY),
      });
      button.surface.setDepth(40);
      button.label.setDepth(41);
      button.icon?.setDepth(41);
      return;
    }

    const visibleConditions = mastery.conditions.slice(0, 3);
    const rowHeight = narrow ? 62 : Math.min(78, Math.max(62, height * 0.18));
    const rowGap = rowHeight + (narrow ? 8 : 10);
    const contentSpan = visibleConditions.length * rowHeight + Math.max(0, visibleConditions.length - 1) * (rowGap - rowHeight);
    const rowTop = topY + Math.max(narrow ? 90 : 120, (height - contentSpan) / 2 + rowHeight / 2);
    visibleConditions.forEach((condition, index) => {
      this.renderRequirementRow(centerX, rowTop + rowGap * index, width * 0.88, rowHeight, index, condition, copy, narrow, desktopLayout);
    });
  }

  private renderRequirementRow(
    centerX: number,
    y: number,
    width: number,
    rowHeight: number,
    rowIndex: number,
    condition: MasteryRequirementProgress,
    copy: ReturnType<typeof getUiCopy>,
    narrow: boolean,
    desktopLayout?: MasteryDesktopLayout,
  ): void {
    const left = centerX - width / 2;
    const right = centerX + width / 2;
    const complete = condition.complete;
    const rowDepth = 20 + rowIndex * 4;

    createMasteryRequirementRowPanel(this, centerX, y, width, rowHeight, rowDepth);

    const iconKey = this.conditionIconKey(condition);
    const iconX = left + (narrow ? 30 : 38);
    const iconSize = narrow ? 22 : desktopLayout?.iconSize ?? 29;
    const textLeft = left + (narrow ? 50 : desktopLayout?.textLeftInset ?? 66);
    const statusX = right - (narrow ? 28 : desktopLayout?.statusRightInset ?? 36);
    const barRight = statusX - (narrow ? 16 : desktopLayout?.barStatusGap ?? 22);
    const valueX = barRight;
    const headerY = y - rowHeight * (narrow ? 0.15 : 0.16);
    const barY = y + rowHeight * (narrow ? 0.11 : 0.12);

    this.add.image(iconX, y, iconKey).setDisplaySize(iconSize, iconSize).setTint(UI_THEME.colors.text.primary).setDepth(rowDepth + 1);

    const label = this.requirementLabel(condition, copy, narrow);
    const rowTextColor = complete ? UI_THEME.colors.semantic.goldBright : UI_THEME.colors.text.primary;
    const labelText = this.add.text(textLeft, headerY, label, {
      ...createUiTextStyle('bodyStrong', this.uiDensity, { color: rowTextColor }),
      fontSize: `${Math.max(UI_THEME.typography.bodyStrong[this.uiDensity], Math.round(narrow ? UI_THEME.typography.bodyStrong[this.uiDensity] : desktopLayout?.rowFontSize ?? 18))}px`,
    }).setOrigin(0, 0.5).setDepth(rowDepth + 1);
    this.fitTextWidth(labelText, Math.max(80, valueX - textLeft - 64), 10);

    this.add.text(valueX, headerY, `${condition.current} / ${condition.target}`, {
      ...createUiTextStyle('bodyStrong', this.uiDensity, { color: rowTextColor, fontStyle: 'bold' }),
      fontSize: `${Math.max(UI_THEME.typography.bodyStrong[this.uiDensity], Math.round(narrow ? UI_THEME.typography.bodyStrong[this.uiDensity] : desktopLayout?.rowFontSize ?? 18))}px`,
    }).setOrigin(1, 0.5).setDepth(rowDepth + 1);

    const barLeft = textLeft;
    const barWidth = barRight - barLeft;
    this.drawRequirementProgress(barLeft, barY, barWidth, narrow ? 9 : desktopLayout?.barHeight ?? 11, condition.current, condition.target, complete, rowDepth + 1);

    const statusY = y;
    const marker = this.add.graphics().setDepth(rowDepth + 1);
    marker.lineStyle(narrow ? 2.4 : 3.0, complete ? UI_THEME.colors.semantic.success : UI_THEME.colors.border.bright, 1);
    marker.strokeCircle(statusX, statusY, narrow ? 12 : desktopLayout?.statusRadius ?? 15);
    if (complete) {
      marker.fillStyle(UI_THEME.colors.semantic.success, 1);
      marker.fillCircle(statusX, statusY, narrow ? 8.5 : desktopLayout?.statusFillRadius ?? 10.2);
      this.add.image(statusX, statusY, UI_ICON_KEYS.check)
        .setDisplaySize(narrow ? 11 : desktopLayout?.checkSize ?? 14, narrow ? 11 : desktopLayout?.checkSize ?? 14)
        .setTint(UI_THEME.colors.background.deep).setDepth(rowDepth + 2);
    }
  }

  private drawRequirementProgress(
    left: number,
    y: number,
    width: number,
    height: number,
    current: number,
    target: number,
    _complete: boolean,
    depth = 0,
  ): void {
    createUiProgressBar(this, {
      x: left + width / 2,
      y,
      width,
      height,
      current,
      target,
      depth,
      fillEndColor: UI_THEME.colors.semantic.goldBright,
    });
  }

  private renderRankTrack(
    centerX: number,
    topY: number,
    width: number,
    _height: number,
    currentRank: MasteryRankId,
    narrow: boolean,
    _copy: ReturnType<typeof getUiCopy>,
    desktopLayout?: MasteryDesktopLayout,
  ): void {
    const currentIndex = getMasteryRankIndex(currentRank);
    // Leave room for the first numeral and the full MASTER label at phone edges.
    const trackWidth = narrow ? Math.max(1, width - 48) : width * 0.92;
    const startX = centerX - trackWidth / 2;
    const step = trackWidth / (MASTERY_RANK_IDS.length - 1);
    const lineY = topY + (narrow ? 18 : desktopLayout?.rankTrackLineOffsetY ?? 23);
    const labelY = topY + (narrow ? 42 : desktopLayout?.rankTrackLabelOffsetY ?? 51);

    const path = this.add.graphics();
    path.lineStyle(narrow ? 2 : 2.2, UI_THEME.colors.border.normal, 0.95);
    path.lineBetween(startX, lineY, startX + step * (MASTERY_RANK_IDS.length - 1), lineY);
    path.lineStyle(narrow ? 2.8 : 3.2, UI_THEME.colors.semantic.gold, 1);
    path.lineBetween(startX, lineY, startX + step * currentIndex, lineY);

    MASTERY_RANK_IDS.forEach((rank, index) => {
      const x = startX + step * index;
      const isPast = index < currentIndex;
      const isCurrent = index === currentIndex;
      const isFuture = index > currentIndex;
      const isMaster = rank === 'MASTER';
      const nodeRadius = narrow ? 5 : 6;
      const currentRadius = isMaster ? (narrow ? 13 : 16) : (narrow ? 11 : 14);
      const futureRadius = isMaster ? nodeRadius + (narrow ? 4 : 5) : nodeRadius + (narrow ? 2 : 3);
      const pastRadius = isMaster ? nodeRadius + (narrow ? 4 : 5) : nodeRadius;
      const node = this.add.graphics();

      if (isPast) {
        node.fillStyle(UI_THEME.colors.semantic.gold, 1);
        node.lineStyle(isMaster ? 1.8 : 1.4, UI_THEME.colors.semantic.goldBright, 1);
        node.fillCircle(x, lineY, pastRadius);
        node.strokeCircle(x, lineY, pastRadius);
      } else if (isCurrent) {
        node.fillStyle(UI_THEME.colors.semantic.gold, 1);
        node.fillCircle(x, lineY, currentRadius);
        node.fillStyle(UI_THEME.colors.surface.base, 1);
        node.fillCircle(x, lineY, currentRadius - (narrow ? 1.15 : 1.45));
        node.fillStyle(UI_THEME.colors.semantic.gold, 1);
        node.fillCircle(x, lineY, isMaster ? (narrow ? 5 : 6) : (narrow ? 4 : 5));
      } else if (isFuture) {
        node.fillStyle(UI_THEME.colors.surface.base, 1);
        node.lineStyle(isMaster ? 1.8 : 1.4, UI_THEME.colors.border.normal, 1);
        node.fillCircle(x, lineY, futureRadius);
        node.strokeCircle(x, lineY, futureRadius);

        this.add.image(x, lineY, UI_ICON_KEYS.lock)
          .setDisplaySize(isMaster ? (narrow ? 10 : 12) : (narrow ? 8 : 10), isMaster ? (narrow ? 10 : 12) : (narrow ? 8 : 10))
          .setTint(UI_THEME.colors.text.muted)
          .setAlpha(0.9);
      }

      const rankLabel = this.add.text(x, labelY, rank === 'MASTER' ? 'MASTER' : rank, createUiTextStyle('meta', this.uiDensity, {
        color: isCurrent ? UI_THEME.colors.semantic.goldBright : isPast ? UI_THEME.colors.text.primary : UI_THEME.colors.text.muted,
        fontStyle: isCurrent ? 'bold' : 'normal',
        align: 'center',
      })).setOrigin(0.5).setFontSize(narrow ? 12 : 14);
      this.fitTextWidth(rankLabel, narrow && isMaster ? 52 : Math.max(24, step * 0.78), narrow && isMaster ? 12 : 11);
    });
  }


  private conditionIconKey(condition: MasteryRequirementProgress): string {
    switch (condition.metric) {
      case 'campaign':
        return 'home-menu-icon-levels';
      case 'daily-completed':
        return 'home-menu-icon-daily';
      case 'endless-completed':
        return 'home-menu-icon-endless';
    }
  }

  private requirementLabel(
    condition: MasteryRequirementProgress,
    copy: ReturnType<typeof getUiCopy>,
    _narrow: boolean,
  ): string {
    switch (condition.metric) {
      case 'campaign':
        return copy.mastery.campaign;
      case 'daily-completed':
        return copy.mastery.daily;
      case 'endless-completed':
        return copy.mastery.endless;
    }
  }

  private fitTextWidth(text: Phaser.GameObjects.Text, maxWidth: number, minFontSize: number): void {
    let fontSize = Number.parseFloat(String(text.style.fontSize));
    while (text.width > maxWidth && fontSize > minFontSize) {
      fontSize -= 1;
      text.setFontSize(fontSize);
    }
  }

  private getProfileService(): PlayerProfileService {
    const service = this.registry.get(PLAYER_PROFILE_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof PlayerProfileService)) {
      throw new Error('MasteryScene requires PlayerProfileService in Phaser registry.');
    }
    return service;
  }
}
