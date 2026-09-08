import type { CampaignLevelEntry } from '../content/campaign/types';
import { PuzzleSessionService } from '../gameplay/PuzzleSessionService';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import { CellState, type LevelDefinition } from '../puzzle/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const level: LevelDefinition = {
  id: 'campaign-001',
  width: 3,
  height: 2,
  rowClues: [1, 1],
  columnClues: [1, 1, 0],
  monsters: [{ x: 2, y: 0 }],
  chests: [{ x: 0, y: 1 }],
  blockers: [],
  doors: [],
  solution: ['#..', '.#.'],
};

const manifest: readonly CampaignLevelEntry[] = [{
  slot: 1,
  id: level.id,
  level,
  chapterId: 'graveyard',
  onboarding: [],
}];

class FakeStorage implements PlayerProfileStorage {
  saved: unknown[] = [];
  async load(): Promise<unknown | null> { return null; }
  async save(profile: unknown): Promise<void> { this.saved.push(profile); }
}

async function main(): Promise<void> {
  const storage = new FakeStorage();
  const profileService = await PlayerProfileService.create(manifest, storage, { saveDelayMs: 60_000 });
  const first = PuzzleSessionService.createCampaign(level, profileService, undefined, 1234);
  const puzzle = first.getPuzzle();
  puzzle.setCellState(0, 0, CellState.Wall);
  puzzle.setCellState(1, 1, CellState.Floor);
  first.addActiveTime(4321);
  first.recordHint();
  const snapshot = first.saveNow();

  assert(snapshot.puzzleId === level.id, 'Snapshot keeps campaign level id.');
  assert(snapshot.cells[0][0] === CellState.Wall, 'Snapshot keeps editable wall.');
  assert(snapshot.cells[1][1] === CellState.Floor, 'Snapshot keeps editable floor.');
  assert(snapshot.cells[0][2] === CellState.Floor, 'Monster stays fixed Floor in snapshot.');
  assert(snapshot.cells[1][0] === CellState.Floor, 'Chest stays fixed Floor in snapshot.');
  assert(snapshot.activePlayMs === 4321, 'Snapshot keeps active play time.');
  assert(snapshot.hintsUsed === 1, 'Snapshot keeps hint count.');
  assert(profileService.getProfile().campaign.activePuzzle?.puzzleId === level.id, 'saveNow writes active puzzle into profile immediately.');
  assert(storage.saved.length === 0, 'saveNow relies on coalesced profile persistence instead of flushing storage immediately.');

  const restored = PuzzleSessionService.createCampaign(level, profileService, snapshot, 9999);
  assert(restored.getPuzzle().getCellState(0, 0) === CellState.Wall, 'Round-trip restores editable wall.');
  assert(restored.getPuzzle().getCellState(1, 1) === CellState.Floor, 'Round-trip restores editable floor.');
  assert(restored.getPuzzle().getCellState(2, 0) === CellState.Floor, 'Round-trip never changes Monster fixed state.');
  assert(restored.getPuzzle().getCellState(0, 1) === CellState.Floor, 'Round-trip never changes Chest fixed state.');
  assert(restored.getActivePlayMs() === 4321, 'Round-trip restores active time.');
  assert(restored.getHintsUsed() === 1, 'Round-trip restores hints used.');
  assert(restored.getStartedAtMs() === 1234, 'Round-trip preserves original startedAtMs.');

  const wrongId = { ...snapshot, puzzleId: 'campaign-999' };
  const freshFromWrongId = PuzzleSessionService.createCampaign(level, profileService, wrongId, 7777);
  assert(freshFromWrongId.getPuzzle().getCellState(0, 0) === CellState.Unknown, 'Wrong puzzle id falls back to fresh session.');
  assert(freshFromWrongId.getActivePlayMs() === 0, 'Wrong puzzle id drops stale timer.');
  assert(freshFromWrongId.getStartedAtMs() === 7777, 'Fresh fallback receives a new start timestamp.');

  const wrongWidth = { ...snapshot, cells: [[CellState.Wall]] };
  const freshFromWrongWidth = PuzzleSessionService.createCampaign(level, profileService, wrongWidth, 8888);
  assert(freshFromWrongWidth.getPuzzle().getCellState(0, 0) === CellState.Unknown, 'Wrong dimensions fall back to fresh session.');

  const corruptFixed = {
    ...snapshot,
    cells: snapshot.cells.map((row) => [...row]),
  };
  (corruptFixed.cells[0] as CellState[])[2] = CellState.Wall;
  const freshFromCorruptFixed = PuzzleSessionService.createCampaign(level, profileService, corruptFixed, 9990);
  assert(freshFromCorruptFixed.getPuzzle().getCellState(0, 0) === CellState.Unknown, 'Invalid fixed-cell state rejects the entire snapshot.');
  assert(freshFromCorruptFixed.getPuzzle().getCellState(2, 0) === CellState.Floor, 'Rejected snapshot restores canonical Monster state.');

  const corruptEnum = {
    ...snapshot,
    cells: snapshot.cells.map((row) => [...row]),
  };
  (corruptEnum.cells[0] as unknown[])[0] = 'lava';
  const freshFromCorruptEnum = PuzzleSessionService.createCampaign(level, profileService, corruptEnum as any, 9991);
  assert(freshFromCorruptEnum.getPuzzle().getCellState(0, 0) === CellState.Unknown, 'Unknown cell enum rejects snapshot.');

  first.clearActivePuzzle();
  assert(profileService.getProfile().campaign.activePuzzle === null, 'clearActivePuzzle clears only campaign active puzzle in memory.');
  await profileService.flush();

  console.info('[Dungeon Logic] Puzzle session sanity: round-trip + validation + coalesced profile autosave passed');
}

void main();
