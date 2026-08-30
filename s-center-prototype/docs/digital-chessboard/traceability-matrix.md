# Матрица трассировки цифровой шахматки

**Состояние документа:** поддерживаемая карта связей; не владеет полным текстом требований или прогрессом  
**Зрелость:** frontend-прототип  
**Основной читатель:** агент реализации, frontend-разработчик и тестировщик  
**Обновлять:** при добавлении требования, изменении интерфейсной области, реализации, источника проверки или владельца контракта  
**Родительский индекс:** [контекст цифровой шахматки](./README.md)

Полные целевые правила принадлежат [functional-context.md](./functional-context.md), подтверждённое текущее состояние — [technical-baseline.md](./technical-baseline.md), а статус выполнения каждого ID — [implementation-plan.md](./implementation-plan.md). Матрица хранит только связи между ними, кодом и приёмкой.

## 1. Карта требований

| Требования плана | Интерфейсная область | Владелец целевого правила | Основное implementation-evidence | Приёмка |
|---|---|---|---|---|
| `DC-NAV-01..03`, `DC-FUP-CTX-01` | `DC-UI-CONTEXT`, `DC-UI-EMPTY` | Functional context §2 | `src/app.js`, `adapter.js`, feature Empty State | Выбор project/queue не подставляет дом; object показывает собственный путь и вкладки |
| `DC-TAB-01..02` | `DC-UI-TABS` | Functional context §2 | Feature `createTabs` и отдельные panel factories | Вкладки независимы; одновременно виден один panel |
| `DC-SUM-01..03` | `DC-UI-SUMMARY` | Functional context §4.1 | Feature `createSummary`, readiness refs и planned-теги | Сводка относится выбранному объекту; готовность действует, будущие карточки явно помечены «Планируется» |
| `DC-GRP-01..03`, `DC-FUP-GRP-01..02` | `DC-UI-GROUP` | Functional context §4.2 | `digital-chessboard-groups.js`, group model, modal и `createGroupControl` | Одна выбранная группа, готовность и период; prev/next и произвольный выбор |
| `DC-WORK-01..05`, `DC-FUP-WRK-01..02` | `DC-UI-WORK-LIST`, `DC-UI-WORK-HEADER` | Functional context §4.3 | `groupModels`, `createWorkAccordion`, Accordion styles | Все работы идут вертикально; параметры доступны в свёрнутом состоянии; 100% имеет отдельную индикацию |
| `DC-FS-WRK-01` | `DC-UI-WORK-FULLSCREEN` | Functional context §4.3 «Полноэкранный режим» | Fullscreen session в feature и общие Accordion/Chessboard | Тот же экземпляр работы; восстановление open-state, scroll и фокуса; Escape и prev/next |
| `DC-MTX-01..05` | `DC-UI-MATRIX`, `DC-UI-CELL` | Functional context §4.4 | Data geometry, `createMatrix`, общий Chessboard | Этажи × секции, компактные колонки, disabled-позиции и отсутствие процентного ввода |
| `DC-FUP-MTX-01`, `DC-IND-A11Y-01` | `DC-UI-LEGEND`, `DC-UI-MATRIX` | Functional context §4.3–4.4 и §5 | `CELL_STATES`, swatches, Chessboard status styles | Пять одинаково названных состояний; штриховка 2/8; без угловой точки |
| `DC-FUP-MTX-02` | `DC-UI-MATRIX` | Functional context §4.4 и Domain model §8 | Объектные `sections[].floorCount`, генерация absent-ячеек в data-layer, `displaySections`/`createMatrix`, `readinessForWork`, data check | Стабильный верхний контур; `no-data` внутри и disabled `absent` выше секции различаются; отсутствующие позиции не редактируются и не входят в готовность |
| `DC-FUP-MTX-03`, `DC-MTX-START-01` | `DC-UI-MATRIX` | Functional context §4.4 | Display geometry, matrix scroll keys и positions | 4–15 секций, полная этажность, старт с нижних этажей и раздельное восстановление позиции |
| `DC-MTX-03..04`, `DC-FUP-ACT-01` | `DC-UI-CELL-MENU` | Functional context §5; Domain model §6–7 | `overrides`, Menu, `readinessForWork`, `groupReadiness`, `objectReadiness` | Один дискретный выбор меняет одну ячейку и производные готовности |
| `DC-FUP-HIS-01` | `DC-UI-CELL-HISTORY` | Functional context §5 «История изменения» | Tooltip и `CellLastChange` fixture/override | Hover 1 секунда или focus показывает статус, автора, логин, дату и время |
| `DC-MODE-01`, `DC-DATE-01`, `DC-CMP-01` | Граница вкладки шахматки | Functional context §6–7 | Отсутствие контролов в feature | Нет Plan/Fact, календарного фильтра и сравнения в текущем MVP |
| `DC-SET-01..02` | `DC-UI-SETTINGS` | Functional context §8 | `src/features/settings-drawer.js` | Drawer остаётся настройкой видов и объектов; шаблон работ и источник плана не входят в активный контракт |
| `DC-FUP-CMP-01..02` | Общая граница компонентов | Functional context §5 и baseline «Компонентный контракт» | Публичный entry point, Menu, Tooltip, Chessboard, `component-library-transfer/docs/chessboard.md` и stories | Продукт использует публичные примитивы; Chessboard отдельно проверяет состояния, absent-геометрию, выбор, Menu, Tooltip-композицию и overflow |
| `DC-FUP-QA-01` | Все затронутые области | Functional context и post-correction audit plan | [Текущая контрольная точка](../quality/digital-chessboard-current-audit/README.md), Browser/visual QA и quality index | Независимый аудит выполнен; findings отделены от факта выполнения проверки и маршрутизированы владельцам |
| `DC-DATA-GRP-01` | `DC-UI-GROUP`, `DC-UI-WORK-LIST` | Functional context §4.2; Domain model §2–3 | `GROUP_DEFINITIONS.workItems`, `createGroupWorks()`, `groupModels()` и data check | Каждый показанный `work.id` явно принадлежит выбранной группе; семантически чужие работы не подмешиваются ради количества |
| `DC-DATA-DATE-01` | `DC-UI-GROUP`, `DC-UI-WORK-HEADER`, `DC-UI-WORK-FULLSCREEN` | Functional context §4.2–4.3 и §6 «Даты»; Domain model `Period`/`Work` | `digital-chessboard-data.js`, заголовки работ и data check | Все даты календарно допустимы; начало не позже окончания; один результат сохраняется в обычном и fullscreen-заголовке |

