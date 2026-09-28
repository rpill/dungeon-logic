import type { GameLifecyclePort } from '../platform/services';
import { setGlobalAudioSuspended } from './AudioRuntimeState';

export interface AudioSoundManagerLike {
  pauseAll(): void;
  resumeAll(): void;
}

export interface VisibilityDocumentLike {
  readonly hidden: boolean;
  addEventListener(name: 'visibilitychange', handler: () => void): void;
  removeEventListener(name: 'visibilitychange', handler: () => void): void;
}

let currentUninstall: (() => void) | null = null;

export function installGlobalAudioLifecycle(
  sound: AudioSoundManagerLike,
  lifecycle: GameLifecyclePort,
  documentLike: VisibilityDocumentLike | null = typeof document === 'undefined' ? null : document,
): () => void {
  currentUninstall?.();

  let platformPaused = lifecycle.isPaused();
  let hidden = documentLike?.hidden === true;
  let appliedSuspended = platformPaused || hidden;
  let active = true;
  setGlobalAudioSuspended(appliedSuspended);
  if (appliedSuspended) sound.pauseAll();

  const apply = (): void => {
    if (!active) return;
    const next = platformPaused || hidden;
    if (appliedSuspended === next) return;
    appliedSuspended = next;
    setGlobalAudioSuspended(next);
    if (next) sound.pauseAll();
    else sound.resumeAll();
  };

  const unsubscribeLifecycle = lifecycle.subscribe({
    onPause: () => {
      platformPaused = true;
      apply();
    },
    onResume: () => {
      platformPaused = false;
      apply();
    },
  });
  const onVisibilityChange = (): void => {
    hidden = documentLike?.hidden === true;
    apply();
  };
  documentLike?.addEventListener('visibilitychange', onVisibilityChange);

  const uninstall = (): void => {
    if (!active) return;
    active = false;
    unsubscribeLifecycle();
    documentLike?.removeEventListener('visibilitychange', onVisibilityChange);
    setGlobalAudioSuspended(false);
    if (currentUninstall === uninstall) currentUninstall = null;
  };
  currentUninstall = uninstall;
  return uninstall;
}
