import Phaser from 'phaser';

import { ANALYTICS_SERVICE_REGISTRY_KEY, type AnalyticsService } from '../analytics/AnalyticsService';
import { getAudioFeedback } from '../audio/AudioFeedbackService';
import { HELP_SCENE_KEY } from '../help/HelpNavigation';
import { getUiCopy } from '../i18n/UiCopy';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import { createTutorialGameSceneData } from '../runtime/GameLaunch';
import { createHeaderActionButton, getHeaderActionButtonMetrics } from '../runtime/HeaderActionButton';
import { HOME_SCENE_KEY, SETTINGS_SCENE_KEY } from '../runtime/MetaSelectors';
import { MetaPointerGate } from '../runtime/MetaPointerGate';
import { createSceneBackground } from '../runtime/SceneBackground';
import { SettingsService, type SupportedLanguage } from '../settings/SettingsService';
import type { SettingsRowId } from '../settings/SettingsViewModel';
import { TUTORIAL_SERVICE_REGISTRY_KEY, TutorialService } from '../tutorial/TutorialService';

const SETTINGS_ICON_KEYS: Readonly<Record<SettingsRowId, string>> = {
  music: 'ui-icon-music',
  sound: 'ui-icon-sound',
  language: 'ui-icon-language',
  tutorial: 'ui-icon-levels',
  help: 'ui-icon-question',
  reset: 'ui-icon-reset',
};

export class SettingsScene extends Phaser.Scene {
  private readonly pointerGate = new MetaPointerGate();
  private returnSceneKey = HOME_SCENE_KEY;
  private resetDialogOpen = false;
  private mutationPending = false;
  private launchPending = false;

  constructor() {
    super(SETTINGS_SCENE_KEY);
  }

  init(data?: { readonly returnSceneKey?: string }): void {
    this.returnSceneKey = data?.returnSceneKey ?? HOME_SCENE_KEY;
  }

  create(): void {
    this.pointerGate.reset();
    this.resetDialogOpen = false;
    this.mutationPending = false;
    this.launchPending = false;

    const sceneBackground = createSceneBackground(this, 'meta');
    const handlePointerDown = (pointer: Phaser.Input.Pointer): void => {
      this.pointerGate.notePointerDown(pointer.id);
    };
    this.input.on('pointerdown', handlePointerDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', handlePointerDown);
    });

    const profileService = this.getProfileService();
    const settingsService = new SettingsService(profileService);
    const settings = settingsService.getSettings();
    const copy = getUiCopy(settings.language);
    const analytics = this.registry.get(ANALYTICS_SERVICE_REGISTRY_KEY) as AnalyticsService | undefined;
    analytics?.screenView('settings');

    const viewportWidth = this.scale.width;
    const viewportHeight = this.scale.height;
    const narrow = viewportWidth < 700;
    const dense = viewportHeight < (narrow ? 760 : 680);
    const contentWidth = Math.min(viewportWidth - (narrow ? 28 : 80), narrow ? 420 : 536);
    const centerX = viewportWidth / 2;

    const headerActionMetrics = getHeaderActionButtonMetrics(narrow);
    const headerInset = narrow ? 16 : 28;
    createHeaderActionButton(this, {
      x: headerInset + headerActionMetrics.pillWidth / 2,
      y: narrow ? 34 : 40,
      width: headerActionMetrics.pillWidth,
      height: headerActionMetrics.height,
      radius: headerActionMetrics.radius,
      iconKey: 'ui-icon-back',
      iconSize: headerActionMetrics.iconSize,
      label: copy.common.back,
      fontSize: headerActionMetrics.fontSize,
      gap: headerActionMetrics.gap,
      onActivate: (pointer) => {
        if (!this.canActivate(pointer)) return;
        if (this.returnSceneKey === 'GameScene') {
          this.scene.resume('GameScene');
          this.scene.stop();
          return;
        }
        this.scene.start(HOME_SCENE_KEY);
      },
    });

