type AudioSuspensionListener = (suspended: boolean) => void;

let suspended = false;
const listeners = new Set<AudioSuspensionListener>();

export function isGlobalAudioSuspended(): boolean {
  return suspended;
}

export function setGlobalAudioSuspended(next: boolean): void {
  if (suspended === next) return;
  suspended = next;
  for (const listener of listeners) listener(suspended);
}

export function subscribeGlobalAudioSuspension(listener: AudioSuspensionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetGlobalAudioSuspensionForTests(): void {
  suspended = false;
}
