# Переносимый пакет раздела «Шахматка»

## Статус

Это автономный снимок активного раздела `Шахматка` из AIShtab. Пакет подготовлен для переноса в другой frontend-проект и последующей адаптации. С 24 августа 2026 года его runtime-копии подключены к `../s-center-prototype`; сам каталог остаётся независимым эталонным preview и не заменяет исходники в AIShtab.

Исходный раздел остается в AIShtab до отдельной команды пользователя на удаление. `Сводка`, `Объекты`, общий header, левое дерево, dashboard и другие области AIShtab в пакет не входят.

## Что сохранено

- пять карточек объектов и клавиатурное переключение между ними;
- сводные показатели объекта и изменение значений при смене объекта;
- выбор диапазона дат в несистемном календаре;
- режимы `Факт` и `Факт / план`;
- 27 работ, поиск, одиночный выбор и смена работы;
- пустое состояние после закрытия работы;
- настройка сравнения двух работ, очистка слотов и запрет дублирования;
- две горизонтально расположенные матрицы с синхронным скроллом;
- sticky-заголовок и sticky-колонка этажей;
- пять визуальных статусов, hover, легенда и overlay-индикаторы скролла;
- focus trap, закрытие overlay по `Escape`, возврат фокуса и доступные названия действий;
- 34 этажа и 16 секций для жилых домов, отдельная геометрия паркинга и детского сада.

## Структура

```text
digital-chessboard-transfer/
├── index.html
├── package.json
├── README.md
├── MIGRATION.md
├── SOURCE_MANIFEST.md
├── scripts/
│   └── serve.mjs
└── src/
    ├── components/construction-object-selector/
    ├── data/
    ├── feature/
    └── host/
```

Файлы в `src/feature/`, `src/data/` и `src/components/` являются копиями активных runtime-файлов. `src/host/` — минимальная автономная оболочка для preview и пример интеграционного adapter.

## Локальный запуск

Требуется Node.js. Установка зависимостей не нужна.

```powershell
cd digital-chessboard-transfer
npm.cmd start
```

После запуска открыть `http://127.0.0.1:4175/`.

Открывать `index.html` через `file://` не рекомендуется: переносимый контракт рассчитан на обычный статический HTTP-сервер, как и основной прототип.

## Runtime-контракт

Порядок подключения classic scripts обязателен:

1. `construction-objects-data.js`;
2. `digital-chessboard-data.js`;
3. `construction-object-selector.js`;
4. `digital-chessboard.js`;
5. host-adapter целевого проекта.

Feature монтируется так:

```js
window.SCenterDigitalChessboard.mount(rootElement, {
    context: { type: 'project', id: 'project-id' }
});
```

Публичный API feature: `mount`, `setContext`, `show`, `hide`, `closeOverlays`, `destroy`.

Preview-host дополнительно предоставляет `window.DigitalChessboardTransferHost.setContext(context)`. В целевом проекте этот adapter следует заменить собственным владельцем контекста.

По умолчанию preview использует demo-контекст `proj-nova`, поэтому стартовые значения совпадают с одноименным проектом активного прототипа на момент выделения пакета.

## Данные и ограничения

Все включенные значения детерминированы, но являются демонстрационными. Это не промышленная методика готовности, не Gantt/ERP/КС-2/S.Control API и не источник фактической отчетности. Пакет не содержит backend, persistence, ролей и прав доступа.

Lucide Icons и Inter в standalone `index.html` подключаются с внешних CDN. Интеграция в `s-center-prototype` использует системный стек шрифтов оболочки и локальный совместимый icon-adapter.

Пошаговая адаптация описана в [MIGRATION.md](MIGRATION.md), происхождение точных runtime-копий — в [SOURCE_MANIFEST.md](SOURCE_MANIFEST.md).
Текущая реализация и evidence проверки описаны в [technical-baseline.md](../s-center-prototype/docs/digital-chessboard/technical-baseline.md).
