import Phaser from 'phaser';

import { HELP_SCENE_KEY } from '../help/HelpNavigation';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import { HOME_SCENE_KEY, SETTINGS_SCENE_KEY } from '../runtime/MetaSelectors';
import { MetaPointerGate } from '../runtime/MetaPointerGate';
import {
  SettingsService,
  detectVibrationSupport,
  type SupportedLanguage,
} from '../settings/SettingsService';
import { getSettingsRows, type SettingsRowId } from '../settings/SettingsViewModel';

export class SettingsScene extends Phaser.Scene {
  private readonly pointerGate = new MetaPointerGate();
  private resetDialogOpen = false;
  private mutationPending = false;

  constructor() {
    super(SETTINGS_SCENE_KEY);
  }

  create(): void {
    this.pointerGate.reset();
    this.resetDialogOpen = false;
    this.mutationPending = false;

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
    const narrow = this.scale.width < 700;

    this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x111318,
      1,
    ).setDepth(-1000);

    const back = this.add.text(16, narrow ? 17 : 20, '← ГЛАВНАЯ', {
      fontFamily: 'monospace',
      fontSize: narrow ? '12px' : '14px',
      color: '#89929d',
      fontStyle: 'bold',
    }).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    back.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.canActivate(pointer)) return;
      this.scene.start(HOME_SCENE_KEY);
    });

    const titleY = narrow ? 66 : 78;
    this.add.text(this.scale.width / 2, titleY, 'НАСТРОЙКИ', {
      fontFamily: 'monospace',
      fontSize: narrow ? '26px' : '32px',
      color: '#f0e6d2',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const width = Math.min(this.scale.width - (narrow ? 28 : 48), 650);
    const rowHeight = narrow ? 52 : 56;
    const rowGap = narrow ? 10 : 12;
    const rows = getSettingsRows(settings, settingsService.isVibrationSupported());
    const startY = titleY + (narrow ? 70 : 82);

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
      if (this.scene.isActive()) this.scene.restart();
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
    const fill = danger ? 0x2b2022 : 0x1b2027;
    const stroke = danger ? 0x7d4d52 : 0x4b535d;
    const labelColor = danger ? '#d58b91' : '#d8d1c4';
    const row = this.add.rectangle(this.scale.width / 2, y, width, height, fill, 1)
      .setStrokeStyle(1, stroke)
      .setInteractive({ useHandCursor: true });

    const left = this.scale.width / 2 - width / 2 + 18;
    const right = this.scale.width / 2 + width / 2 - 18;
    this.add.text(left, y, label, {
      fontFamily: 'monospace',
      fontSize: this.scale.width < 700 ? '14px' : '16px',
      color: labelColor,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    if (value !== null) {
      this.add.text(right, y, value, {
        fontFamily: 'monospace',
        fontSize: this.scale.width < 700 ? '13px' : '15px',
        color: danger ? '#d58b91' : '#d0b978',
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
    }

    row.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.canActivate(pointer)) return;
      void this.activateRow(id, service);
    });
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
        this.openResetDialog(service);
        return;
    }
  }

  private async persistSetting(mutation: () => Promise<void>): Promise<void> {
    if (this.mutationPending) return;
    this.mutationPending = true;
    try {
      await mutation();
      if (this.scene.isActive()) this.scene.restart();
    } catch (error) {
      this.mutationPending = false;
      console.warn('[Dungeon Logic] Could not persist Settings change.', error);
    }
  }

  private openResetDialog(service: SettingsService): void {
    if (this.resetDialogOpen || this.mutationPending) return;
    this.resetDialogOpen = true;

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
      0.65,
    ).setDepth(2000).setInteractive();
    const panel = this.add.rectangle(x, y, width, height, 0x20252c, 1)
      .setStrokeStyle(2, 0x7d4d52)
      .setDepth(2001);
    const title = this.add.text(x, y - height / 2 + 34, 'СБРОСИТЬ ПРОГРЕСС?', {
      fontFamily: 'monospace',
      fontSize: narrow ? '17px' : '19px',
      color: '#f0e6d2',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2002);
    const copy = this.add.text(
      x,
      y - 22,
      'Кампания, Daily, статистика и подсказки\nбудут удалены. Настройки сохранятся.',
      {
        fontFamily: 'monospace',
        fontSize: narrow ? '12px' : '13px',
        color: '#b8b1a5',
        align: 'center',
        lineSpacing: 4,
      },
    ).setOrigin(0.5).setDepth(2002);

    const buttonGap = 10;
    const buttonWidth = (width - 36 - buttonGap) / 2;
    const buttonY = y + height / 2 - 43;
    const cancelX = x - (buttonWidth + buttonGap) / 2;
    const resetX = x + (buttonWidth + buttonGap) / 2;
    const cancel = this.add.rectangle(cancelX, buttonY, buttonWidth, 44, 0x2a3038, 1)
      .setStrokeStyle(1, 0x5b636d)
      .setDepth(2002)
      .setInteractive({ useHandCursor: true });
    const confirm = this.add.rectangle(resetX, buttonY, buttonWidth, 44, 0x4a292d, 1)
      .setStrokeStyle(1, 0x9c5c63)
      .setDepth(2002)
      .setInteractive({ useHandCursor: true });
    const cancelLabel = this.add.text(cancelX, buttonY, 'ОТМЕНА', {
      fontFamily: 'monospace',
      fontSize: narrow ? '12px' : '13px',
      color: '#d8d1c4',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2003);
    const confirmLabel = this.add.text(resetX, buttonY, 'СБРОСИТЬ', {
      fontFamily: 'monospace',
      fontSize: narrow ? '12px' : '13px',
      color: '#e3a0a6',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2003);

    const destroyDialog = (): void => {
      blocker.destroy();
      panel.destroy();
      title.destroy();
      copy.destroy();
      cancel.destroy();
      confirm.destroy();
      cancelLabel.destroy();
      confirmLabel.destroy();
      this.resetDialogOpen = false;
    };

    cancel.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.pointerGate.canActivate(pointer.id) || this.mutationPending) return;
      destroyDialog();
    });
    confirm.on('pointerup', (pointer: Phaser.Input.Pointer) => {
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
