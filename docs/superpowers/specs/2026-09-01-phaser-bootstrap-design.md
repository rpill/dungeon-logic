# Phaser Bootstrap Design

## Goal

Превратить существующую Vite + TypeScript заготовку Dungeon Logic в минимальный запускаемый Phaser-проект, не начиная пока реализацию самой головоломки.

## Stack

* Phaser 4
* TypeScript
* Vite
* Browser
* дальнейшая целевая платформа: Яндекс Игры

## Existing project

Используется уже созданный Vite TypeScript проект.

ORYX Ultimate Fantasy 1.2 уже находится в:

`public/oryx/`

Ассеты ORYX на этом этапе не загружаются и не перемещаются.

## Bootstrap architecture

Создаются две Phaser-сцены.

### BootScene

Путь:

`src/scenes/BootScene.ts`

Ответственность:

* точка для будущей загрузки игровых ассетов;
* после запуска сразу переключается на `GameScene`.

На первом этапе сцена не загружает ORYX.

### GameScene

Путь:

`src/scenes/GameScene.ts`

Ответственность текущего этапа:

* подтвердить успешный запуск Phaser;
* отобразить тестовый экран;
* не содержать правил головоломки.

На экране должны появиться:

* `Dungeon Logic`;
* `Phaser 4 running`.

## main.ts

`src/main.ts` становится только точкой конфигурации Phaser.

Он:

* импортирует Phaser;
* импортирует BootScene;
* импортирует GameScene;
* создаёт `Phaser.Game`;
* задаёт базовый размер canvas;
* включает responsive scaling;
* регистрирует сцены.

Игровые правила в `main.ts` не добавляются.

## CSS

`src/style.css` остаётся минимальным.

Задачи CSS:

* убрать стандартные margin браузера;
* сделать фон страницы нейтральным;
* центрировать Phaser canvas;
* не создавать игровой UI средствами HTML.

## Vite demo cleanup

Удаляются файлы стандартной Vite-демонстрации, которые больше не используются:

* `src/counter.ts`;
* `src/assets/hero.png`;
* `src/assets/typescript.svg`;
* `src/assets/vite.svg`.

Если после удаления `src/assets/` становится пустой, директорию можно удалить.

## First-run result

После:

`npm run dev`

браузер должен показать Phaser canvas без ошибок.

На canvas:

`Dungeon Logic`

`Phaser 4 running`

Никаких клеток, монстров, ORYX-графики или puzzle logic на этом этапе нет.

## Explicitly excluded

На этом этапе не реализуются:

* PuzzleState;
* CellState;
* LevelDefinition;
* BoardView;
* CellView;
* level001;
* row clues;
* column clues;
* monster rules;
* connectivity;
* 2×2 validation;
* Undo;
* Restart;
* ORYX loading;
* Yandex SDK.

## Next slice

После успешного bootstrap следующий вертикальный шаг:

* чистая TypeScript-модель уровня;
* один вручную заданный уровень 6×6;
* три состояния клетки;
* placeholder board;
* клики по клеткам.

Puzzle logic должна оставаться независимой от Phaser.
