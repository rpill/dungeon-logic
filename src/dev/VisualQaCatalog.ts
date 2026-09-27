/** Development review states. This module is loaded only by the DEV boot route. */
export interface VisualQaState {
  readonly id: string;
  readonly group: string;
  readonly label: string;
  readonly fixture: string;
  readonly scene: 'catalog' | 'home' | 'levels' | 'daily' | 'leaderboard' | 'mastery' | 'challenge' | 'game' | 'settings' | 'help' | 'rankup' | 'master-rating';
  readonly detail?: string;
}

const rows: readonly VisualQaState[] = [
  { id: 'catalog', group: 'QA', label: 'Каталог состояний', fixture: 'mid', scene: 'catalog' },
  ...([['fresh', 'Новый профиль'], ['mid', 'Средний прогресс'], ['vii', 'Ранг VII'], ['master', 'MASTER']] as const)
    .map(([fixture, label]) => ({ id: `home-${fixture}`, group: 'Home', label, fixture, scene: 'home' as const })),
  { id: 'home-solved', group: 'Home', label: 'Daily решено', fixture: 'daily-solved', scene: 'home' },
  { id: 'home-unavailable', group: 'Home', label: 'Daily недоступно', fixture: 'daily-unavailable', scene: 'home' },
  { id: 'home-freeplay', group: 'Home', label: 'Испытание: свободная игра', fixture: 'freeplay', scene: 'home' },
  { id: 'levels-first', group: 'Levels', label: 'Первая строка', fixture: 'fresh', scene: 'levels' },
  { id: 'levels-partial', group: 'Levels', label: 'Частично пройдено', fixture: 'partial', scene: 'levels' },
  { id: 'levels-started', group: 'Levels', label: 'Начатый уровень', fixture: 'started', scene: 'levels' },
  { id: 'levels-locked', group: 'Levels', label: 'Следующая строка закрыта', fixture: 'row-locked', scene: 'levels' },
  { id: 'levels-row-unlock', group: 'Levels', label: 'Открытие следующей строки', fixture: 'row-unlock', scene: 'levels' },
  { id: 'levels-multi', group: 'Levels', label: 'Открыто несколько строк', fixture: 'mid', scene: 'levels', detail: 'page-2' },
  { id: 'levels-complete', group: 'Levels', label: 'Кампания пройдена', fixture: 'master', scene: 'levels', detail: 'last-page' },
  ...([
    ['unsolved', 'Сегодня не решено', 'mid'], ['solved', 'Сегодня решено', 'daily-solved'],
    ['repeat', 'Повторное открытие', 'daily-solved'], ['past-solved', 'Прошлый день решён', 'past-solved'],
    ['past-missed', 'Прошлый день пропущен', 'mid'], ['future', 'Будущие дни закрыты', 'mid'],
    ['streak', 'Активная серия', 'streak'], ['unavailable', 'Daily недоступен', 'daily-unavailable'],
    ['loading', 'Загрузка Daily', 'daily-loading'],
    ['archive-months', 'Переключение месяцев архива', 'mid'],
  ] as const).map(([detail, label, fixture]) => ({ id: `daily-${detail}`, group: 'Daily', label, fixture, scene: 'daily' as const, detail })),
  ...([
    ['no-own', 'Нет личного результата', 'mid'], ['own', 'Личный результат', 'daily-solved'],
    ['populated', 'Заполненный рейтинг', 'daily-solved'], ['empty', 'Пустой рейтинг', 'mid'],
    ['unavailable', 'Сервис недоступен', 'mid'], ['loading', 'Загрузка таблицы', 'mid'],
    ['long-name', 'Длинные имена и значения', 'daily-solved'],
  ] as const).map(([detail, label, fixture]) => ({ id: `leaderboard-${detail}`, group: 'Daily leaderboard', label, fixture, scene: 'leaderboard' as const, detail })),
  ...([
    ['i', 'Ранг I', 'fresh'], ['iii', 'Ранг III', 'iii'], ['vii', 'Ранг VII', 'vii'],
    ['master', 'MASTER', 'master'], ['almost', 'До ранга один шаг', 'almost'],
    ['mixed', 'Смешанное выполнение требований', 'mixed'],
  ] as const).map(([detail, label, fixture]) => ({ id: `mastery-${detail}`, group: 'Mastery', label, fixture, scene: 'mastery' as const, detail })),
  { id: 'challenge-locked', group: 'Challenge', label: 'Закрыто', fixture: 'fresh', scene: 'home' },
  { id: 'challenge-first', group: 'Challenge', label: 'Первая загадка', fixture: 'mid', scene: 'game', detail: 'endless-0' },
  { id: 'challenge-active', group: 'Challenge', label: 'Активный прогресс', fixture: 'vii', scene: 'game', detail: 'endless-12' },
  { id: 'challenge-complete', group: 'Challenge', label: 'Победа', fixture: 'vii', scene: 'game', detail: 'completion-endless' },
  { id: 'game-campaign-small', group: 'Gameplay', label: 'Кампания, малая доска', fixture: 'fresh', scene: 'game', detail: 'campaign-1' },
  { id: 'game-campaign-large', group: 'Gameplay', label: 'Кампания, большая доска', fixture: 'fresh', scene: 'game', detail: 'campaign-large' },
  { id: 'game-campaign-chest', group: 'Gameplay', label: 'Кампания, сундук', fixture: 'fresh', scene: 'game', detail: 'campaign-chest' },
  { id: 'game-daily', group: 'Gameplay', label: 'Daily', fixture: 'mid', scene: 'game', detail: 'daily' },
  { id: 'game-challenge', group: 'Gameplay', label: 'Испытание', fixture: 'mid', scene: 'game', detail: 'endless-0' },
  { id: 'completion-campaign', group: 'Completion', label: 'Победа: кампания', fixture: 'mid', scene: 'game', detail: 'completion-campaign' },
  { id: 'completion-campaign-large', group: 'Completion', label: 'Кампания: большое поле', fixture: 'fresh', scene: 'game', detail: 'completion-campaign-large' },
  { id: 'completion-campaign-final', group: 'Completion', label: 'Кампания завершена', fixture: 'master', scene: 'game', detail: 'completion-campaign-final' },
  { id: 'completion-tutorial', group: 'Completion', label: 'Урок пройден', fixture: 'tutorial', scene: 'game', detail: 'completion-tutorial' },
  { id: 'completion-tutorial-final', group: 'Completion', label: 'Обучение завершено', fixture: 'tutorial', scene: 'game', detail: 'completion-tutorial-final' },
  { id: 'completion-daily', group: 'Completion', label: 'Победа: Daily', fixture: 'mid', scene: 'game', detail: 'completion-daily' },
  { id: 'completion-daily-repeat', group: 'Completion', label: 'Повтор Daily', fixture: 'daily-solved', scene: 'game', detail: 'completion-daily-repeat' },
  { id: 'completion-daily-archive', group: 'Completion', label: 'Архив Daily', fixture: 'mid', scene: 'game', detail: 'completion-daily-archive' },
  { id: 'completion-daily-assisted', group: 'Completion', label: 'Daily с подсказкой', fixture: 'mid', scene: 'game', detail: 'completion-daily-assisted' },
  { id: 'completion-challenge', group: 'Completion', label: 'Победа: испытание', fixture: 'mid', scene: 'game', detail: 'completion-endless' },
  { id: 'completion-challenge-large', group: 'Completion', label: 'Испытание: большое поле', fixture: 'mid', scene: 'game', detail: 'completion-endless-large' },
  { id: 'completion-challenge-final', group: 'Completion', label: 'Каталог Испытания пройден', fixture: 'freeplay', scene: 'game', detail: 'completion-endless-final' },
  ...([['early', 'I → II', 'II'], ['middle', 'IV → V', 'V'], ['high', 'VII → VIII', 'VIII'], ['master', 'VIII → MASTER', 'MASTER']] as const)
    .map(([detail, label, fixture]) => ({ id: `rankup-${detail}`, group: 'Rank Up', label, fixture, scene: 'rankup' as const, detail })),
  { id: 'rankup-rating-milestone', group: 'Rank Up', label: 'MASTER rating milestone', fixture: 'master', scene: 'rankup', detail: 'rating-milestone' },
  { id: 'modal-settings', group: 'Modals & pages', label: 'Настройки', fixture: 'mid', scene: 'settings' },
  { id: 'modal-settings-en-off', group: 'Modals & pages', label: 'Settings: EN, выключен звук', fixture: 'settings-en-off', scene: 'settings' },
  { id: 'modal-game-menu', group: 'Modals & pages', label: 'Меню игры', fixture: 'fresh', scene: 'game', detail: 'menu' },
  { id: 'modal-game-menu-large', group: 'Modals & pages', label: 'Меню игры: большая доска', fixture: 'fresh', scene: 'game', detail: 'menu-large' },
  { id: 'modal-reset', group: 'Modals & pages', label: 'Подтверждение сброса', fixture: 'fresh', scene: 'game', detail: 'reset' },
  { id: 'modal-skip', group: 'Modals & pages', label: 'Подтверждение пропуска', fixture: 'mid', scene: 'game', detail: 'skip' },
  { id: 'modal-skip-large', group: 'Modals & pages', label: 'Пропуск: большая доска', fixture: 'mid', scene: 'game', detail: 'skip-large' },
  { id: 'modal-hint', group: 'Modals & pages', label: 'Подтверждение подсказки', fixture: 'fresh', scene: 'game', detail: 'hint' },
  { id: 'game-hint-explanation', group: 'Gameplay', label: 'Объяснение подсказки', fixture: 'fresh', scene: 'game', detail: 'hint-explanation' },
  { id: 'game-hint-explanation-large', group: 'Gameplay', label: 'Объяснение: большая доска', fixture: 'fresh', scene: 'game', detail: 'hint-explanation-large' },
  { id: 'modal-rules', group: 'Modals & pages', label: 'Правила', fixture: 'mid', scene: 'help' },
  { id: 'modal-rules-en', group: 'Modals & pages', label: 'Rules: English', fixture: 'settings-en-off', scene: 'help' },
  { id: 'master-rating', group: 'Modals & pages', label: 'Рейтинг мастеров', fixture: 'master', scene: 'master-rating' },
  ...([
    ['loading', 'Загрузка рейтинга'], ['populated', 'Заполненный рейтинг'],
    ['own', 'Свой результат'], ['no-own', 'Без своего результата'],
    ['own-below-top', 'Свой результат вне первой десятки'],
    ['sign-in', 'Требуется вход'],
    ['empty', 'Пустой рейтинг'], ['unavailable', 'Сервис недоступен'],
    ['long-name', 'Длинные имена и значения'],
  ] as const).map(([detail, label]) => ({ id: `master-rating-${detail}`, group: 'Master Rating', label, fixture: detail === 'long-name' ? 'master-long' : 'master', scene: 'master-rating' as const, detail })),
  ...[1, 2, 3, 4, 5].map((index) => ({ id: `tutorial-${index}`, group: 'Tutorial', label: `Урок ${index}`, fixture: 'tutorial', scene: 'game' as const, detail: `tutorial-${index}` })),
];

export const VISUAL_QA_STATES = rows;

export function findVisualQaState(id: string): VisualQaState | null {
  return VISUAL_QA_STATES.find((state) => state.id === id) ?? null;
}
