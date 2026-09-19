import type { PuzzleHint } from '../gameplay/HintService';
import { HumanRule, type HumanLineKind } from '../puzzle/human-solver/types';
import { CellState } from '../puzzle/types';
import type { SupportedLanguage } from './Language';

function ruLineLead(lineKind: HumanLineKind | undefined): string {
  if (lineKind === 'row') return 'В этой строке';
  if (lineKind === 'column') return 'В этом столбце';
  return 'По числовой подсказке';
}

function enLineLead(lineKind: HumanLineKind | undefined): string {
  if (lineKind === 'row') return 'This row';
  if (lineKind === 'column') return 'This column';
  return 'The numeric clue';
}

function ruDeduction(rule: HumanRule, state: PuzzleHint['state'], lineKind?: HumanLineKind): string {
  switch (rule) {
    case HumanRule.LineComplete:
      return state === CellState.Wall
        ? `${ruLineLead(lineKind)} уже набрано нужное число стен, поэтому новая стена здесь не нужна.`
        : `${ruLineLead(lineKind)} уже набрано нужное число стен. Отметьте здесь ПОЛ — это откроет следующий логический ход.`;
    case HumanRule.LineFill:
      return state === CellState.Wall
        ? `${ruLineLead(lineKind)} осталось ровно столько клеток, сколько ещё нужно стен. Здесь должна быть СТЕНА.`
        : `${ruLineLead(lineKind)} число уже определяет эту клетку как открытую.`;
    case HumanRule.Door:
      return state === CellState.Wall
        ? 'Направление прохода требует закрыть эту клетку СТЕНОЙ.'
        : 'Направление прохода требует оставить эту клетку открытой.';
    case HumanRule.TreasureRoomInterior:
      return state === CellState.Wall
        ? 'Эта клетка не может оставаться внутри допустимой комнаты 3×3 с сундуком. Здесь нужна СТЕНА.'
        : 'Для комнаты 3×3 с сундуком остался один вариант. Эта клетка должна быть открытой.';
    case HumanRule.TreasureRoomEntrance:
      return state === CellState.Wall
        ? 'У комнаты с сундуком уже есть единственный вход. Здесь должна быть СТЕНА.'
        : 'У комнаты с сундуком остался единственный возможный вход. Здесь нужен проход.';
    case HumanRule.TreasureRoomVariant:
      return state === CellState.Wall
        ? 'Во всех допустимых вариантах комнаты с сундуком эта клетка закрыта. Здесь должна быть СТЕНА.'
        : 'Во всех допустимых вариантах комнаты с сундуком эта клетка остаётся открытой.';
    case HumanRule.TreasureRoomStructuralConsensus:
      return state === CellState.Wall
        ? 'Все допустимые варианты комнаты требуют здесь СТЕНУ.'
        : 'Все допустимые варианты комнаты требуют оставить эту клетку открытой.';
    case HumanRule.TreasureRoomHypothesisConsequence:
      return state === CellState.Wall
        ? 'Как ни расположить допустимую комнату, дальнейшие правила требуют здесь СТЕНУ.'
        : 'Как ни расположить допустимую комнату, дальнейшие правила требуют оставить здесь проход.';
    case HumanRule.MonsterDeadEnd:
      return state === CellState.Wall
        ? 'У монстра уже есть единственный проход. Остальные соседние клетки должны быть СТЕНАМИ.'
        : 'У монстра остался только один возможный проход. Здесь должен быть ПОЛ.';
    case HumanRule.HallwayNotDeadEnd:
      return state === CellState.Wall
        ? 'Чтобы коридор не нарушал правило тупиков, здесь нужна СТЕНА.'
        : 'Тупик без монстра запрещён. Здесь нужно оставить проход.';
    case HumanRule.Open2x2:
      return state === CellState.Wall
        ? 'Три клетки квадрата 2×2 уже открыты вне комнаты с сундуком. Четвёртая должна быть СТЕНОЙ.'
        : 'Квадрат 2×2 без стен допустим только внутри комнаты с сундуком. Эта клетка должна остаться открытой.';
    case HumanRule.Connectivity:
      return state === CellState.Wall
        ? 'Чтобы все открытые клетки оставались связаны, здесь нужна СТЕНА.'
        : 'Если закрыть эту клетку, открытая область разделится. Здесь нужно оставить проход.';
    case HumanRule.Contradiction:
      return state === CellState.Wall
        ? 'Если считать эту клетку ПОЛОМ, правила приводят к противоречию. Значит здесь СТЕНА.'
        : 'Если поставить здесь СТЕНУ, правила приводят к противоречию. Значит клетка должна быть открытой.';
  }
}