    const titleY = dense ? (narrow ? 88 : 70) : (narrow ? 108 : 84);
    this.add.text(centerX, titleY, copy.settings.title, {
      fontFamily: 'monospace',
      fontSize: dense ? (narrow ? '28px' : '32px') : (narrow ? '32px' : '38px'),
      color: '#fff4df',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const controlsTop = titleY + (dense ? 46 : 58);
    const controlRowHeight = dense ? (narrow ? 52 : 56) : (narrow ? 60 : 64);
    const controlGap = dense ? 6 : 8;
    const panelPadding = dense ? 8 : 10;
    const controlsHeight = panelPadding * 2 + controlRowHeight * 3 + controlGap * 2;
    this.createControlsPanel(
      settingsService,
      centerX,
      controlsTop,
      contentWidth,
      controlsHeight,
      controlRowHeight,
      controlGap,
      panelPadding,
      narrow,
    );

    const controlsBottom = controlsTop + controlsHeight;
    const sectionY = controlsBottom + (dense ? 28 : 38);
    this.createSectionDivider(copy.settings.helpAndInfo, centerX, sectionY, contentWidth, narrow);

    const navRowHeight = dense ? (narrow ? 54 : 58) : (narrow ? 62 : 66);
    const navGap = dense ? 7 : 10;
    const navStartY = sectionY + (dense ? 32 : 40) + navRowHeight / 2;
    this.createNavigationRow(
      'tutorial',
      copy.common.tutorial,
      centerX,
      navStartY,
      contentWidth,
      navRowHeight,
      narrow,
      () => { void this.launchTutorial(); },
    );
    this.createNavigationRow(
      'help',
      copy.settings.rules,
      centerX,
      navStartY + navRowHeight + navGap,
      contentWidth,
      navRowHeight,
      narrow,
      () => {
        this.scene.launch(HELP_SCENE_KEY, { returnSceneKey: SETTINGS_SCENE_KEY });
        this.scene.pause();
      },
    );

    const resetY = navStartY + (navRowHeight + navGap) * 2 + (dense ? 22 : 30);
    this.createResetButton(copy.settings.resetProgress, centerX, resetY, Math.min(contentWidth, narrow ? 260 : 320), dense ? 42 : 46, narrow, settingsService);

    const handleResize = (): void => {
      sceneBackground.sync();
      if (this.scene.isActive()) this.scene.restart({ returnSceneKey: this.returnSceneKey });
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
    });
  }


  private createControlsPanel(
    service: SettingsService,
    centerX: number,
    topY: number,
    width: number,
    height: number,
    rowHeight: number,
    rowGap: number,
    padding: number,
    narrow: boolean,
  ): void {
    const panel = this.add.graphics();
    panel.fillStyle(0x152642, 0.96);
    panel.fillRoundedRect(centerX - width / 2, topY, width, height, narrow ? 15 : 17);
    panel.lineStyle(2, 0x587294, 0.92);
    panel.strokeRoundedRect(centerX - width / 2, topY, width, height, narrow ? 15 : 17);

    const settings = service.getSettings();
    const copy = getUiCopy(settings.language);
    const ids: readonly ('music' | 'sound' | 'language')[] = ['music', 'sound', 'language'];
    ids.forEach((id, index) => {
      const rowY = topY + padding + rowHeight / 2 + index * (rowHeight + rowGap);
      const label = id === 'music' ? copy.settings.music : id === 'sound' ? copy.settings.sound : copy.settings.language;
      this.createControlRow(id, label, centerX, rowY, width - padding * 2, rowHeight, narrow, service);
    });
  }

