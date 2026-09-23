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
import { createCenteredTextMenuButton } from '../runtime/HomeMenuButton';
import { createMasteryEdgeGlow, createMasteryGlow, createMasterySeal } from '../runtime/MasterySeal';
import { calculateMasteryDesktopLayout, type MasteryDesktopLayout } from '../runtime/MasteryDesktopLayout';
import { createSceneBackground } from '../runtime/SceneBackground';
import { MASTER_RATING_LEADERBOARD_SCENE_KEY } from './MasterRatingLeaderboardScene';
import { UI_ICON_KEYS } from '../runtime/UiIcons';
import { resolveUiDensity, type UiDensity } from '../ui/UiDensity';
import { createUiInsetRow } from '../ui/UiInsetRow';
import { createUiPanel } from '../ui/UiPanel';
import { createUiProgressBar } from '../ui/UiProgressBar';
import { createUiSceneHeader } from '../ui/UiSceneHeader';
import { createUiTextStyle } from '../ui/UiText';
import { UI_THEME, uiColorHex } from '../ui/UiTheme';

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

    const maxWidth = narrow ? Math.min(420, viewport.width - 26) : Math.min(860, viewport.width - 70);
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
    const left = centerX - width / 2;
    const sealX = left + layout.sealOffsetX;
    const sealY = top + layout.sealOffsetY;
    createMasteryGlow(this, { x: sealX, y: sealY - layout.sealSize * 0.07, size: layout.sealSize * 0.82, alpha: 0.62, variant: 'page' });
    createMasteryEdgeGlow(this, { x: sealX, y: sealY, size: layout.sealSize, rank: mastery.currentRank, alpha: 0.5 });
    createMasterySeal(this, { x: sealX, y: sealY, size: layout.sealSize, rank: mastery.currentRank, plaqueLabel: masterRatingLabel });

    const textX = left + layout.textOffsetX;
    this.add.text(textX, top + layout.rankLabelOffsetY, `РАНГ ${mastery.currentRank}`, {
      ...createUiTextStyle('meta', this.uiDensity, { color: UI_THEME.colors.border.bright, fontStyle: 'bold' }),
      fontSize: `${Math.max(UI_THEME.typography.meta[this.uiDensity], Math.round(layout.rankLabelFontSize))}px`,
    });
    this.add.text(textX, top + layout.rankTitleOffsetY, copy.mastery.rankTitles[mastery.currentRank], {
      ...createUiTextStyle('heading', this.uiDensity),
      fontSize: `${Math.max(UI_THEME.typography.heading[this.uiDensity], Math.round(layout.rankTitleFontSize))}px`,
    });
    this.add.text(textX, top + layout.descriptionOffsetY, `«${copy.mastery.rankDescriptions[mastery.currentRank]}»`, {
      ...createUiTextStyle('body', this.uiDensity, { color: UI_THEME.colors.text.secondary }),
      fontSize: `${Math.max(UI_THEME.typography.body[this.uiDensity], Math.round(layout.descriptionFontSize))}px`,
      wordWrap: { width: width - layout.descriptionWidthInset },
    });

    const panelTop = top + layout.topSectionHeight + layout.cardGap;
    this.renderRequirementPanel(centerX, panelTop, width, layout.panelHeight, mastery, copy, false, masterRatingLabel, layout);

    const pathTop = panelTop + layout.panelHeight + layout.cardGap;
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
    const left = centerX - width / 2;
    const sealSize = Math.min(156, width * 0.4);
    const sealX = left + width * 0.22;
    const sealY = top + 80;
    createMasteryGlow(this, { x: sealX, y: sealY - sealSize * 0.07, size: sealSize * 0.82, alpha: 0.6, variant: 'page' });
    createMasteryEdgeGlow(this, { x: sealX, y: sealY, size: sealSize, rank: mastery.currentRank, alpha: 0.46 });
    createMasterySeal(this, { x: sealX, y: sealY, size: sealSize, rank: mastery.currentRank, plaqueLabel: masterRatingLabel });

    const textX = left + width * 0.43;
    const textWidth = width * 0.54;
    this.add.text(textX, top + 26, `РАНГ ${mastery.currentRank}`, createUiTextStyle('meta', this.uiDensity, {
      color: UI_THEME.colors.border.bright, fontStyle: 'bold',
    }));
    const rankTitle = this.add.text(textX, top + 51, copy.mastery.rankTitles[mastery.currentRank], createUiTextStyle('heading', this.uiDensity));
    this.fitTextWidth(rankTitle, textWidth, 16);
    this.add.text(textX, top + 84, `«${copy.mastery.rankDescriptions[mastery.currentRank]}»`, {
      ...createUiTextStyle('body', this.uiDensity, { color: UI_THEME.colors.text.secondary }),
      wordWrap: { width: textWidth },
      lineSpacing: 2,
    });

    const panelTop = top + 168;
    const panelHeight = 318;
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
    createUiPanel(this, {
      x: centerX,
      y: topY + height / 2,
      width,
      height,
      variant: 'panel',
    });

    const title = mastery.nextRank === null
      ? copy.mastery.maxRank
      : `${copy.mastery.nextRank} (${mastery.nextRank})`;
    this.add.text(centerX, topY + (narrow ? height * 0.155 : desktopLayout?.panelTitleOffsetY ?? height * 0.145), title, {
      ...createUiTextStyle('bodyStrong', this.uiDensity, { align: 'center' }),
      fontSize: `${Math.max(UI_THEME.typography.bodyStrong[this.uiDensity], Math.round(narrow ? UI_THEME.typography.bodyStrong[this.uiDensity] : desktopLayout?.panelTitleFontSize ?? 18))}px`,
    }).setOrigin(0.5);

    if (mastery.nextRank === null && masterRatingLabel !== undefined) {
      this.add.text(centerX, topY + height * (narrow ? 0.43 : 0.4), copy.mastery.rating(masterRatingLabel), {
        ...createUiTextStyle('heading', this.uiDensity, { color: UI_THEME.colors.semantic.gold, align: 'center' }),
      }).setOrigin(0.5);

      const buttonWidth = Math.min(width * 0.72, narrow ? 280 : 360);
      const button = createCenteredTextMenuButton(this, {
        x: centerX,
        y: topY + height * (narrow ? 0.68 : 0.64),
        width: buttonWidth,
        height: narrow ? 48 : 54,
        label: copy.mastery.ratingLeaderboard,
        labelColor: uiColorHex(UI_THEME.colors.text.primary),
        onActivate: () => this.scene.start(MASTER_RATING_LEADERBOARD_SCENE_KEY),
      });
      button.fill.setDepth(40);
      button.frame.setDepth(41);
      button.label.setDepth(42);
      return;
    }

    const visibleConditions = mastery.conditions.slice(0, 3);
    const rowHeight = narrow ? 62 : desktopLayout?.rowHeight ?? 78;
    const rowTop = topY + (narrow ? height * 0.355 : desktopLayout?.firstRowOffsetY ?? height * 0.335);
    const rowGap = narrow ? rowHeight + 8 : desktopLayout?.rowGap ?? rowHeight + 10;
    visibleConditions.forEach((condition, index) => {
      this.renderRequirementRow(centerX, rowTop + rowGap * index, width * 0.84, rowHeight, index, condition, copy, narrow, desktopLayout);
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

    createUiInsetRow(this, { x: centerX, y, width, height: rowHeight, depth: rowDepth });

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
    const trackWidth = width * (narrow ? 0.96 : 0.92);
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
      })).setOrigin(0.5);
      this.fitTextWidth(rankLabel, Math.max(24, step * 0.78), 10);
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
    narrow: boolean,
  ): string {
    switch (condition.metric) {
      case 'campaign':
        return narrow ? copy.mastery.campaign : copy.mastery.campaignRequirement(condition.target);
      case 'daily-completed':
        return narrow ? copy.mastery.daily : copy.mastery.dailyRequirement(condition.target);
      case 'endless-completed':
        return narrow ? copy.mastery.endless : copy.mastery.endlessRequirement(condition.target);
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