function enDeduction(rule: HumanRule, state: PuzzleHint['state'], lineKind?: HumanLineKind): string {
  switch (rule) {
    case HumanRule.LineComplete:
      return state === CellState.Wall
        ? `${enLineLead(lineKind)} already has all of its required walls, so another wall is not needed here.`
        : `${enLineLead(lineKind)} already has all of its required walls. Mark this cell as FLOOR to expose the next logical move.`;
    case HumanRule.LineFill:
      return state === CellState.Wall
        ? `${enLineLead(lineKind)} has exactly as many cells left as walls still required. This cell must be a WALL.`
        : `${enLineLead(lineKind)} already forces this cell to stay open.`;
    case HumanRule.Door:
      return state === CellState.Wall
        ? 'The direction of this passage requires a WALL here.'
        : 'The direction of this passage requires this cell to stay open.';
    case HumanRule.TreasureRoomInterior:
      return state === CellState.Wall
        ? 'This cell cannot remain inside the valid 3×3 Chest room. It must be a WALL.'
        : 'Only one valid 3×3 Chest room remains. This cell must stay open.';
    case HumanRule.TreasureRoomEntrance:
      return state === CellState.Wall
        ? 'The Chest room already has its single entrance. This cell must be a WALL.'
        : 'Only one possible entrance to the Chest room remains. This cell must be a passage.';
    case HumanRule.TreasureRoomVariant:
      return state === CellState.Wall
        ? 'Every valid Chest-room arrangement closes this cell. It must be a WALL.'
        : 'Every valid Chest-room arrangement keeps this cell open.';
    case HumanRule.TreasureRoomStructuralConsensus:
      return state === CellState.Wall
        ? 'Every valid Chest-room arrangement requires a WALL here.'
        : 'Every valid Chest-room arrangement requires this cell to stay open.';
    case HumanRule.TreasureRoomHypothesisConsequence:
      return state === CellState.Wall
        ? 'Whichever valid Chest room is chosen, the remaining rules force a WALL here.'
        : 'Whichever valid Chest room is chosen, the remaining rules force this passage to stay open.';
    case HumanRule.MonsterDeadEnd:
      return state === CellState.Wall
        ? 'The monster already has its single passage. Its other neighboring cells must be WALLS.'
        : 'The monster has only one possible passage left. This cell must be FLOOR.';
    case HumanRule.HallwayNotDeadEnd:
      return state === CellState.Wall
        ? 'To keep the corridor from breaking the dead-end rule, this cell must be a WALL.'
        : 'A dead end without a monster is forbidden. Keep a passage open here.';
    case HumanRule.Open2x2:
      return state === CellState.Wall
        ? 'Three cells of this 2×2 are already open outside a Chest room. The fourth must be a WALL.'
        : 'An open 2×2 is allowed only inside a Chest room. This cell must stay open.';
    case HumanRule.Connectivity:
      return state === CellState.Wall
        ? 'To keep all open cells connected, this cell must be a WALL.'
        : 'A WALL here would split the open area. Keep this passage open.';
    case HumanRule.Contradiction:
      return state === CellState.Wall
        ? 'Assuming this cell is FLOOR leads to a contradiction. It must be a WALL.'
        : 'Putting a WALL here leads to a contradiction. This cell must stay open.';
  }
}

export function formatHintExplanation(language: SupportedLanguage, hint: PuzzleHint): string {
  if (hint.reason.kind === 'correction') {
    if (language === 'ru') {
      return hint.reason.currentState === CellState.Wall
        ? 'На поле уже есть неверная СТЕНА. Уберите её и оставьте клетку открытой.'
        : 'На поле уже есть неверная отметка ПОЛ. Исправьте её на СТЕНУ.';
    }

    return hint.reason.currentState === CellState.Wall
      ? 'There is already a wrong WALL on the board. Remove it and keep this cell open.'
      : 'There is already a wrong FLOOR mark on the board. Change it to a WALL.';
  }

  return language === 'ru'
    ? ruDeduction(hint.reason.rule, hint.state, hint.reason.lineKind)
    : enDeduction(hint.reason.rule, hint.state, hint.reason.lineKind);
}