## 2. Карта реализации

| Контракт | Текущий владелец реализации | Проверка |
|---|---|---|
| Контекст shell и вкладок | `s-center-prototype/src/app.js`, adapter и feature | `cd s-center-prototype; npm.cmd run check`; Browser QA |
| Демо-модель объекта и работ | `data/digital-chessboard-data.js` | `scripts/check-digital-chessboard-data.mjs` через пакетный check |
| Каталог групп | `data/digital-chessboard-groups.js` | Синтаксис, data check и Browser QA выбора |
| UI-композиция шахматки | `feature/digital-chessboard.js` и локальный CSS | Пакетный check, Browser QA, Visual QA |
| Публичные UI-примитивы | `component-library-transfer/src/index.js`, модули и stories | `cd component-library-transfer; npm.cmd run verify`; Storybook build при установленной среде |
| Nested scroll и sticky | Current feature + `scroll-contract/` как переносимый нормативный результат | Scroll acceptance scenarios и Browser QA |
| Документационная маршрутизация | Локальный индекс и workspace context governance | `npm.cmd run check:docs` |

## 3. Правило обновления

1. Новый ID сначала получает полный target-контракт и запись в active plan.
2. Матрица добавляет только связь ID с областью, владельцем, кодом и проверкой.
3. После подтверждённой реализации обновляются baseline и plan; матрица меняется только при изменении связи или coverage.
4. После завершения временного плана долговременные ID и связи, которые ещё нужны, переносятся к постоянным владельцам; статусный чек-лист не копируется сюда.
