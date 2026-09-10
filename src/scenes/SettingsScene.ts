import Phaser from 'phaser';

import { HELP_SCENE_KEY } from '../help/HelpNavigation';
import { getUiCopy } from '../i18n/UiCopy';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import { HOME_SCENE_KEY, SETTINGS_SCENE_KEY } from '../runtime/MetaSelectors';
import { MetaPointerGate } from '../runtime/MetaPointerGate';
import { createSceneBackground } from '../runtime/SceneBackground';
import {
  SettingsService,
  detectVibrationSupport,
  type SupportedLanguage,
} from '../settings/SettingsService';
import { getSettingsRows, type SettingsRowId } from '../settings/SettingsViewModel';

const SETTINGS_ICON_KEYS: Readonly<Record<Exclude<SettingsRowId, 'reset'> | 'reset', string>> = {
  music: 'ui-icon-music',
  sound: 'ui-icon-sound',
  vibration: 'ui-icon-vibration',
  language: 'ui-icon-language',
  help: 'ui-icon-hint',
  reset: 'ui-icon-reset',
};

export class SettingsScene extends Phaser.Scene {
  private readonly pointerGate = new MetaPointerGate();
  private returnSceneKey = HOME_SCENE_KEY;
  private resetDialogOpen = false;
  private mutationPending = false;

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

    const sceneBackground = createSceneBackground(this, 'meta');

