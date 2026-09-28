import { isGlobalAudioSuspended, resetGlobalAudioSuspensionForTests } from '../audio/AudioRuntimeState';
import { installGlobalAudioLifecycle, type AudioSoundManagerLike, type VisibilityDocumentLike } from '../audio/GlobalAudioLifecycle';
import type { GameLifecycleHandlers, GameLifecyclePort } from '../platform/services';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

class FakeLifecycle implements GameLifecyclePort {
  paused = false;
  handlers = new Set<GameLifecycleHandlers>();
  isPaused(): boolean { return this.paused; }
  subscribe(handlers: GameLifecycleHandlers): () => void {
    this.handlers.add(handlers);
    return () => this.handlers.delete(handlers);
  }
  pause(): void { this.paused = true; for (const h of this.handlers) h.onPause(); }
  resume(): void { this.paused = false; for (const h of this.handlers) h.onResume(); }
}

class FakeDocument implements VisibilityDocumentLike {
  hidden = false;
  private readonly listeners = new Set<() => void>();
  addEventListener(_name: 'visibilitychange', handler: () => void): void { this.listeners.add(handler); }
  removeEventListener(_name: 'visibilitychange', handler: () => void): void { this.listeners.delete(handler); }
  setHidden(hidden: boolean): void { this.hidden = hidden; for (const handler of this.listeners) handler(); }
}

class FakeSound implements AudioSoundManagerLike {
  pauses = 0;
  resumes = 0;
  pauseAll(): void { this.pauses += 1; }
  resumeAll(): void { this.resumes += 1; }
}

resetGlobalAudioSuspensionForTests();
const lifecycle = new FakeLifecycle();
const documentLike = new FakeDocument();
const sound = new FakeSound();
const uninstall = installGlobalAudioLifecycle(sound, lifecycle, documentLike);

assert(!isGlobalAudioSuspended(), 'Audio starts unsuspended when platform and document are active.');
lifecycle.pause();
assert(isGlobalAudioSuspended() && Number(sound.pauses) === 1, 'Platform pause suspends all audio once.');
documentLike.setHidden(true);
lifecycle.resume();
assert(isGlobalAudioSuspended() && Number(sound.resumes) === 0, 'Platform resume cannot resume audio while document remains hidden.');
documentLike.setHidden(false);
assert(!isGlobalAudioSuspended() && Number(sound.resumes) === 1, 'Audio resumes only after every suspension reason clears.');
documentLike.setHidden(true);
assert(Number(sound.pauses) === 2, 'Visibility loss suspends audio outside GameScene too.');
uninstall();
assert(!isGlobalAudioSuspended(), 'Uninstall clears the global suspended state.');

console.info('[Dungeon Logic] Global audio lifecycle sanity passed');
