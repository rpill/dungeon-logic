import type { SupportedLanguage } from './Language';

export type LevelSelectState = 'completed' | 'current' | 'unlocked' | 'locked';

export interface UiCopy {
  readonly common: {
    readonly backHome: string;
    readonly back: string;
    readonly levels: string;
    readonly statistics: string;
    readonly leaderboard: string;
    readonly settings: string;
    readonly howToPlay: string;
    readonly tutorial: string;
    readonly cancel: string;
    readonly reset: string;
    readonly solved: string;
    readonly available: string;
    readonly locked: string;
    readonly loading: string;
  };
  readonly levelSelect: {
    readonly continueLevel: (slot: number) => string;
    readonly level: (slot: number) => string;
    readonly state: Readonly<Record<LevelSelectState, string>>;
  };
  readonly home: {
    readonly levelsProgress: (completed: number, total: number) => string;
    readonly chooseLevel: string;
    readonly start: string;
    readonly continue: string;
    readonly tutorialStart: string;
    readonly tutorialContinue: string;
    readonly tutorialReplay: string;
    readonly levelContext: (slot: number) => string;
    readonly dailyUnavailable: string;
    readonly noDailyForTrustedDate: string;
    readonly dailySolved: string;
    readonly dailyNew: string;
    readonly streakSuffix: (streak: number) => string;
    readonly best: (time: string, streakSuffix: string) => string;
    readonly today: (streakSuffix: string) => string;
  };
  readonly settings: {
    readonly title: string;
    readonly music: string;
    readonly sound: string;
    readonly vibration: string;
    readonly language: string;
    readonly help: string;
    readonly resetProgress: string;
    readonly on: string;
    readonly off: string;
    readonly languageName: Readonly<Record<SupportedLanguage, string>>;
    readonly resetTitle: string;
    readonly resetBody: string;
  };
  readonly help: {
    readonly title: string;
    readonly utilityTitle: string;
  };
  readonly stats: {
    readonly title: string;
    readonly months: readonly string[];
    readonly weekdays: readonly string[];
    readonly campaign: string;
    readonly daily: string;
    readonly overall: string;
    readonly solved: (solved: number, total: number) => string;
    readonly withoutHints: (count: number) => string;
    readonly totalSolved: (count: number) => string;
    readonly streakBest: (current: string, best: number) => string;
    readonly activeTime: (duration: string) => string;
    readonly puzzlesSolved: (count: number) => string;
    readonly hints: (count: number) => string;
    readonly dailyCalendar: string;
    readonly noTrustedDate: string;
    readonly dailyMonth: (month: string, year: number) => string;
  };
  readonly dailyHub: {
    readonly title: string;
    readonly todayTitle: string;
    readonly archiveTitle: string;
    readonly playToday: string;
    readonly leaderboard: string;
    readonly todaySolved: (time: string) => string;
    readonly todaySolvedOutsideRating: (time: string) => string;
    readonly todayUnsolved: string;
    readonly todayUnavailable: string;
    readonly archiveProgress: (solved: number, total: number) => string;
    readonly archiveNotSolved: string;
    readonly archiveFirstResult: (time: string) => string;
    readonly archivePlay: string;
    readonly archiveReplay: string;
    readonly archiveOutsideRating: string;
    readonly archiveEmpty: string;
  };
  readonly leaderboard: {
    readonly title: string;
    readonly back: string;
    readonly firstResultOnly: string;
    readonly yourResult: (time: string) => string;
    readonly yourPlace: (place: number) => string;
    readonly signInTitle: string;
    readonly signInBody: string;
    readonly signIn: string;
    readonly unavailable: string;
    readonly noEntries: string;
    readonly playerFallback: string;
    readonly currentPlayerSuffix: string;
  };
  readonly game: {
    readonly back: string;
    readonly levelTitle: (slot: number) => string;
    readonly dailyTitle: string;
    readonly tutorialTitle: (slot: number, total: number) => string;
    readonly tutorialComplete: string;
    readonly startLevels: string;
    readonly rules: string;
    readonly menu: string;
    readonly continueGame: string;
    readonly exitLevels: string;
    readonly exitDaily: string;
    readonly exitHome: string;
    readonly mouseControls: string;
    readonly wall: string;
    readonly floor: string;
    readonly undo: string;
    readonly reset: string;
    readonly hint: string;
    readonly hintFree: (remaining: number) => string;
    readonly hintRewarded: string;
    readonly hintLocked: (time: string) => string;
    readonly hintRechargeStatus: (time: string) => string;
    readonly dailyHintOutsideRating: string;
    readonly onboardingTouchWall: string;
    readonly onboardingTouchFloor: string;
    readonly onboardingMouseWall: string;
    readonly onboardingMouseFloor: string;
    readonly onboardingDismiss: string;
    readonly hintWall: string;
    readonly hintFloor: string;
    readonly loadingAd: string;
    readonly show: string;
    readonly ad: string;
    readonly rewardedPrompt: string;
    readonly freeHintPrompt: (remaining: number) => string;
    readonly withoutHints: string;
    readonly hintsCount: (count: number) => string;
    readonly newRecord: string;
    readonly featuresUnlocked: string;
    readonly solvedCampaign: (time: string, hintCopy: string, recordCopy: string, unlockCopy: string) => string;
    readonly next: string;
    readonly solvedDaily: (time: string, hintCopy: string, recordCopy: string) => string;
    readonly dailyPractice: string;
    readonly dailyResultFixed: string;
    readonly dailyPlace: (place: number) => string;
    readonly dailyArchiveComplete: string;
    readonly dailyArchiveOutsideRating: string;
    readonly dailyArchiveFirstResult: (time: string) => string;
    readonly streakRecent: (streak: number, recent: string) => string;
    readonly home: string;
    readonly resetTitle: string;
    readonly resetBody: string;
  };
}

