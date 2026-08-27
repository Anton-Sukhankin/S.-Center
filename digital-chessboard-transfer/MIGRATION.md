# Контракт переноса и адаптации

## Цель

Этот документ отделяет неизменяемое UX-поведение шахматки от связей, которые целевой проект должен заменить собственными данными, контекстом и shell-стилями.

Текущий потребитель контракта — `../s-center-prototype`. Его реализованная схема, container-адаптация и evidence находятся в [technical-baseline.md](../s-center-prototype/docs/digital-chessboard/technical-baseline.md).

## 1. Скопировать каталог целиком

Для первичной проверки переносится вся папка `digital-chessboard-transfer/`. Она не использует относительные пути выше собственного корня.

После запуска preview нужно подтвердить пять контрольных сценариев:

1. выбор каждого объекта меняет карточку, готовность и геометрию матрицы;
2. календарь применяет диапазон только после подтверждения;
3. выбор и смена работы происходят через одно модальное окно;
4. закрытие работы показывает пустое состояние и позволяет выбрать новую;
5. сравнение принимает две разные работы и синхронизирует обе матрицы.

## 2. Встроить mount-root

Целевой shell должен предоставить контейнер:

```html
<section id="digital-chessboard-view" aria-label="Цифровая шахматка">
    <div id="digital-chessboard-root"></div>
</section>
```

`#digital-chessboard-view` должен иметь определенную высоту и `min-height: 0`. Preview использует высоту viewport; в целевом проекте эту высоту задает контентная область под его header.

## 3. Передать проектный контекст

Минимальный поддерживаемый контекст:

```js
const context = {
    type: 'project',
    id: 'stable-project-id'
};

window.SCenterDigitalChessboard.mount(root, { context });
```

Для очереди ожидаются `type: 'queue'` и `projectId`. Контекст `type: 'bu'` намеренно отображает `unsupported-context`.

При смене проекта вызвать `setContext(nextContext)`. Feature сохраняет локальное состояние при переходе между очередями одного проекта и сбрасывает его при смене `projectId`.

## 4. Заменить demo-data adapter

UI ожидает `window.digitalChessboardData.getForContext(context)` со следующей верхнеуровневой формой:

```js
{
    status: 'ready',
    projectId: 'project-id',
    objects: [
        {
            id,
            name,
            type,
            typeLabel,
            icon,
            structure,
            rowLabel,
            periods: [
                {
                    id,
                    startDate,
                    endDate,
                    summary: { actual, plan, deviation, updatedAt },
                    works: [
                        {
                            id,
                            code,
                            name,
                            group,
                            contractor,
                            plannedStart,
                            plannedEnd,
                            completion,
                            floors,
                            sections,
                            cells
                        }
                    ]
                }
            ]
        }
    ]
}
```

Ключ `cells` строится как `${floor}:${section.id}`. Ячейка содержит `status`, `actual` и `plan`. Допустимые статусы: `in-progress`, `completed`, `delayed`, `no-data`, `not-applicable`.

Промышленный adapter должен нормализовать реальные источники в этот view-model. UI не должен вычислять отчетную готовность самостоятельно.

## 5. Сохранить UI/UX-инварианты

- один выбранный объект;
- одна основная работа и не более одной сравниваемой;
- одинаковую работу нельзя выбрать в оба comparison-слота;
- draft календаря и сравнения не изменяет примененное состояние до кнопки подтверждения;
- закрытая работа остается пустым слотом, а не автоматически заменяется;
- matrix status читается не только цветом: процент или тире и текстовый `title` сохраняются;
- модальные окна имеют доступные названия, focus trap, `Escape` и возврат фокуса;
- при сравнении обе матрицы синхронизируют `scrollTop` и `scrollLeft`;
- первая колонка и строка секций остаются sticky;
- нативные scrollbar скрыты, overlay-индикаторы не занимают место в layout.

## 6. Адаптировать visual shell

`src/host/standalone.css` относится только к preview. В целевом проекте его можно удалить после того, как shell обеспечит:

- высоту и ширину mount-area;
- `overflow: hidden` у рабочей поверхности;
- базовый шрифт Inter или утвержденный эквивалент;
- отсутствие глобальных правил, переопределяющих `button`, `table`, `th`, `td` внутри `#digital-chessboard-root`.

Feature-стили используют префикс `dch-`, selector — `cos-`. Эти пространства имен должны быть сохранены до отдельного осознанного рефакторинга.

## 7. Заменить assets

Preview подключает Lucide через CDN и вызывает `window.lucide.createIcons()`. В целевом проекте допустимы два варианта:

- предоставить совместимый глобальный `window.lucide` до монтирования feature;
- заменить helper `icon()` на компонент или sprite целевого design system, сохранив accessible names кнопок.

Карточки объектов уже используют локальные inline-SVG и от Lucide не зависят.

## 8. Управлять lifecycle

Перед размонтированием или удалением root вызвать:

```js
window.SCenterDigitalChessboard.destroy();
```

Это снимает document-level listeners, ResizeObserver и pointer-drag listeners. Для временного скрытия использовать `hide()`, для возврата — `show()`.

## 9. Удаление из AIShtab — отдельный этап

Этот пакет не удаляет текущий раздел. После успешной адаптации в другом проекте отдельный запрос на устранение должен охватить:

- пункт `Шахматка` и связанные screen-controller ветки в header/app;
- исходные feature-файлы и только те shared/data-файлы, у которых больше нет потребителей;
- локальные README, карты связей, compliance и evidence;
- регрессию `Сводки` и `Объектов`, которые делят dropdown и часть data identity.

Shared selector и каталог объектов нельзя удалять механически: их используют другие активные разделы.
