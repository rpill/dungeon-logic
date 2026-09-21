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
import { createMetaPageHeader } from '../runtime/MetaPageHeader';
import { createCenteredTextMenuButton } from '../runtime/HomeMenuButton';
import { createMasteryEdgeGlow, createMasteryGlow, createMasterySeal } from '../runtime/MasterySeal';
import { createMasteryRequirementPanel } from '../runtime/MasteryRequirementPanel';
import { createMasteryRequirementRowPanel } from '../runtime/MasteryRequirementRowPanel';
import { createMasteryProgressBar } from '../runtime/MasteryProgressBar';
import { calculateMasteryDesktopLayout, type MasteryDesktopLayout } from '../runtime/MasteryDesktopLayout';
import { createSceneBackground } from '../runtime/SceneBackground';
import { MASTER_RATING_LEADERBOARD_SCENE_KEY } from './MasterRatingLeaderboardScene';
import { UI_ICON_KEYS } from '../runtime/UiIcons';

export class MasteryScene extends Phaser.Scene {

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
    const narrow = viewport.width < 680;

    const header = createMetaPageHeader(this, {
      title: copy.mastery.title,
      backButton: true,
      backLabel: copy.common.back,
      viewport,
      onBack: () => this.scene.start(HOME_SCENE_KEY),
    });