const RU: UiCopy = {
  common: {
    backHome: '← ГЛАВНАЯ',
    back: '← НАЗАД',
    levels: 'УРОВНИ',
    statistics: 'СТАТИСТИКА',
    leaderboard: 'ТАБЛИЦА ЛИДЕРОВ',
    settings: 'НАСТРОЙКИ',
    howToPlay: 'ⓘ КАК ИГРАТЬ',
    tutorial: 'ОБУЧЕНИЕ',
    cancel: 'ОТМЕНА',
    reset: 'СБРОСИТЬ',
    solved: 'РЕШЕНО',
    available: 'ДОСТУПНО',
    locked: 'ЗАКРЫТО',
    loading: 'ЗАГРУЗКА…',
  },
  levelSelect: {
    continueLevel: (slot) => `ПРОДОЛЖИТЬ · УРОВЕНЬ ${slot}`,
    level: (slot) => `Уровень ${slot}`,
    state: {
      completed: 'РЕШЁН',
      current: 'ТЕКУЩИЙ',
      unlocked: 'ДОСТУПЕН',
      locked: 'ЗАКРЫТ',
    },
  },
  home: {
    levelsProgress: (completed, total) => `Уровни · ${completed} / ${total}`,
    chooseLevel: 'ВЫБРАТЬ УРОВЕНЬ',
    start: 'НАЧАТЬ',
    continue: 'ПРОДОЛЖИТЬ',
    tutorialStart: 'НАЧАТЬ ОБУЧЕНИЕ',
    tutorialContinue: 'ПРОДОЛЖИТЬ ОБУЧЕНИЕ',
    tutorialReplay: 'ПРОЙТИ ОБУЧЕНИЕ СНОВА',
    levelContext: (slot) => `Уровень ${String(slot).padStart(2, '0')}`,
    dailyUnavailable: 'DAILY · НЕДОСТУПНО',
    noDailyForTrustedDate: 'Нет задания на доверенную дату',
    dailySolved: 'DAILY · РЕШЕНО',
    dailyNew: 'DAILY · НОВАЯ',
    streakSuffix: (streak) => streak > 0 ? ` · Серия ${streak}` : '',
    best: (time, streakSuffix) => `Результат ${time}${streakSuffix}`,
    today: (streakSuffix) => `Сегодня${streakSuffix}`,
  },
  settings: {
    title: 'НАСТРОЙКИ',
    music: 'МУЗЫКА',
    sound: 'ЗВУК',
    vibration: 'ВИБРАЦИЯ',
    language: 'ЯЗЫК',
    help: 'КАК ИГРАТЬ',
    resetProgress: 'СБРОСИТЬ ПРОГРЕСС',
    on: 'ВКЛ',
    off: 'ВЫКЛ',
    languageName: { ru: 'РУССКИЙ', en: 'ENGLISH' },
    resetTitle: 'СБРОСИТЬ ПРОГРЕСС?',
    resetBody: 'Кампания, Daily, статистика и подсказки\nбудут удалены. Настройки сохранятся.',
  },
  help: {
    title: 'КАК ИГРАТЬ',
    utilityTitle: 'УПРАВЛЕНИЕ',
  },
  stats: {
    title: 'СТАТИСТИКА',
    months: ['ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ', 'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ'],
    weekdays: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'],
    campaign: 'КАМПАНИЯ',
    daily: 'DAILY',
    overall: 'ОБЩЕЕ',
    solved: (solved, total) => `Решено ${solved} / ${total}`,
    withoutHints: (count) => `Без подсказок ${count}`,
    totalSolved: (count) => `Всего решено ${count}`,
    streakBest: (current, best) => `Серия ${current} · Лучшая ${best}`,
    activeTime: (duration) => `Активное время ${duration}`,
    puzzlesSolved: (count) => `Решено задач ${count}`,
    hints: (count) => `Подсказок ${count}`,
    dailyCalendar: 'DAILY · КАЛЕНДАРЬ',
    noTrustedDate: 'Недоступно без доверенной даты',
    dailyMonth: (month, year) => `DAILY · ${month} ${year}`,
  },
  dailyHub: {
    title: 'DAILY',
    todayTitle: 'СЕГОДНЯ',
    archiveTitle: 'КАЛЕНДАРЬ',
    playToday: 'ИГРАТЬ СЕГОДНЯ',
    leaderboard: 'ТАБЛИЦА ЛИДЕРОВ',
    todaySolved: (time) => `Результат зафиксирован · ${time}`,
    todaySolvedOutsideRating: (time) => `Пройдено вне рейтинга · ${time}`,
    todayUnsolved: 'Первое успешное прохождение идёт в рейтинг.',
    todayUnavailable: 'На доверенную сегодняшнюю дату задания нет.',
    archiveProgress: (solved, total) => `Пройдено ${solved} / ${total}`,
    archiveNotSolved: 'НЕ ПРОЙДЕНО',
    archiveFirstResult: (time) => `Первое время · ${time}`,
    archivePlay: 'ИГРАТЬ',
    archiveReplay: 'ПЕРЕИГРАТЬ',
    archiveOutsideRating: 'Архивные Daily проходят вне рейтинга.',
    archiveEmpty: 'Старых Daily пока нет.',
  },
  leaderboard: {
    title: 'DAILY · ТАБЛИЦА ЛИДЕРОВ',
    back: '← ГЛАВНАЯ',
    firstResultOnly: 'В зачёт идёт только первое успешное прохождение.',
    yourResult: (time) => `Твой результат · ${time}`,
    yourPlace: (place) => `Твоё место · #${place}`,
    signInTitle: 'ВОЙДИ В ЯНДЕКС',
    signInBody: 'Чтобы твой зафиксированный результат попал в общий рейтинг.',
    signIn: 'ВОЙТИ',
    unavailable: 'Таблица лидеров сейчас недоступна.',
    noEntries: 'Пока нет результатов.',
    playerFallback: 'Игрок',
    currentPlayerSuffix: ' · ВЫ',
  },
  game: {
    back: '← НАЗАД',
    levelTitle: (slot) => `УРОВЕНЬ ${slot}`,
    dailyTitle: 'DAILY',
    tutorialTitle: (slot, total) => `ОБУЧЕНИЕ ${slot} / ${total}`,
    tutorialComplete: 'ОБУЧЕНИЕ ПРОЙДЕНО\nТы знаешь все правила подземелья.',
    startLevels: 'НАЧАТЬ ИГРУ',
    rules: 'ПРАВИЛА',
    menu: 'МЕНЮ',
    continueGame: 'ПРОДОЛЖИТЬ',
    exitLevels: 'ВЫЙТИ В УРОВНИ',
    exitDaily: 'ВЫЙТИ В DAILY',
    exitHome: 'ВЫЙТИ НА ГЛАВНУЮ',
    mouseControls: 'ЛКМ: Стена   •   ПКМ: Пол',
    wall: 'СТЕНА',
    floor: 'ПОЛ',
    undo: 'ОТМЕНА',
    reset: 'СБРОС',
    hint: 'ПОДСКАЗКА',
    hintFree: (remaining) => `ПОДСКАЗКА ×${remaining}`,
    hintRewarded: 'ПОДСКАЗКА ▶',
    hintLocked: (time) => `🔒 ${time}`,
    hintRechargeStatus: (time) => `Бесплатная подсказка через ${time}.`,
    dailyHintOutsideRating: 'Подсказка поможет пройти Daily, но результат не попадёт в рейтинг.',
    onboardingTouchWall: 'ПОСТАВЬ ВСЕ ЗОЛОТЫЕ КЛЕТКИ КАК СТЕНЫ',
    onboardingTouchFloor: 'ВЫБЕРИ ПОЛ И ОТМЕТЬ ВСЕ ЗОЛОТЫЕ КЛЕТКИ',
    onboardingMouseWall: 'ЛКМ: ПОСТАВЬ ВСЕ ЗОЛОТЫЕ КЛЕТКИ КАК СТЕНЫ',
    onboardingMouseFloor: 'ПКМ: ОТМЕТЬ ВСЕ ЗОЛОТЫЕ КЛЕТКИ КАК ПОЛ',
    onboardingDismiss: 'НАЖМИ НА СООБЩЕНИЕ, ЧТОБЫ ЗАКРЫТЬ',
    hintWall: 'ПОДСКАЗКА: золотая клетка должна быть СТЕНОЙ',
    hintFloor: 'ПОДСКАЗКА: золотая клетка должна быть ПОЛОМ',
    loadingAd: 'ЗАГРУЗКА РЕКЛАМЫ…',
    show: 'ПОКАЗАТЬ',
    ad: 'РЕКЛАМА',
    rewardedPrompt: '1 РЕКЛАМА = 1 ПОДСКАЗКА. ПОКАЗАТЬ РЕКЛАМУ?',
    freeHintPrompt: (remaining) => `Показать одну клетку? Бесплатных подсказок: ${remaining}`,
    withoutHints: 'БЕЗ ПОДСКАЗОК',
    hintsCount: (count) => `ПОДСКАЗОК: ${count}`,
    newRecord: '  ·  НОВЫЙ РЕКОРД',
    featuresUnlocked: 'ОТКРЫТО: DAILY И СТАТИСТИКА\nМожно открыть сейчас или продолжить кампанию.',
    solvedCampaign: (time, hintCopy, recordCopy, unlockCopy) => `✓ РЕШЕНО  ·  ${time}  ·  ${hintCopy}${recordCopy}${unlockCopy}`,
    next: 'ДАЛЬШЕ',
    solvedDaily: (time, hintCopy, recordCopy) => `✓ DAILY РЕШЁН  ·  ${time}  ·  ${hintCopy}${recordCopy}`,
    dailyPractice: 'ВНЕ ЗАЧЁТА',
    dailyResultFixed: 'РЕЗУЛЬТАТ ЗАФИКСИРОВАН',
    dailyPlace: (place) => `МЕСТО #${place}` ,
    dailyArchiveComplete: 'АРХИВНЫЙ DAILY ПРОЙДЕН',
    dailyArchiveOutsideRating: 'ЭТОТ РЕЗУЛЬТАТ НЕ УЧАСТВУЕТ В РЕЙТИНГЕ',
    dailyArchiveFirstResult: (time) => `ПЕРВОЕ ВРЕМЯ · ${time}`,
    streakRecent: (streak, recent) => `СЕРИЯ: ${streak}  ·  7 ДНЕЙ: ${recent}`,
    home: 'ГЛАВНАЯ',
    resetTitle: 'Сбросить задачу?',
    resetBody: 'Все отметки на этом поле будут удалены.',
  },
};

