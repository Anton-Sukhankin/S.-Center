# Контрольная точка соответствия исходного прототипа

**Состояние:** текущий ненормативный audit checkpoint; заменяется целиком при следующей эквивалентной проверке  
**Дата проверки:** 30.08.2026  
**Текущая зрелость:** frontend-прототип на HTML/CSS/JavaScript  
**Целевая зрелость контракта:** переносимое production frontend-поведение в архитектуре головной системы  
**Результат checkpoint:** `PASS` — `npm.cmd run check` и 5/5 Playwright-сценариев, Microsoft Edge 151.0.4129.107, viewport 1600 × 900  
**Нормативные владельцы:** [роли](./interface-roles-and-relations.md), [поведение](./behavior-and-algorithm.md), [приёмка](./acceptance-scenarios.md)

## 1. Назначение и граница

Документ отвечает только на вопрос, чем подтверждён переносимый контракт в текущем S.Center. Он не создаёт требований, не требует downstream-агенту читать исходники прототипа и не утверждает production-готовность всего приложения.

Текущие факты проверяются в следующем порядке:

1. наблюдаемое поведение в браузере;
2. автоматизированные browser-сценарии;
3. исполняемый код и CSS;
4. машинная проверка идентификаторов и трассировки;
5. данный checkpoint.

Если checkpoint расходится с первыми четырьмя источниками, обновляется checkpoint. Нормативный target меняется только по отдельному продуктовому решению.

## 2. Сопоставление с текущей реализацией

| Область | Текущий владелец в прототипе | Подтверждённый результат |
|---|---|---|
| Распределение wheel-дельты | `src/integrations/digital-chessboard/feature/digital-chessboard.js`: `routeMatrixVerticalWheel`, `queueSmoothMatrixVerticalDelta`, `applyMatrixVerticalDelta` | Inner-first, остаток в том же действии, обе границы, исключённые жесты, cancelable/non-cancelable ветви |
| Точка перехвата wheel | Там же: `routeWindowVerticalWheel`, `routeMatrixVerticalWheel` | Один non-passive window capture-listener владеет подходящим wheel независимо от bubbling и не требует пересоздавать подписки при render; destroy снимает единственную подписку |
| Изоляция и декомпозиция осей | Там же; `src/integrations/digital-chessboard/feature/digital-chessboard.css`: `.dch2-matrix .ds-chessboard__scroll` | Inline/fullscreen используют `overscroll-behavior: contain`; cancelable диагональный ввод применяет `deltaX` к матрице и передаёт `deltaY` по inner-first алгоритму, а non-cancelable ветвь согласует только неприменённый вертикальный остаток |
| Устойчивый владелец жеста | Там же: `matrixScrollForWheelGesture` | Владелец сохраняется до паузы 180 ms и не меняется от перемещения разметки под неподвижным курсором |
| Плавность и совместный подъём | Там же: `splitCoupledUpwardDelta`, `stepSmoothWheelMotion` | Единая очередь, сброс направления, пропорциональная сумма внутреннего и внешнего расстояний, точное завершение |
| Sticky-геометрия | Там же: `workStickyTop`, `syncWorkStickyLayers`; локальный CSS feature | Фактические размеры header, tabs, row-gap, строки и matrix header; синхронный transform; предел восьми этажей; стабильная маска |
| Динамическое перестроение | Там же: `ResizeObserver`, `document.fonts`, render/toggle/scroll/resize lifecycle | Изменение окна, наблюдаемых контейнеров, шрифтов и состава отрисованных строк ставит единый пересчёт на ближайший кадр |
| Позиция матрицы | Там же: `matrixScrollPositions`, `rememberMatrixScrollPosition`, `restoreMatrixScrollPosition` | Нижняя начальная позиция и раздельное восстановление по проекту/объекту/периоду/работе |
| Полноэкранная граница | Там же: `routeMatrixVerticalWheel`, fullscreen lifecycle; локальный CSS feature | Inline-очередь отменяется; полноэкранная матрица прокручивается самостоятельно и не передаёт остаток скрытому списку; позиции восстанавливаются |

## 3. Автоматизированное evidence

