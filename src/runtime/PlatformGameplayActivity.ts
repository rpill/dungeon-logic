import type { GameplayMarkupPort } from '../platform/services';

export class PlatformGameplayActivity {
  private readonly gameplay: GameplayMarkupPort;
  private platformPaused: boolean;
  private desiredActive = false;
  private explicitActive = false;
  private autoResumeEligible = false;

  constructor(gameplay: GameplayMarkupPort, initiallyPlatformPaused: boolean) {
    this.gameplay = gameplay;
    this.platformPaused = initiallyPlatformPaused;
  }

  isPlatformPaused(): boolean {
    return this.platformPaused;
  }

  startInternal(): void {
    if (this.desiredActive) return;
    this.desiredActive = true;
    if (this.platformPaused || this.explicitActive) return;

    this.explicitActive = true;
    this.invoke(() => this.gameplay.start(), 'start');
  }

  stopInternal(): void {
    if (!this.desiredActive && !this.explicitActive) return;
    this.desiredActive = false;
    this.autoResumeEligible = false;
    if (!this.explicitActive) return;

    this.explicitActive = false;
    this.invoke(() => this.gameplay.stop(), 'stop');
  }

  pauseFromPlatform(): void {
    if (this.platformPaused) return;
    this.platformPaused = true;
    this.autoResumeEligible = this.desiredActive && this.explicitActive;
  }

  resumeFromPlatform(canResume: boolean): void {
    if (!this.platformPaused) return;
    this.platformPaused = false;

    const resumesAutomatically = this.autoResumeEligible;
    this.autoResumeEligible = false;

    if (!canResume) {
      this.stopInternal();
      return;
    }
    if (!this.desiredActive) return;
    if (resumesAutomatically && this.explicitActive) return;
    if (this.explicitActive) return;

    this.explicitActive = true;
    this.invoke(() => this.gameplay.start(), 'start');
  }

  private invoke(action: () => Promise<void>, name: 'start' | 'stop'): void {
    void action().catch((error) => {
      console.warn(`[Dungeon Logic] Platform gameplay ${name} transition failed; continuing gameplay.`, error);
    });
  }
}
