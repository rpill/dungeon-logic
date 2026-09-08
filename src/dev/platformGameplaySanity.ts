import { readFileSync } from 'node:fs';

import type { GameplayMarkupPort } from '../platform/services';
import { PlatformGameplayActivity } from '../runtime/PlatformGameplayActivity';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

class FakeGameplay implements GameplayMarkupPort {
  startCalls = 0;
  stopCalls = 0;

  async start(): Promise<void> {
    this.startCalls += 1;
  }

  async stop(): Promise<void> {
    this.stopCalls += 1;
  }
}

function runCoordinatorChecks(): void {
  const gameplay = new FakeGameplay();
  const activity = new PlatformGameplayActivity(gameplay, false);

  assert(!activity.isPlatformPaused(), 'Gameplay activity starts unpaused when the platform is active.');
  activity.startInternal();
  activity.startInternal();
  assert(gameplay.startCalls === 1, 'Internal gameplay start is idempotent.');

  activity.stopInternal();
  activity.stopInternal();
  assert(gameplay.stopCalls === 1, 'Internal gameplay stop is idempotent.');

  activity.startInternal();
  assert(gameplay.startCalls === 2, 'Internal gameplay can restart after an internal stop.');

  activity.pauseFromPlatform();
  assert(activity.isPlatformPaused(), 'Platform pause sets the platform blocker.');
  assert(gameplay.stopCalls === 1, 'Platform pause relies on Yandex automatic GameplayAPI.stop alignment.');

  activity.resumeFromPlatform(true);
  assert(!activity.isPlatformPaused(), 'Platform resume clears the platform blocker.');
  assert(gameplay.startCalls === 2, 'Platform resume relies on Yandex automatic GameplayAPI.start when gameplay was already active.');

  activity.pauseFromPlatform();
  activity.stopInternal();
  assert(gameplay.stopCalls === 2, 'An internal stop during platform pause explicitly cancels automatic resume eligibility.');
  activity.resumeFromPlatform(true);
  assert(gameplay.startCalls === 2, 'A platform resume does not restart gameplay after an internal stop.');

  const startupGameplay = new FakeGameplay();
  const startupPaused = new PlatformGameplayActivity(startupGameplay, true);
  startupPaused.startInternal();
  assert(startupGameplay.startCalls === 0, 'A level created under startup-ad pause does not mark gameplay active behind the ad.');
  startupPaused.resumeFromPlatform(true);
  assert(startupGameplay.startCalls === 1, 'First resume after startup-ad pause explicitly starts gameplay because it was never active before pause.');

  const blockedGameplay = new FakeGameplay();
  const blocked = new PlatformGameplayActivity(blockedGameplay, true);
  blocked.startInternal();
  blocked.resumeFromPlatform(false);
  assert(blockedGameplay.startCalls === 0, 'Platform resume does not start gameplay while an internal blocker is active.');
}

function runSourceWiringChecks(): void {
  const home = readFileSync(new URL('../scenes/HomeScene.ts', import.meta.url), 'utf8');
  const game = readFileSync(new URL('../scenes/GameScene.ts', import.meta.url), 'utf8');
  const boot = readFileSync(new URL('../scenes/BootScene.ts', import.meta.url), 'utf8');

  assert(home.includes('.readiness.ready()'), 'HomeScene signals Game Ready after creating an interactive home screen.');
  assert(game.includes('.readiness.ready()'), 'GameScene signals Game Ready for direct interactive launches.');
  assert(!boot.includes('.readiness.ready()'), 'BootScene does not signal Game Ready before interactive UI exists.');

  assert(game.includes('.lifecycle.subscribe('), 'GameScene subscribes to platform pause/resume lifecycle.');
  assert(game.includes('.lifecycle.isPaused()'), 'GameScene seeds startup-ad pause state before starting gameplay.');
  assert(game.includes('unsubscribePlatformLifecycle'), 'GameScene retains an unsubscribe handle for scene shutdown.');
  assert(game.includes('platformGameplayActivity'), 'GameScene routes gameplay markup through PlatformGameplayActivity.');
  assert(game.includes('solved || resetDialogOpen || hintConfirmOpen || sceneOverlayPaused'), 'Platform resume keeps board input disabled while Help overlay still owns the GameScene.');
}

runCoordinatorChecks();
runSourceWiringChecks();
console.info('[Dungeon Logic] Platform gameplay sanity: startup pause + Game Ready + gameplay markup wiring passed');
