import Phaser from 'phaser';

import { BoardView } from '../board/BoardView';
import {
  calculateGameBoardLayout,
} from './GameBoardLayout';
import {
  buildGeneratedCandidatesUrl,
  parseGeneratedPlaytestSeed,
  resolveGeneratedCandidate,
  resolveLevel,
} from '../data/levels';

import {
  validatePuzzle,
} from '../puzzle/LevelValidator';

import { PuzzleState } from '../puzzle/PuzzleState';

import type {
  LevelDefinition,
} from '../puzzle/types';

export class GameScene extends Phaser.Scene {
  private createVersion = 0;

  constructor() {
    super('GameScene');
  }

  create(): void {
    const createVersion =
      this.createVersion + 1;

    this.createVersion =
      createVersion;

    void this.createGame(
      createVersion,
    );
  }

  private async createGame(
    createVersion: number,
  ): Promise<void> {
    this.add
      .text(
        this.scale.width / 2,
        52,
        'Dungeon Logic',
        {
          fontFamily: 'monospace',
          fontSize: '42px',
          color: '#f0e6d2',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(
        this.scale.width - 40,
        52,
        'Restart',
        {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#89929d',
          fontStyle: 'bold',
        },
      )
      .setOrigin(1, 0.5)
      .setInteractive({
        useHandCursor: true,
      })
      .on(
        'pointerdown',
        () => {
          this.scene.restart();
        },
      );

    const searchParams =
      new URLSearchParams(
        window.location.search,
      );

    const level =
      await this.resolveRuntimeLevel(
        searchParams,
      );

    if (
      createVersion !==
      this.createVersion
    ) {
      return;
    }

    const puzzle =
      new PuzzleState(level);

    const layout =
      calculateGameBoardLayout(
        this.scale.width,
        this.scale.height,
        level.width,
        level.height,
      );

    const {
      cellSize,
      originX,
      originY,
    } = layout;

    const statusText =
      this.add
        .text(
          this.scale.width / 2,
          this.scale.height - 42,
          'Hold left: Walls   •   Hold right: Floor marks',
          {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#89929d',
            fontStyle: 'bold',
          },
        )
        .setOrigin(0.5);

    let board:
      BoardView | null = null;

    let solved = false;

    const handlePuzzleChanged =
      (): void => {
        if (solved) {
          return;
        }

        const validation =
          validatePuzzle(puzzle);

        if (
          !validation.isSolved
        ) {
          return;
        }

        solved = true;

        board?.setInputEnabled(
          false,
        );

        statusText
          .setText(
            'Dungeon complete!',
          )
          .setColor(
            '#d8d1c4',
          );
      };

    board = new BoardView(
      this,
      puzzle,
      originX,
      originY,
      cellSize,
      handlePuzzleChanged,
    );
  }

  private async resolveRuntimeLevel(
    searchParams: URLSearchParams,
  ): Promise<LevelDefinition> {
    const fallback =
      resolveLevel(
        searchParams.get('level'),
      );

    const candidateId =
      searchParams.get('candidate');

    const seedValue =
      searchParams.get('seed');

    if (
      candidateId === null &&
      seedValue === null
    ) {
      return fallback;
    }

    if (!import.meta.env.DEV) {
      console.warn(
        '[Dungeon Logic] Generated candidate playtest is dev-only; using authored fallback.',
      );

      return fallback;
    }

    const seed =
      parseGeneratedPlaytestSeed(
        seedValue,
      );

    if (
      seed === null ||
      candidateId === null ||
      candidateId.length === 0
    ) {
      console.warn(
        '[Dungeon Logic] Generated candidate playtest requires valid ?seed=<uint32>&candidate=<id>; using authored fallback.',
      );

      return fallback;
    }

    try {
      const response =
        await fetch(
          buildGeneratedCandidatesUrl(
            seed,
          ),
          {
            cache: 'no-store',
          },
        );

      if (!response.ok) {
        console.warn(
          `[Dungeon Logic] Generated candidate report for seed ${seed} returned HTTP ${response.status}; using authored fallback.`,
        );

        return fallback;
      }

      const report: unknown =
        await response.json();

      const generatedLevel =
        resolveGeneratedCandidate(
          report,
          candidateId,
        );

      if (generatedLevel === null) {
        console.warn(
          `[Dungeon Logic] Generated candidate "${candidateId}" was not found in seed ${seed} report; using authored fallback.`,
        );

        return fallback;
      }

      console.info(
        `[Dungeon Logic] Playtesting generated candidate ${candidateId} from seed ${seed}.`,
      );

      return generatedLevel;
    } catch (error) {
      console.warn(
        '[Dungeon Logic] Failed to load generated candidate report; using authored fallback.',
        error,
      );

      return fallback;
    }
  }
}
