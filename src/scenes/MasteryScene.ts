import Phaser from 'phaser';

import { ANALYTICS_SERVICE_REGISTRY_KEY, type AnalyticsService } from '../analytics/AnalyticsService';
import { getUiCopy } from '../i18n/UiCopy';
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
import { createMasteryEdgeGlow, createMasteryGlow, createMasterySeal } from '../runtime/MasterySeal';
import { createMasteryRequirementPanel } from '../runtime/MasteryRequirementPanel';
import { createMasteryRequirementRowPanel } from '../runtime/MasteryRequirementRowPanel';
import { createSceneBackground } from '../runtime/SceneBackground';
import { UI_ICON_KEYS } from '../runtime/UiIcons';

export class MasteryScene extends Phaser.Scene {
  private progressTextureSerial = 0;

  constructor() {
    super(MASTERY_SCENE_KEY);
  }

  create(): void {
    const background = createSceneBackground(this, 'meta');
    const profile = this.getProfileService().getProfile();
    const copy = getUiCopy(profile.settings.language);
    const mastery = getMasterySnapshot(profile);
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
      this.renderMobileLayout(viewport.centerX, top, maxWidth, mastery, copy);
    } else {
      this.renderDesktopLayout(viewport.centerX, top, maxWidth, mastery, copy);
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
    mastery: ReturnType<typeof getMasterySnapshot>,
    copy: ReturnType<typeof getUiCopy>,
  ): void {
    const cardGap = 22;
    const topSectionHeight = 236;
    const panelHeight = 408;
    const pathHeight = 126;

    const left = centerX - width / 2;
    const sealSize = 250;
    const sealX = left + 158;
    const sealY = top + 126;
    createMasteryGlow(this, { x: sealX, y: sealY - sealSize * 0.07, size: sealSize * 0.82, alpha: 0.62, variant: 'page' });
    createMasteryEdgeGlow(this, { x: sealX, y: sealY, size: sealSize, rank: mastery.currentRank, alpha: 0.5 });
    createMasterySeal(this, { x: sealX, y: sealY, size: sealSize, rank: mastery.currentRank });

    const textX = left + 318;
    this.add.text(textX, top + 42, `РАНГ ${mastery.currentRank}`, {
      fontFamily: 'monospace', fontSize: '18px', color: '#9fd0ff', fontStyle: 'bold',
    });
    this.add.text(textX, top + 74, copy.mastery.rankTitles[mastery.currentRank], {
      fontFamily: 'monospace', fontSize: '34px', color: '#fff1d2', fontStyle: 'bold',
    });
    this.add.text(textX, top + 126, `«${copy.mastery.rankDescriptions[mastery.currentRank]}»`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#d8e2f2', wordWrap: { width: width - 342 },
    });

    const panelTop = top + topSectionHeight + cardGap;
    this.renderRequirementPanel(centerX, panelTop, width, panelHeight, mastery, copy, false);