    const maxWidth = narrow ? Math.min(420, viewport.width - 26) : Math.min(860, viewport.width - 70);
    const top = header.metrics.headerHeight + (narrow ? 12 : 18);

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
      fontFamily: 'monospace', fontSize: `${Math.round(layout.rankLabelFontSize)}px`, color: '#9fd0ff', fontStyle: 'bold',
    });
    this.add.text(textX, top + layout.rankTitleOffsetY, copy.mastery.rankTitles[mastery.currentRank], {
      fontFamily: 'monospace', fontSize: `${Math.round(layout.rankTitleFontSize)}px`, color: '#fff1d2', fontStyle: 'bold',
    });
    this.add.text(textX, top + layout.descriptionOffsetY, `«${copy.mastery.rankDescriptions[mastery.currentRank]}»`, {
      fontFamily: 'monospace', fontSize: `${Math.round(layout.descriptionFontSize)}px`, color: '#d8e2f2', wordWrap: { width: width - layout.descriptionWidthInset },
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
    this.add.text(textX, top + 26, `РАНГ ${mastery.currentRank}`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#9fd0ff', fontStyle: 'bold',
    });
    const rankTitle = this.add.text(textX, top + 51, copy.mastery.rankTitles[mastery.currentRank], {
      fontFamily: 'monospace', fontSize: '22px', color: '#fff1d2', fontStyle: 'bold',
    });
    this.fitTextWidth(rankTitle, textWidth, 16);
    this.add.text(textX, top + 84, `«${copy.mastery.rankDescriptions[mastery.currentRank]}»`, {
      fontFamily: 'monospace', fontSize: '10px', color: '#d8e2f2', wordWrap: { width: textWidth },
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
    createMasteryRequirementPanel(this, centerX, topY + height / 2, width, height);

    const title = mastery.nextRank === null
      ? copy.mastery.maxRank
      : `${copy.mastery.nextRank} (${mastery.nextRank})`;
    this.add.text(centerX, topY + (narrow ? height * 0.155 : desktopLayout?.panelTitleOffsetY ?? height * 0.145), title, {
      fontFamily: 'monospace',
      fontSize: narrow ? '14px' : `${Math.round(desktopLayout?.panelTitleFontSize ?? 18)}px`,
      color: '#fff1d2',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    if (mastery.nextRank === null && masterRatingLabel !== undefined) {
      this.add.text(centerX, topY + height * (narrow ? 0.43 : 0.4), copy.mastery.rating(masterRatingLabel), {
        fontFamily: 'monospace',
        fontSize: narrow ? '20px' : '28px',
        color: '#f0bd63',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const buttonWidth = Math.min(width * 0.72, narrow ? 280 : 360);
      const button = createCenteredTextMenuButton(this, {
        x: centerX,
        y: topY + height * (narrow ? 0.68 : 0.64),
        width: buttonWidth,
        height: narrow ? 48 : 54,
        label: copy.mastery.ratingLeaderboard,
        labelColor: '#f4ead7',
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

    this.add.image(iconX, y, iconKey).setDisplaySize(iconSize, iconSize).setTint(0xf6edd5).setDepth(rowDepth + 1);

    const label = this.requirementLabel(condition, copy, narrow);
    this.add.text(textLeft, headerY, label, {
      fontFamily: 'monospace',
      fontSize: narrow ? '12px' : `${Math.round(desktopLayout?.rowFontSize ?? 18)}px`,
      color: complete ? '#fef0b8' : '#ecf1f8',
    }).setOrigin(0, 0.5).setDepth(rowDepth + 1);

    this.add.text(valueX, headerY, `${condition.current} / ${condition.target}`, {
      fontFamily: 'monospace',
      fontSize: narrow ? '12px' : `${Math.round(desktopLayout?.rowFontSize ?? 18)}px`,
      color: complete ? '#fef0b8' : '#ecf1f8',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(rowDepth + 1);

    const barLeft = textLeft;
    const barWidth = barRight - barLeft;
    this.drawRequirementProgress(barLeft, barY, barWidth, narrow ? 9 : desktopLayout?.barHeight ?? 11, condition.current, condition.target, complete, rowDepth + 1);

    const statusY = y;
    const marker = this.add.graphics().setDepth(rowDepth + 1);
    marker.lineStyle(narrow ? 2.4 : 3.0, complete ? 0x63ddc2 : 0xacbed8, 1);
    marker.strokeCircle(statusX, statusY, narrow ? 12 : desktopLayout?.statusRadius ?? 15);
    if (complete) {
      marker.fillStyle(0x63ddc2, 1);
      marker.fillCircle(statusX, statusY, narrow ? 8.5 : desktopLayout?.statusFillRadius ?? 10.2);
      this.add.image(statusX, statusY, UI_ICON_KEYS.check)
        .setDisplaySize(narrow ? 11 : desktopLayout?.checkSize ?? 14, narrow ? 11 : desktopLayout?.checkSize ?? 14)
        .setTint(0x0d2230).setDepth(rowDepth + 2);
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
    createMasteryProgressBar(this, {
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
    path.lineStyle(narrow ? 2 : 2.2, 0x435878, 0.95);
    path.lineBetween(startX, lineY, startX + step * (MASTERY_RANK_IDS.length - 1), lineY);
    path.lineStyle(narrow ? 2.8 : 3.2, 0xf0bd48, 1);
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
        node.fillStyle(0xffc84f, 1);
        node.lineStyle(isMaster ? 1.8 : 1.4, 0xffdf82, 1);
        node.fillCircle(x, lineY, pastRadius);
        node.strokeCircle(x, lineY, pastRadius);
      } else if (isCurrent) {
        node.fillStyle(0xffc343, 1);
        node.fillCircle(x, lineY, currentRadius);
        node.fillStyle(0x263653, 1);
        node.fillCircle(x, lineY, currentRadius - (narrow ? 1.15 : 1.45));
        node.fillStyle(0xffc84f, 1);
        node.fillCircle(x, lineY, isMaster ? (narrow ? 5 : 6) : (narrow ? 4 : 5));
      } else if (isFuture) {
        node.fillStyle(0x263653, 1);
        node.lineStyle(isMaster ? 1.8 : 1.4, 0x506482, 1);
        node.fillCircle(x, lineY, futureRadius);
        node.strokeCircle(x, lineY, futureRadius);

        this.add.image(x, lineY, UI_ICON_KEYS.lock)
          .setDisplaySize(isMaster ? (narrow ? 10 : 12) : (narrow ? 8 : 10), isMaster ? (narrow ? 10 : 12) : (narrow ? 8 : 10))
          .setTint(0x8fa0bc)
          .setAlpha(0.9);
      }

      this.add.text(x, labelY, rank === 'MASTER' ? 'MASTER' : rank, {
        fontFamily: 'monospace',
        fontSize: narrow ? (rank === 'MASTER' ? '7px' : '9px') : `${Math.round((desktopLayout?.rankTrackFontSize ?? 11) - (rank === 'MASTER' ? 2 : 0))}px`,
        color: isCurrent ? '#ffd66a' : isPast ? '#edf1f8' : '#8b98ad',
        fontStyle: isCurrent ? 'bold' : 'normal',
      }).setOrigin(0.5);
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
