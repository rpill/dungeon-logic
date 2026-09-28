import type Phaser from 'phaser';

import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  type PlayerProfileService,
} from '../profile/PlayerProfileService';
import { AUDIO_KEYS } from './AudioAssets';
import { isGlobalAudioSuspended } from './AudioRuntimeState';

export type AudioFeedbackEvent =
  | 'ui-click'
  | 'campaign-unlock'
  | 'wall-place'
  | 'wall-remove'
  | 'marker-toggle'
  | 'undo'
  | 'reset'
  | 'hint'
  | 'error'
  | 'complete';

interface FeedbackDefinition {
  readonly keys: readonly string[];
  readonly volume: number;
  readonly rateVariance: number;
  readonly cooldownMs: number;
}

const FEEDBACK: Readonly<Record<AudioFeedbackEvent, FeedbackDefinition>> = {
  'ui-click': {
    keys: [AUDIO_KEYS.uiClick],
    volume: 0.11,
    rateVariance: 0,
    cooldownMs: 28,
  },
  'campaign-unlock': {
    keys: [AUDIO_KEYS.wallRemove],
    volume: 0.12,
    rateVariance: 0.06,
    cooldownMs: 80,
  },
  'wall-place': {
    keys: [AUDIO_KEYS.wallPlace],
    volume: 0.16,
    rateVariance: 0,
    cooldownMs: 28,
  },
  'wall-remove': {
    keys: [AUDIO_KEYS.wallRemove],
    volume: 0.16,
    rateVariance: 0,
    cooldownMs: 28,
  },
  'marker-toggle': {
    keys: [AUDIO_KEYS.markerToggle],
    volume: 0.05,
    rateVariance: 0,
    cooldownMs: 22,
  },
  undo: {
    keys: [AUDIO_KEYS.undo],
    volume: 0.18,
    rateVariance: 0,
    cooldownMs: 45,
  },
  reset: {
    keys: [AUDIO_KEYS.reset],
    volume: 0.24,
    rateVariance: 0,
    cooldownMs: 120,
  },
  hint: {
    keys: [AUDIO_KEYS.hint],
    volume: 0.20,
    rateVariance: 0,
    cooldownMs: 120,
  },
  error: {
    keys: [AUDIO_KEYS.error],
    volume: 0.18,
    rateVariance: 0,
    cooldownMs: 90,
  },
  complete: {
    keys: [AUDIO_KEYS.complete],
    volume: 0.18,
    rateVariance: 0,
    cooldownMs: 600,
  },
};

const SCENE_SERVICES = new WeakMap<Phaser.Scene, AudioFeedbackService>();

function readProfileService(scene: Phaser.Scene): PlayerProfileService | null {
  const value = scene.registry.get(PLAYER_PROFILE_SERVICE_REGISTRY_KEY) as unknown;
  if (
    value !== null
    && typeof value === 'object'
    && 'getProfile' in value
    && typeof (value as { getProfile?: unknown }).getProfile === 'function'
  ) {
    return value as PlayerProfileService;
  }
  return null;
}

function randomRate(variance: number): number {
  if (variance <= 0) return 1;
  return 1 + (Math.random() * 2 - 1) * variance;
}

export class AudioFeedbackService {
  private readonly scene: Phaser.Scene;
  private readonly lastPlayedAt = new Map<AudioFeedbackEvent, number>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  play(event: AudioFeedbackEvent): void {
    if (isGlobalAudioSuspended()) return;
    const definition = FEEDBACK[event];
    const now = Date.now();
    const previous = this.lastPlayedAt.get(event) ?? -Infinity;
    if (now - previous < definition.cooldownMs) return;
    this.lastPlayedAt.set(event, now);

    const settings = readProfileService(this.scene)?.getProfile().settings;
    const soundEnabled = settings?.soundEnabled ?? true;

    if (soundEnabled) {
      const key = this.chooseKey(definition.keys);
      if (this.scene.cache.audio.exists(key)) {
        this.scene.sound.play(key, {
          volume: definition.volume,
          rate: randomRate(definition.rateVariance),
        });
      }
    }
  }

  private chooseKey(keys: readonly string[]): string {
    if (keys.length <= 1) return keys[0]!;
    return keys[Math.floor(Math.random() * keys.length)] ?? keys[0]!;
  }

}

export function getAudioFeedback(scene: Phaser.Scene): AudioFeedbackService {
  const existing = SCENE_SERVICES.get(scene);
  if (existing !== undefined) return existing;
  const created = new AudioFeedbackService(scene);
  SCENE_SERVICES.set(scene, created);
  return created;
}