    const pathTop = panelTop + panelHeight + cardGap;
    this.renderRankTrack(centerX, pathTop, width, pathHeight, mastery.currentRank, false, copy);
  }

  private renderMobileLayout(
    centerX: number,
    top: number,
    width: number,
    mastery: ReturnType<typeof getMasterySnapshot>,
    copy: ReturnType<typeof getUiCopy>,
  ): void {
    const left = centerX - width / 2;
    const sealSize = Math.min(156, width * 0.4);
    const sealX = left + width * 0.22;
    const sealY = top + 80;
    createMasteryGlow(this, { x: sealX, y: sealY - sealSize * 0.07, size: sealSize * 0.82, alpha: 0.6, variant: 'page' });
    createMasteryEdgeGlow(this, { x: sealX, y: sealY, size: sealSize, rank: mastery.currentRank, alpha: 0.46 });
    createMasterySeal(this, { x: sealX, y: sealY, size: sealSize, rank: mastery.currentRank });

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
    this.renderRequirementPanel(centerX, panelTop, width, panelHeight, mastery, copy, true);
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
  ): void {
    createMasteryRequirementPanel(this, centerX, topY + height / 2, width, height);

    const title = mastery.nextRank === null
      ? copy.mastery.maxRank
      : `${copy.mastery.nextRank} (${mastery.nextRank})`;
    this.add.text(centerX, topY + height * (narrow ? 0.155 : 0.145), title, {
      fontFamily: 'monospace',
      fontSize: narrow ? '14px' : '18px',
      color: '#fff1d2',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const visibleConditions = mastery.conditions.slice(0, 3);
    const rowHeight = narrow ? 86 : 102;
    const rowTop = topY + height * (narrow ? 0.405 : 0.385);
    const rowGap = rowHeight - (narrow ? 20 : 24);
    visibleConditions.forEach((condition, index) => {
      this.renderRequirementRow(centerX, rowTop + rowGap * index, width * 0.84, rowHeight, index, condition, copy, narrow);
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
  ): void {
    const left = centerX - width / 2;
    const right = centerX + width / 2;
    const complete = condition.complete;
    const rowDepth = 20 + rowIndex * 4;

    createMasteryRequirementRowPanel(this, centerX, y, width, rowHeight, rowDepth);

    const iconKey = this.conditionIconKey(condition);
    const iconX = left + (narrow ? 30 : 38);
    const iconSize = narrow ? 28 : 36;
    const textLeft = left + (narrow ? 58 : 76);
    const statusX = right - (narrow ? 32 : 42);
    const barRight = statusX - (narrow ? 22 : 28);
    const valueX = barRight;
    const headerY = y - rowHeight * (narrow ? 0.17 : 0.18);
    const barY = y + rowHeight * (narrow ? 0.07 : 0.08);

    this.add.image(iconX, y, iconKey).setDisplaySize(iconSize, iconSize).setTint(0xf6edd5).setDepth(rowDepth + 1);

    const label = this.requirementLabel(condition, copy, narrow);
    this.add.text(textLeft, headerY, label, {
      fontFamily: 'monospace',
      fontSize: narrow ? '14px' : '22px',
      color: complete ? '#fef0b8' : '#ecf1f8',
    }).setOrigin(0, 0.5).setDepth(rowDepth + 1);

    this.add.text(valueX, headerY, `${condition.current} / ${condition.target}`, {
      fontFamily: 'monospace',
      fontSize: narrow ? '14px' : '22px',
      color: complete ? '#fef0b8' : '#ecf1f8',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(rowDepth + 1);

    const barLeft = textLeft;
    const barWidth = barRight - barLeft;
    this.drawRequirementProgress(barLeft, barY, barWidth, narrow ? 11 : 13, condition.current, condition.target, complete, rowDepth + 1);

    const statusY = y;
    const marker = this.add.graphics().setDepth(rowDepth + 1);
    marker.lineStyle(narrow ? 2.4 : 3.0, complete ? 0x63ddc2 : 0xacbed8, 1);
    marker.strokeCircle(statusX, statusY, narrow ? 15 : 18);
    if (complete) {
      marker.fillStyle(0x63ddc2, 1);
      marker.fillCircle(statusX, statusY, narrow ? 10.5 : 12.6);
      this.add.image(statusX, statusY, UI_ICON_KEYS.check)
        .setDisplaySize(narrow ? 14 : 17, narrow ? 14 : 17)
        .setTint(0x0d2230).setDepth(rowDepth + 2);
    }
  }

  private drawRequirementProgress(left: number, y: number, width: number, height: number, current: number, target: number, _complete: boolean, depth = 0): void {
    const ratio = Phaser.Math.Clamp(current / Math.max(1, target), 0, 1);
    const trackTop = y - height / 2;
    const radius = height / 2;

    const track = this.add.graphics().setDepth(depth);
    track.fillStyle(0x08111b, 0.98);
    track.fillRoundedRect(left, trackTop, width, height, radius);
    track.lineStyle(1.1, 0x203855, 0.95);
    track.strokeRoundedRect(left, trackTop, width, height, radius);

    if (ratio <= 0) return;

    const textureWidth = Math.max(2, Math.ceil(width));
    const textureHeight = Math.max(2, Math.ceil(height));
    const visibleWidth = Math.max(textureHeight, textureWidth * ratio);
    const textureKey = `mastery-progress-fill-${this.progressTextureSerial++}`;
    const texture = this.textures.createCanvas(textureKey, textureWidth, textureHeight);
    if (texture === null) return;
    const ctx = texture.context;
    const gradient = ctx.createLinearGradient(0, 0, textureWidth, 0);
    gradient.addColorStop(0, '#f0c75e');
    gradient.addColorStop(1, '#69df8c');

    const paintWidth = Math.min(textureWidth, visibleWidth);
    const paintRadius = Math.min(textureHeight / 2, paintWidth / 2);
    ctx.clearRect(0, 0, textureWidth, textureHeight);
    ctx.beginPath();
    ctx.moveTo(paintRadius, 0);
    ctx.lineTo(paintWidth - paintRadius, 0);
    ctx.quadraticCurveTo(paintWidth, 0, paintWidth, paintRadius);
    ctx.lineTo(paintWidth, textureHeight - paintRadius);
    ctx.quadraticCurveTo(paintWidth, textureHeight, paintWidth - paintRadius, textureHeight);
    ctx.lineTo(paintRadius, textureHeight);
    ctx.quadraticCurveTo(0, textureHeight, 0, textureHeight - paintRadius);
    ctx.lineTo(0, paintRadius);
    ctx.quadraticCurveTo(0, 0, paintRadius, 0);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    texture.refresh();

    const fillImage = this.add.image(left, y, textureKey)
      .setOrigin(0, 0.5)
      .setDisplaySize(width, height)
      .setDepth(depth + 0.1);
    fillImage.once('destroy', () => {
      if (this.textures.exists(textureKey)) {
        this.textures.remove(textureKey);
      }
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
  ): void {
    const currentIndex = getMasteryRankIndex(currentRank);
    const trackWidth = width * (narrow ? 0.96 : 0.92);
    const startX = centerX - trackWidth / 2;
    const step = trackWidth / (MASTERY_RANK_IDS.length - 1);
    const lineY = topY + (narrow ? 18 : 23);
    const labelY = topY + (narrow ? 42 : 51);

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
        fontSize: narrow ? (rank === 'MASTER' ? '7px' : '9px') : (rank === 'MASTER' ? '9px' : '11px'),
        color: isCurrent ? '#ffd66a' : isPast ? '#edf1f8' : '#8b98ad',
        fontStyle: isCurrent ? 'bold' : 'normal',
      }).setOrigin(0.5);
    });
  }


  private conditionIconKey(condition: MasteryRequirementProgress): string {
    switch (condition.metric) {
      case 'campaign':
        return 'home-menu-icon-levels';
      case 'daily-best-streak':
        return 'home-menu-icon-daily';
      case 'endless-best-clean-streak':
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
        return narrow ? copy.mastery.campaign : `${copy.mastery.campaign}: пройдите ${condition.target} уровня`;
      case 'daily-best-streak':
        return narrow ? copy.mastery.daily : `Daily: достигните серии ${condition.target} дня`;
      case 'endless-best-clean-streak':
        return narrow ? copy.mastery.endless : `Испытание: чистая серия ${condition.target}`;
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