| Проверка | Покрытие | Статус |
|---|---|---|
| `scripts/check-scroll-contract.mjs` через `npm.cmd run check` | Уникальность и непрерывность `UI-Rxx`, требований и `AC-*`; существование ссылок; явное покрытие каждого требования; актуальность итоговой матрицы диапазонов | Выполняется в обычной проверке прототипа |
| [prototype-kinematics-vectors.json](./prototype-kinematics-vectors.json) через тот же checker | 23 арифметических reference-вектора; синхронность числового профиля с текущими JS/CSS-константами | Выполняется в обычной проверке прототипа; ненормативное evidence |
| `tests/scroll-contract.spec.mjs` · nested routing | `AC-SCROLL-01`, `AC-SCROLL-02`, `AC-SCROLL-03`, `AC-SCROLL-08`, часть `AC-SCROLL-10` | Trusted wheel через Playwright измеряет обе позиции и обе оси при `deltaX = 400`, `deltaY = 120` с внутренним запасом, на обеих вертикальных границах и перед X-only кадром; non-bubbling события доказывают window capture, сохранение очереди и fallback для события с target `window`, но координатами над матрицей |
| `tests/scroll-contract.spec.mjs` · sticky/coupled/resize | `AC-SCROLL-14`, `AC-STICKY-02`, `AC-STICKY-09` | Сравниваются синхронные transforms, сумма распределённого расстояния и реакция на изменение геометрии без window resize |
| `tests/scroll-contract.spec.mjs` · fullscreen/restore | `AC-SCROLL-15`, часть `AC-LIFE-03` | Проверяются изоляция границы и восстановление той же внутренней позиции |
| `tests/scroll-contract.spec.mjs` · reference geometry | `AC-SCROLL-02`, `AC-SCROLL-08`, `AC-STICKY-02`, `AC-STICKY-05` | При неподвижном курсоре над выровненной матрицей проверяются вертикальная передача остатка, положительное sticky-смещение активной работы, чистый горизонтальный wheel-ввод через `deltaX`, `Shift + wheel` и `contain`-изоляция inline/fullscreen overscroll |
| `tests/scroll-contract.spec.mjs` · query-only diagnostics | Runtime evidence для `AC-SCROLL-10` | `?scroll-debug=1` показывает trusted/cancelable wheel-параметры, путь, route-decision, viewport/breakpoint и позиции matrix/outer/document; без query обычный UI не содержит панели |

Автоматизация проверяет критические переходы, но не объявляет остальные сценарии пройденными по ассоциации. В частности, `AC-SCROLL-10` требует реального высокоточного устройства или браузерной последовательности с наблюдаемыми non-cancelable-событиями; `AC-LIFE-02` остаётся продолжительной комбинированной сессией. Эти сценарии обязательны в итоговой приёмке целевого проекта.

## 4. Воспроизводимые команды

Из каталога `s-center-prototype`:

```powershell
npm.cmd install
npm.cmd run check
npm.cmd run test:scroll-contract
```

На Windows browser-тест по умолчанию использует установленный Microsoft Edge. Другой Chromium-совместимый канал можно передать через `PLAYWRIGHT_CHANNEL`. В среде без системного Chromium перед первым запуском устанавливается штатный browser Playwright:

```powershell
npx.cmd playwright install chromium
```

Целевой проект переносит сценарии в свой штатный test runner и выполняет их во всех поддерживаемых им desktop-браузерах; успешный прогон только исходного прототипа не подтверждает новую реализацию.

## 5. Текущий результат и ограничения

- Нормативный пакет отделён от evidence и не выдаёт browser-прототип за production-систему.
- [Эталонный профиль кинематики](./prototype-kinematics-reference.md) отделяет точное ощущение текущего прототипа от обязательного технологически нейтрального результата; его JSON-векторы проверяются на рассинхронизацию с исходниками.
- Все требования имеют стабильные уникальные идентификаторы и явные сценарии приёмки.
- Inline и fullscreen-владение прокруткой разделены явно.
- Динамическая геометрия имеет исполняемого владельца через `ResizeObserver`, font lifecycle и штатные точки перестроения.
- Touch/pointer-прокрутка, данные, backend, persistence, безопасность, эксплуатация и поддерживаемая целевым проектом browser-матрица остаются вне утверждений пакета.
- Итоговый downstream-статус определяется только после выполнения [полной программы приёмки](./acceptance-scenarios.md) в целевом репозитории.

## 6. Когда checkpoint заменяется

Повторная проверка требуется при изменении нормативного контракта, scroll-владельца, полноэкранной композиции, геометрических наблюдателей, browser-test сценариев, исходного кода маршрутизатора, его числовых констант или reference-векторов. Обновление заменяет текущий статус и таблицы; документ не ведётся как накопительный журнал.