    const handlePointerDown = (pointer: Phaser.Input.Pointer): void => {
      this.pointerGate.notePointerDown(pointer.id);
    };
    this.input.on('pointerdown', handlePointerDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', handlePointerDown);
    });

    const profileService = this.getProfileService();
    const vibrationSupported = detectVibrationSupport(
      typeof navigator === 'undefined' ? null : navigator,
    );
    const settingsService = new SettingsService(profileService, { vibrationSupported });
    const settings = settingsService.getSettings();
    const copy = getUiCopy(settings.language);
    const narrow = this.scale.width < 700;

    const backY = narrow ? 28 : 42;
    const backX = narrow ? 18 : 42;
    const backIconSize = narrow ? 24 : 30;
    this.add.image(backX + backIconSize / 2, backY, 'ui-icon-back')
      .setDisplaySize(backIconSize, backIconSize)
      .setTint(0xf4ead7);
    const backLabel = this.add.text(
      backX + backIconSize + (narrow ? 8 : 10),
      backY,
      this.returnSceneKey === 'GameScene' ? copy.common.back.replace(/^←\s*/, '') : copy.common.backHome.replace(/^←\s*/, ''),
      {
        fontFamily: 'monospace',
        fontSize: narrow ? '14px' : '17px',
        color: '#f4ead7',
        fontStyle: 'bold',
      },
    ).setOrigin(0, 0.5);
    const backHit = this.add.zone(
      backX + (backIconSize + 10 + backLabel.width) / 2,
      backY,
      backIconSize + 10 + backLabel.width,
      Math.max(44, backIconSize + 10),
    ).setInteractive({ useHandCursor: true });
    backHit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.canActivate(pointer)) return;
      if (this.returnSceneKey === 'GameScene') {
        this.scene.resume('GameScene');
        this.scene.stop();
        return;
      }
      this.scene.start(HOME_SCENE_KEY);
    });

    const titleY = narrow ? 70 : 84;
    const title = this.add.text(this.scale.width / 2, titleY, copy.settings.title, {
      fontFamily: 'monospace',
      fontSize: narrow ? '28px' : '40px',
      color: '#f4ead7',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    if (!narrow) {
      const titleDecor = this.add.graphics();
      titleDecor.fillStyle(0xf0b14f, 0.95);
      const diamondSize = 6;
      const leftDiamondX = title.x - title.width / 2 - 34;
      const rightDiamondX = title.x + title.width / 2 + 34;
      const drawDiamond = (x: number): void => {
        titleDecor.beginPath();
        titleDecor.moveTo(x, titleY - diamondSize);
        titleDecor.lineTo(x + diamondSize, titleY);
        titleDecor.lineTo(x, titleY + diamondSize);
        titleDecor.lineTo(x - diamondSize, titleY);
        titleDecor.closePath();
        titleDecor.fillPath();
      };
      drawDiamond(leftDiamondX);
      drawDiamond(rightDiamondX);
      titleDecor.fillRect(leftDiamondX - 66, titleY - 1, 46, 2);
      titleDecor.fillRect(rightDiamondX + 20, titleY - 1, 46, 2);
    }

    const width = Math.min(this.scale.width - (narrow ? 28 : 56), narrow ? 430 : 720);
    const rowHeight = narrow ? 56 : 64;
    const rowGap = narrow ? 10 : 12;
    const rows = getSettingsRows(settings, settingsService.isVibrationSupported(), settings.language);
    const startY = titleY + (narrow ? 72 : 94);

    rows.forEach((row, index) => {
      const y = startY + index * (rowHeight + rowGap);
      this.createSettingsRow(
        row.id,
        row.label,
        row.value,
        y,
        width,
        rowHeight,
        row.danger,
        settingsService,
      );
    });

    const handleResize = (): void => {
      sceneBackground.sync();
      if (this.scene.isActive()) this.scene.restart({ returnSceneKey: this.returnSceneKey });
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
    });
  }

  private createSettingsRow(
    id: SettingsRowId,
    label: string,
    value: string | null,
    y: number,
    width: number,
    height: number,
    danger: boolean,
    service: SettingsService,
  ): void {
    const narrow = this.scale.width < 700;
    const radius = narrow ? 9 : 11;
    const normalFill = danger ? 0xff4f57 : 0x1f2c4a;
    const hoverFill = danger ? 0xff6168 : 0x28395f;
    const pressedFill = danger ? 0xd83f47 : 0x18243d;
    const background = this.add.graphics();
    const hitArea = this.add.zone(this.scale.width / 2, y, width, height)
      .setInteractive({ useHandCursor: true });

    const redraw = (fill: number): void => {
      background.clear();
      background.fillStyle(fill, 1);
      background.fillRoundedRect(
        this.scale.width / 2 - width / 2,
        y - height / 2,
        width,
        height,
        radius,
      );
    };
    redraw(normalFill);

    const left = this.scale.width / 2 - width / 2;
    const right = this.scale.width / 2 + width / 2;
    const iconSize = narrow ? 25 : 31;
    const iconX = left + (narrow ? 28 : 36);
    const labelX = left + (narrow ? 54 : 72);
    const icon = this.add.image(iconX, y, SETTINGS_ICON_KEYS[id])
      .setDisplaySize(iconSize, iconSize)
      .setTint(0xf4ead7);

    const labelText = this.add.text(labelX, y, label, {
      fontFamily: 'monospace',
      fontSize: narrow ? '15px' : '19px',
      color: danger ? '#fff4df' : '#f4ead7',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    let valueText: Phaser.GameObjects.Text | null = null;
    if (!danger && value !== null && id !== 'help') {
      const valueColor = id === 'language'
        ? '#f0bd63'
        : value === getUiCopy(service.getSettings().language).settings.on
          ? '#55e5bd'
          : '#7f8ba2';
      valueText = this.add.text(right - (narrow ? 32 : 42), y, value, {
        fontFamily: 'monospace',
        fontSize: narrow ? '14px' : '18px',
        color: valueColor,
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
    }

    const chevron = danger
      ? null
      : this.add.text(right - (narrow ? 14 : 18), y, '›', {
        fontFamily: 'monospace',
        fontSize: narrow ? '24px' : '30px',
        color: '#8190aa',
        fontStyle: 'bold',
      }).setOrigin(0.5);

    hitArea
      .on('pointerover', () => {
        if (!this.mutationPending && !this.resetDialogOpen) redraw(hoverFill);
      })
      .on('pointerout', () => redraw(normalFill))
      .on('pointerdown', () => {
        if (!this.mutationPending && !this.resetDialogOpen) redraw(pressedFill);
      })
      .on('pointerup', (pointer: Phaser.Input.Pointer) => {
        redraw(hoverFill);
        if (!this.canActivate(pointer)) return;
        void this.activateRow(id, service);
      });

    // Keep explicit references alive with the scene and make intent clear.
    void icon;
    void labelText;
    void valueText;
    void chevron;
  }

  private async activateRow(id: SettingsRowId, service: SettingsService): Promise<void> {
    if (this.mutationPending || this.resetDialogOpen) return;

    const current = service.getSettings();
    switch (id) {
      case 'music':
        await this.persistSetting(() => service.setMusicEnabled(!current.musicEnabled));
        return;
      case 'sound':
        await this.persistSetting(() => service.setSoundEnabled(!current.soundEnabled));
        return;
      case 'vibration':
        await this.persistSetting(() => service.setVibrationEnabled(!current.vibrationEnabled));
        return;
      case 'language': {
        const next: SupportedLanguage = current.language === 'en' ? 'ru' : 'en';
        await this.persistSetting(() => service.setLanguage(next));
        return;
      }
      case 'help':
        this.scene.launch(HELP_SCENE_KEY, { returnSceneKey: SETTINGS_SCENE_KEY });
        this.scene.pause();
        return;
      case 'reset':
        this.openResetDialog(service, current.language);
        return;
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
    if (this.resetDialogOpen || this.mutationPending) return;
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
    const dialogCopy = this.add.text(
      x,
      y - 22,
      copy.settings.resetBody,
      {
        fontFamily: 'monospace',
        fontSize: narrow ? '12px' : '13px',
        color: '#aeb6c8',
        align: 'center',
        lineSpacing: 4,
      },
    ).setOrigin(0.5).setDepth(2002);

    const buttonGap = 10;
    const buttonWidth = (width - 36 - buttonGap) / 2;
    const buttonHeight = 44;
    const buttonY = y + height / 2 - 43;
    const cancelX = x - (buttonWidth + buttonGap) / 2;
    const resetX = x + (buttonWidth + buttonGap) / 2;
    const buttons = this.add.graphics().setDepth(2002);
    buttons.fillStyle(0x263451, 1);
    buttons.fillRoundedRect(cancelX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 9);
    buttons.fillStyle(0xff4f57, 1);
    buttons.fillRoundedRect(resetX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 9);
    const cancelHit = this.add.zone(cancelX, buttonY, buttonWidth, buttonHeight)
      .setDepth(2003)
      .setInteractive({ useHandCursor: true });
    const confirmHit = this.add.zone(resetX, buttonY, buttonWidth, buttonHeight)
      .setDepth(2003)
      .setInteractive({ useHandCursor: true });
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
      && this.pointerGate.canActivate(pointer.id);
  }

  private getProfileService(): PlayerProfileService {
    const service = this.registry.get(PLAYER_PROFILE_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof PlayerProfileService)) {
      throw new Error('SettingsScene requires PlayerProfileService in Phaser registry.');
    }
    return service;
  }
}