const EN: UiCopy = {
  common: {
    backHome: '← HOME',
    back: '← BACK',
    levels: 'LEVELS',
    statistics: 'STATISTICS',
    leaderboard: 'LEADERBOARD',
    settings: 'SETTINGS',
    howToPlay: 'ⓘ HOW TO PLAY',
    tutorial: 'TUTORIAL',
    cancel: 'CANCEL',
    reset: 'RESET',
    solved: 'SOLVED',
    available: 'AVAILABLE',
    locked: 'LOCKED',
    loading: 'LOADING…',
  },
  levelSelect: {
    continueLevel: (slot) => `CONTINUE · LEVEL ${slot}`,
    level: (slot) => `Level ${slot}`,
    state: {
      completed: 'COMPLETED',
      current: 'CURRENT',
      unlocked: 'UNLOCKED',
      locked: 'LOCKED',
    },
  },
  home: {
    levelsProgress: (completed, total) => `Levels · ${completed} / ${total}`,
    chooseLevel: 'CHOOSE LEVEL',
    start: 'START',
    continue: 'CONTINUE',
    tutorialStart: 'START TUTORIAL',
    tutorialContinue: 'CONTINUE TUTORIAL',
    tutorialReplay: 'REPLAY TUTORIAL',
    levelContext: (slot) => `Level ${String(slot).padStart(2, '0')}`,
    dailyUnavailable: 'DAILY · UNAVAILABLE',
    noDailyForTrustedDate: 'No puzzle for the trusted date',
    dailySolved: 'DAILY · SOLVED',
    dailyNew: 'DAILY · NEW',
    streakSuffix: (streak) => streak > 0 ? ` · Streak ${streak}` : '',
    best: (time, streakSuffix) => `Result ${time}${streakSuffix}`,
    today: (streakSuffix) => `Today${streakSuffix}`,
  },
  settings: {
    title: 'SETTINGS',
    music: 'MUSIC',
    sound: 'SOUND',
    vibration: 'VIBRATION',
    language: 'LANGUAGE',
    help: 'HOW TO PLAY',
    resetProgress: 'RESET PROGRESS',
    on: 'ON',
    off: 'OFF',
    languageName: { ru: 'РУССКИЙ', en: 'ENGLISH' },
    resetTitle: 'RESET PROGRESS?',
    resetBody: 'Campaign, Daily, statistics and hints\nwill be deleted. Settings will be kept.',
  },
  help: {
    title: 'HOW TO PLAY',
    utilityTitle: 'CONTROLS',
  },
  stats: {
    title: 'STATISTICS',
    months: ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'],
    weekdays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    campaign: 'CAMPAIGN',
    daily: 'DAILY',
    overall: 'OVERALL',
    solved: (solved, total) => `Solved ${solved} / ${total}`,
    withoutHints: (count) => `Without hints ${count}`,
    totalSolved: (count) => `Total solved ${count}`,
    streakBest: (current, best) => `Streak ${current} · Best ${best}`,
    activeTime: (duration) => `Active time ${duration}`,
    puzzlesSolved: (count) => `Puzzles solved ${count}`,
    hints: (count) => `Hints ${count}`,
    dailyCalendar: 'DAILY · CALENDAR',
    noTrustedDate: 'Unavailable without a trusted date',
    dailyMonth: (month, year) => `DAILY · ${month} ${year}`,
  },
  dailyHub: {
    title: 'DAILY',
    todayTitle: 'TODAY',
    archiveTitle: 'CALENDAR',
    playToday: 'PLAY TODAY',
    leaderboard: 'LEADERBOARD',
    todaySolved: (time) => `Result locked · ${time}`,
    todaySolvedOutsideRating: (time) => `Completed outside ranking · ${time}`,
    todayUnsolved: 'Only the first successful solve enters the ranking.',
    todayUnavailable: 'There is no puzzle for the trusted date today.',
    archiveProgress: (solved, total) => `Solved ${solved} / ${total}`,
    archiveNotSolved: 'NOT SOLVED',
    archiveFirstResult: (time) => `First time · ${time}`,
    archivePlay: 'PLAY',
    archiveReplay: 'REPLAY',
    archiveOutsideRating: 'Archived Dailies are always outside the ranking.',
    archiveEmpty: 'No older Dailies yet.',
  },
  leaderboard: {
    title: 'DAILY · LEADERBOARD',
    back: '← HOME',
    firstResultOnly: 'Only the first successful solve counts.',
    yourResult: (time) => `Your result · ${time}`,
    yourPlace: (place) => `Your place · #${place}`,
    signInTitle: 'SIGN IN TO YANDEX',
    signInBody: 'Sign in to add your fixed result to the shared ranking.',
    signIn: 'SIGN IN',
    unavailable: 'Leaderboard is currently unavailable.',
    noEntries: 'No results yet.',
    playerFallback: 'Player',
    currentPlayerSuffix: ' · YOU',
  },
  game: {
    back: '← BACK',
    levelTitle: (slot) => `LEVEL ${slot}`,
    dailyTitle: 'DAILY',
    tutorialTitle: (slot, total) => `TUTORIAL ${slot} / ${total}`,
    tutorialComplete: 'TUTORIAL COMPLETE\nYou know every dungeon rule.',
    startLevels: 'START GAME',
    rules: 'RULES',
    menu: 'MENU',
    continueGame: 'CONTINUE',
    exitLevels: 'EXIT TO LEVELS',
    exitDaily: 'EXIT TO DAILY',
    exitHome: 'EXIT TO HOME',
    mouseControls: 'LMB: Wall   •   RMB: Floor',
    wall: 'WALL',
    floor: 'FLOOR',
    undo: 'UNDO',
    reset: 'RESET',
    hint: 'HINT',
    hintFree: (remaining) => `HINT ×${remaining}`,
    hintRewarded: 'HINT ▶',
    hintLocked: (time) => `🔒 ${time}`,
    hintRechargeStatus: (time) => `Free hint in ${time}.`,
    dailyHintOutsideRating: 'A hint can finish the Daily, but this run will not enter the leaderboard.',
    onboardingTouchWall: 'MARK ALL GOLD CELLS AS WALLS',
    onboardingTouchFloor: 'SELECT FLOOR AND MARK ALL GOLD CELLS',
    onboardingMouseWall: 'LMB: MARK ALL GOLD CELLS AS WALLS',
    onboardingMouseFloor: 'RMB: MARK ALL GOLD CELLS AS FLOOR',
    onboardingDismiss: 'CLICK THE MESSAGE TO CLOSE',
    hintWall: 'HINT: the gold cell must be a WALL',
    hintFloor: 'HINT: the gold cell must be FLOOR',
    loadingAd: 'LOADING AD…',
    show: 'SHOW',
    ad: 'AD',
    rewardedPrompt: '1 AD = 1 HINT. SHOW AN AD?',
    freeHintPrompt: (remaining) => `Reveal one cell? Free hints: ${remaining}`,
    withoutHints: 'NO HINTS',
    hintsCount: (count) => `HINTS: ${count}`,
    newRecord: '  ·  NEW RECORD',
    featuresUnlocked: 'UNLOCKED: DAILY AND STATISTICS\nOpen them now or continue the Campaign.',
    solvedCampaign: (time, hintCopy, recordCopy, unlockCopy) => `✓ SOLVED  ·  ${time}  ·  ${hintCopy}${recordCopy}${unlockCopy}`,
    next: 'NEXT',
    solvedDaily: (time, hintCopy, recordCopy) => `✓ DAILY SOLVED  ·  ${time}  ·  ${hintCopy}${recordCopy}`,
    dailyPractice: 'PRACTICE · UNRANKED',
    dailyResultFixed: 'RESULT LOCKED',
    dailyPlace: (place) => `PLACE #${place}`,
    dailyArchiveComplete: 'ARCHIVED DAILY COMPLETE',
    dailyArchiveOutsideRating: 'THIS RESULT DOES NOT ENTER THE RANKING',
    dailyArchiveFirstResult: (time) => `FIRST TIME · ${time}`,
    streakRecent: (streak, recent) => `STREAK: ${streak}  ·  7 DAYS: ${recent}`,
    home: 'HOME',
    resetTitle: 'Reset puzzle?',
    resetBody: 'All marks on this board will be cleared.',
  },
};

export function getUiCopy(language: SupportedLanguage): UiCopy {
  return language === 'ru' ? RU : EN;
}