  private createControlRow(
    id: 'music' | 'sound' | 'language',
    label: string,
    centerX: number,
    y: number,
    width: number,
    height: number,
    narrow: boolean,
    service: SettingsService,
  ): void {
    const background = this.add.graphics();
    const radius = narrow ? 10 : 11;
    const draw = (fill: number): void => {
      background.clear();
      background.fillStyle(fill, 0.96);
      background.fillRoundedRect(centerX - width / 2, y - height / 2, width, height, radius);
      background.lineStyle(1.5, 0x365272, 0.9);
      background.strokeRoundedRect(centerX - width / 2, y - height / 2, width, height, radius);
    };
    draw(0x1b3152);

    const left = centerX - width / 2;
    const right = centerX + width / 2;
    const iconSize = narrow ? 28 : 32;
    this.add.image(left + (narrow ? 30 : 36), y, SETTINGS_ICON_KEYS[id])
      .setDisplaySize(iconSize, iconSize)
      .setTint(0xf4c35d);
    this.add.text(left + (narrow ? 56 : 66), y, label, {
      fontFamily: 'monospace',
      fontSize: narrow ? '16px' : '19px',
      color: '#fff4df',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const settings = service.getSettings();
    if (id === 'language') {
      const value = getUiCopy(settings.language).settings.languageName[settings.language];
      const valueText = this.add.text(right - (narrow ? 28 : 34), y, `${value}  ›`, {
        fontFamily: 'monospace',
        fontSize: narrow ? '13px' : '15px',
        color: '#f4c35d',
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      void valueText;
    } else {
      const enabled = id === 'music' ? settings.musicEnabled : settings.soundEnabled;
      this.createToggle(right - (narrow ? 38 : 44), y, enabled, narrow);
    }

    const hit = this.add.zone(centerX, y, width, height).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => {
      if (this.mutationPending || this.resetDialogOpen || this.launchPending) return;
      draw(0x254264);
      getAudioFeedback(this).play('ui-hover');
    });
    hit.on('pointerout', () => draw(0x1b3152));
    hit.on('pointerdown', () => {
      if (!this.mutationPending && !this.resetDialogOpen && !this.launchPending) draw(0x142842);
    });
    hit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      draw(0x254264);
      if (!this.canActivate(pointer)) return;
      getAudioFeedback(this).play('ui-click');
      void this.activateRow(id, service);
    });
  }

  private createToggle(x: number, y: number, enabled: boolean, narrow: boolean): void {
    const width = narrow ? 56 : 62;
    const height = narrow ? 30 : 32;
    const radius = height / 2;
    const track = this.add.graphics();
    track.fillStyle(enabled ? 0xf0b84f : 0x4a5870, 1);
    track.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
    track.lineStyle(1.5, enabled ? 0xffd36e : 0x65738a, 1);
    track.strokeRoundedRect(x - width / 2, y - height / 2, width, height, radius);
    const knobRadius = height * 0.37;
    const knobX = x + (enabled ? 1 : -1) * (width / 2 - height / 2);
    this.add.circle(knobX, y, knobRadius, enabled ? 0xfff3d2 : 0xc4cad4, 1);
  }

  private createSectionDivider(label: string, centerX: number, y: number, width: number, narrow: boolean): void {
    const text = this.add.text(centerX, y, label, {
      fontFamily: 'monospace',
      fontSize: narrow ? '13px' : '15px',
      color: '#8fa2bd',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const gap = narrow ? 16 : 22;
    const lineWidth = Math.max(28, (width - text.width - gap * 2) / 2);
    const line = this.add.graphics();
    line.fillStyle(0x6f84a4, 0.75);
    line.fillRect(centerX - text.width / 2 - gap - lineWidth, y - 1, lineWidth, 2);
    line.fillRect(centerX + text.width / 2 + gap, y - 1, lineWidth, 2);
  }

  private createNavigationRow(
    id: 'tutorial' | 'help',
    label: string,
    centerX: number,
    y: number,
    width: number,
    height: number,
    narrow: boolean,
    onActivate: () => void,
  ): void {
    const background = this.add.graphics();
    const radius = narrow ? 12 : 13;
    const draw = (fill: number): void => {
      background.clear();
      background.fillStyle(fill, 0.97);
      background.fillRoundedRect(centerX - width / 2, y - height / 2, width, height, radius);
      background.lineStyle(2, 0x526b8f, 0.95);
      background.strokeRoundedRect(centerX - width / 2, y - height / 2, width, height, radius);
    };
    draw(0x1a2f50);

    const left = centerX - width / 2;
    const right = centerX + width / 2;
    const iconSize = narrow ? 30 : 34;
    this.add.image(left + (narrow ? 34 : 40), y, SETTINGS_ICON_KEYS[id])
      .setDisplaySize(iconSize, iconSize)
      .setTint(0xffe19a);
    this.add.text(left + (narrow ? 64 : 76), y, label, {
      fontFamily: 'monospace',
      fontSize: narrow ? '16px' : '19px',
      color: '#fff4df',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.add.text(right - (narrow ? 24 : 28), y - 1, '›', {
      fontFamily: 'monospace',
      fontSize: narrow ? '30px' : '34px',
      color: '#f4c35d',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const hit = this.add.zone(centerX, y, width, height).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => {
      if (this.mutationPending || this.resetDialogOpen || this.launchPending) return;
      draw(0x254264);
      getAudioFeedback(this).play('ui-hover');
    });
    hit.on('pointerout', () => draw(0x1a2f50));
    hit.on('pointerdown', () => {
      if (!this.mutationPending && !this.resetDialogOpen && !this.launchPending) draw(0x142842);
    });
    hit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      draw(0x254264);
      if (!this.canActivate(pointer)) return;
      getAudioFeedback(this).play('ui-click');
      onActivate();
    });
  }

  private createResetButton(
    label: string,
    centerX: number,
    y: number,
    width: number,
    height: number,
    narrow: boolean,
    service: SettingsService,
  ): void {
    const background = this.add.graphics();
    const draw = (fillAlpha: number): void => {
      background.clear();
      background.fillStyle(0x4a2532, fillAlpha);
      background.fillRoundedRect(centerX - width / 2, y - height / 2, width, height, narrow ? 9 : 10);
      background.lineStyle(1.5, 0xc96568, 0.9);
      background.strokeRoundedRect(centerX - width / 2, y - height / 2, width, height, narrow ? 9 : 10);
    };
    draw(0.58);
    const iconSize = narrow ? 20 : 22;
    this.add.image(centerX - width * 0.32, y, SETTINGS_ICON_KEYS.reset)
      .setDisplaySize(iconSize, iconSize)
      .setTint(0xf0b2b4);
    this.add.text(centerX + 8, y, label, {
      fontFamily: 'monospace',
      fontSize: narrow ? '12px' : '14px',
      color: '#f3c4c5',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const hit = this.add.zone(centerX, y, width, height).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => {
      draw(0.78);
      getAudioFeedback(this).play('ui-hover');
    });
    hit.on('pointerout', () => draw(0.58));
    hit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      draw(0.78);
      if (!this.canActivate(pointer)) return;
      getAudioFeedback(this).play('ui-click');
      this.openResetDialog(service, service.getSettings().language);
    });
  }

  private async activateRow(id: 'music' | 'sound' | 'language', service: SettingsService): Promise<void> {
    if (this.mutationPending || this.resetDialogOpen || this.launchPending) return;
    const current = service.getSettings();
    switch (id) {
      case 'music':
        await this.persistSetting(() => service.setMusicEnabled(!current.musicEnabled));
        return;
      case 'sound':
        await this.persistSetting(() => service.setSoundEnabled(!current.soundEnabled));
        return;
      case 'language': {
        const next: SupportedLanguage = current.language === 'en' ? 'ru' : 'en';
        await this.persistSetting(() => service.setLanguage(next));
      }
    }
  }

  private async launchTutorial(): Promise<void> {
    if (this.launchPending || this.mutationPending || this.resetDialogOpen) return;
    this.launchPending = true;
    try {
      const started = await this.getTutorialService().startEntryLevel();
      if (this.returnSceneKey === 'GameScene') this.scene.stop('GameScene');
      this.scene.start('GameScene', createTutorialGameSceneData(started));
    } catch (error) {
      this.launchPending = false;
      console.warn('[Dungeon Logic] Could not start Tutorial from Settings.', error);
    }
  }

  private async persistSetting(mutation: () => Promise<void>): Promise<void> {
    if (this.mutationPending) return;
    this.mutationPending = true;
    try {
      await mutation();
      if (this.scene.isActive()) this.scene.restart({ returnSceneKey: this.returnSceneKey });
    } catch (error) {
      this.mutationPending = false;
      console.warn('[Dungeon Logic] Could not persist Settings change.', error);
    }
  }

  private openResetDialog(service: SettingsService, language: SupportedLanguage): void {
    if (this.resetDialogOpen || this.mutationPending || this.launchPending) return;
    this.resetDialogOpen = true;

    const copy = getUiCopy(language);
    const narrow = this.scale.width < 700;
    const width = Math.min(this.scale.width - 32, narrow ? 350 : 470);
    const height = narrow ? 250 : 238;
    const x = this.scale.width / 2;
    const y = this.scale.height / 2;

    const blocker = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x000000,
      0.7,
    ).setDepth(2000).setInteractive();
    const panel = this.add.graphics().setDepth(2001);
    panel.fillStyle(0x17213a, 1);
    panel.fillRoundedRect(x - width / 2, y - height / 2, width, height, 12);
    panel.lineStyle(2, 0x6d7894, 1);
    panel.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 12);
    const title = this.add.text(x, y - height / 2 + 34, copy.settings.resetTitle, {
      fontFamily: 'monospace',
      fontSize: narrow ? '17px' : '19px',
      color: '#f4ead7',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2002);
    const dialogCopy = this.add.text(x, y - 22, copy.settings.resetBody, {
      fontFamily: 'monospace',
      fontSize: narrow ? '12px' : '13px',
      color: '#aeb6c8',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5).setDepth(2002);

    const buttonGap = 10;
    const buttonWidth = (width - 36 - buttonGap) / 2;
    const buttonHeight = 44;
    const buttonY = y + height / 2 - 43;
    const cancelX = x - (buttonWidth + buttonGap) / 2;
    const resetX = x + (buttonWidth + buttonGap) / 2;
    const buttons = this.add.graphics().setDepth(2002);
    buttons.fillStyle(0x263451, 1);
    buttons.fillRoundedRect(cancelX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 9);
    buttons.fillStyle(0xc96568, 1);
    buttons.fillRoundedRect(resetX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 9);
    const cancelHit = this.add.zone(cancelX, buttonY, buttonWidth, buttonHeight).setDepth(2003).setInteractive({ useHandCursor: true });
    const confirmHit = this.add.zone(resetX, buttonY, buttonWidth, buttonHeight).setDepth(2003).setInteractive({ useHandCursor: true });
    const cancelLabel = this.add.text(cancelX, buttonY, copy.common.cancel, {
      fontFamily: 'monospace',
      fontSize: narrow ? '12px' : '13px',
      color: '#f4ead7',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2003);
    const confirmLabel = this.add.text(resetX, buttonY, copy.common.reset, {
      fontFamily: 'monospace',
      fontSize: narrow ? '12px' : '13px',
      color: '#fff4df',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2003);

    const destroyDialog = (): void => {
      blocker.destroy();
      panel.destroy();
      title.destroy();
      dialogCopy.destroy();
      buttons.destroy();
      cancelHit.destroy();
      confirmHit.destroy();
      cancelLabel.destroy();
      confirmLabel.destroy();
      this.resetDialogOpen = false;
    };

    cancelHit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.pointerGate.canActivate(pointer.id) || this.mutationPending) return;
      destroyDialog();
    });
    confirmHit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.pointerGate.canActivate(pointer.id) || this.mutationPending) return;
      this.mutationPending = true;
      void service.resetProgress().then(() => {
        if (!this.scene.isActive()) return;
        this.scene.start(HOME_SCENE_KEY);
      }).catch((error) => {
        this.mutationPending = false;
        console.warn('[Dungeon Logic] Could not reset player progress.', error);
      });
    });
  }

  private canActivate(pointer: Phaser.Input.Pointer): boolean {
    return !this.resetDialogOpen
      && !this.mutationPending
      && !this.launchPending
      && this.pointerGate.canActivate(pointer.id);
  }

  private getProfileService(): PlayerProfileService {
    const service = this.registry.get(PLAYER_PROFILE_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof PlayerProfileService)) {
      throw new Error('SettingsScene requires PlayerProfileService in Phaser registry.');
    }
    return service;
  }

  private getTutorialService(): TutorialService {
    const service = this.registry.get(TUTORIAL_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof TutorialService)) {
      throw new Error('SettingsScene requires TutorialService in Phaser registry.');
    }
    return service;
  }
}
