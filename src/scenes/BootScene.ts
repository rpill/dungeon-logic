import Phaser from 'phaser';

import {
  runSolverSanityChecks,
} from '../dev/solverSanity';

import {
  runValidatorSanityChecks,
} from '../dev/validatorSanity';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    const hostname =
      window.location.hostname;

    const isLocalDevelopment =
      hostname === 'localhost' ||
      hostname === '127.0.0.1';

    if (isLocalDevelopment) {
      runValidatorSanityChecks();
      runSolverSanityChecks();
    }

    this.scene.start('GameScene');
  }
}
