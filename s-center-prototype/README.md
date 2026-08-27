# S-Center prototype

Нативный прототип экрана «Цифровая шахматка», собранный на HTML, CSS и JavaScript. Основная область содержит полностью подключённый переносимый модуль из `digital-chessboard-transfer`.

## Архитектура

- `index.html` — точка входа и семантический каркас.
- `src/app.js` — композиция оболочки, связь дерева, drawer и шахматки.
- `src/data/project-tree.js` — демонстрационная иерархия проектов, очередей и объектов с контекстом шахматки.
- `src/integrations/digital-chessboard/` — точные runtime-копии transfer-пакета, локальные иконки и lifecycle-adapter.
- `src/ui/icons.js` — проектный набор SVG-метафор.
- `src/styles/app.css` и `src/styles/digital-chessboard-integration.css` — токены S-Center, адаптации общих компонентов и граница feature/shell.
- `scripts/serve.mjs` — локальный статический сервер без внешних зависимостей.
- [docs/README.md](./docs/README.md) — единый индекс и правила маршрутизации документации прототипа.

Компоненты подключаются напрямую из соседнего переносимого пакета `component-library-transfer`. Сам снимок библиотеки не изменяется: продуктовые отличия ограничены корнем `.s-center-app`.

Runtime шахматки скопирован из соседнего `digital-chessboard-transfer` без изменений и не зависит от него во время запуска. Standalone-host, Google Fonts и CDN Lucide в целевой прототип не включены.

## Запуск

### Запуск двойным кликом

Запустить [`start-prototype.cmd`](./start-prototype.cmd) рядом с `index.html`. Скрипт поднимет локальный HTTP-сервер и откроет прототип в браузере Windows по умолчанию.

После запуска адрес `http://localhost:4185/` можно открыть в любом установленном браузере на этом компьютере: Chrome, Edge, Firefox, Opera и других.

Прямое открытие `index.html` через `file://` не поддерживается: браузеры блокируют используемые проектом JavaScript-модули и их импорты из соседнего каталога `component-library-transfer`.

### Запуск из терминала

Открыть прототип в браузере Windows по умолчанию и оставить сервер работать в фоне:

```powershell
cd s-center-prototype
npm.cmd run open
```

Либо запустить сервер в текущем терминале:

```powershell
cd s-center-prototype
npm.cmd run start
```

Открыть `http://localhost:4185/`. Корневой адрес автоматически перенаправит браузер на `/s-center-prototype/`.

Проверить синтаксис JavaScript, локальные ссылки и регистрацию документов в индексах:

```powershell
npm.cmd run check
```
