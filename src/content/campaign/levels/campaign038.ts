import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-038",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    2,
    2,
    4,
    4,
    2,
    5
  ],
  "columnClues": [
    5,
    6,
    3,
    3,
    1,
    3,
    1
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 2,
      "y": 3
    },
    {
      "x": 4,
      "y": 6
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###....",
    "....#.#",
    ".##....",
    "##.#.#.",
    "##.#.#.",
    "##.....",
    "####.#."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3252276670,
  "sourceCandidateId": "generated-monster-only-7-3252276670",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 64,
  "humanStatus": "solved-with-contradiction"
};
