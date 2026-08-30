# S-Center prototype

Нативный прототип экрана «Цифровая шахматка», собранный на HTML, CSS и JavaScript. Активная шахматка является локальной продуктовой адаптацией; `digital-chessboard-transfer` сохраняется как исторический исходный снимок, а не как текущий runtime-владелец feature.

## Архитектура

- `index.html` — точка входа и семантический каркас.
- `src/app.js` — композиция оболочки, связь дерева, drawer и шахматки.
- `src/data/project-tree.js` — демонстрационная иерархия проектов, очередей и объектов с контекстом шахматки.
- `src/integrations/digital-chessboard/` — активная продуктовая реализация, data-layer, локальные иконки и lifecycle-adapter.
- `src/ui/icons.js` — проектный набор SVG-метафор.
- `src/styles/app.css` и `src/styles/digital-chessboard-integration.css` — токены S-Center, адаптации общих компонентов и граница feature/shell.
- `scripts/serve.mjs` — локальный статический сервер без внешних зависимостей.
- `vite.config.js`, `worker/index.js` и `.openai/hosting.json` — воспроизводимая Cloudflare Worker-совместимая сборка для Sites; публикация выполняется отдельным действием.
- [docs/README.md](./docs/README.md) — единый индекс и правила маршрутизации документации прототипа.

Компоненты подключаются напрямую из соседнего переносимого пакета `component-library-transfer`. Сам снимок библиотеки не изменяется: продуктовые отличия ограничены корнем `.s-center-app`.

Runtime шахматки не зависит от `digital-chessboard-transfer` во время запуска. Синхронными остаются только явно зарегистрированные snapshot-пары данных и selector; feature и геометрия развиваются в прототипе самостоятельно. Standalone-host, Google Fonts и CDN Lucide в целевой прототип не включены.

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

Перед первым запуском воспроизводимых browser-тестов установить dev-зависимости:

```powershell
npm.cmd install
```

Проверить синтаксис JavaScript, локальные ссылки и регистрацию документов в индексах:

```powershell
npm.cmd run check
```

Собрать и локально открыть версию в том же формате, который принимает Sites:

```powershell
npm.cmd run build
npm.cmd run preview
```

Команда `build` создаёт переносимый результат в `dist/`; она не публикует сайт.

Проверить критические сценарии переносимого scroll/sticky-контракта доверенным wheel-вводом в браузере:

```powershell
npm.cmd run test:scroll-contract
```

На Windows тест по умолчанию использует Microsoft Edge. Другой Chromium-канал можно выбрать через `PLAYWRIGHT_CHANNEL`; в среде без системного Chromium сначала выполняется `npx.cmd playwright install chromium`.
