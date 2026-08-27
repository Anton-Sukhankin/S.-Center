# Design QA — drawer «Настройки», вкладка «Выбор ОС»

**Статус:** QA-checkpoint состояния от 2026-08-24; не является продуктовой спецификацией  
**Область:** drawer открыт из «Настройки», вкладка «Выбор ОС», проект «АЛХИМОВО», выбраны 20 из 20 объектов, действия footer недоступны  
**Ограничение evidence:** исходный референс и изображения сравнений были сессионными артефактами и не входят в проект. Приведённые ниже выводы фиксируют результат проведённой проверки, но полный визуальный прогон нельзя воспроизвести только из репозитория. При следующем изменении состояния нужно создать новый checkpoint с переносимыми evidence-файлами и относительными ссылками.

## Normalization

- Source: 3414 × 2054 px including 92 px of browser chrome.
- Source app crop: `(0, 92)–(3414, 2054)`, then downsampled 2:1 to 1707 × 981 px.
- Implementation: 1707 × 981 CSS px and 1707 × 981 screenshot px; density 1.
- Drawer: 1194.7 px, or 70% of the viewport, matching the source proportion.

## Full-view comparison evidence

- Information architecture matches: overlay, title and close control, four tabs, project selector, information alert, five-column selection table, count summary, fixed footer actions and save hint.
- Major geometry aligns with the reference: drawer edge, 360 × 34 px project select, alert block, table header, 45 px rows and footer anchoring.
- The visible Alkhimovo object names, queues, kinds, types and selected states match the captured source.

## Focused comparison evidence

The focused comparison includes the title, tabs, project field, alert copy, header checkbox and first table rows. Dense labels and controls are readable at equal pixel dimensions. No rasterized controls, placeholder icons, CSS drawings or duplicated component implementations were introduced.

## Required fidelity surfaces

- Fonts and typography: existing system stack, hierarchy, weights, line heights, wrapping and table density reproduce the source without an actionable mismatch.
- Spacing and layout rhythm: drawer ratio, section order, group gaps, control sizes, header height and row rhythm align after normalization.
- Colors and tokens: S-Center blue, gray overlay, neutral alert and table surfaces, separators and disabled button states match the source hierarchy.
- Image and icon quality: only existing component-library vector icons are used and remain sharp at the target density.
- Copy and content: tab labels, project label/value, information copy, table headers, visible rows, summary, actions and footer hint match the reference.

## Interaction and accessibility evidence

- The project select updates the table and per-project count without mixing saved selections between projects.
- Row checkboxes update `Выбрано`; the header checkbox supports checked and indeterminate states and toggles the full project selection.
- A changed selection enables Cancel and Save. Cancel restores the saved draft; Save persists it for that project in the current prototype session.
- Summary changes are exposed through `role="status"`; all checkboxes and the project selector have accessible names.
- Drawer focus trapping, Escape dismissal and focus restoration remain owned by the shared `Drawer`; tabs retain shared keyboard behavior.
- Final browser run: correct page identity, meaningful DOM snapshot, no framework overlay, no console warnings or errors.
- Responsive check: at the natural 1185 × 667 viewport the drawer switches to full width and preserves all five columns through its table scroll container.

## Comparison history

1. Initial implementation: P2 at narrower desktop widths — the 70% drawer clipped the five-column table. Fixed by promoting the drawer to full width at 1280 px and below while preserving the 70% reference width at 1707 px.
2. Revised equal-size comparison: no remaining actionable P0/P1/P2 differences. The shared tab focus indicator can appear in automated keyboard captures; it is an intentional accessibility state, not a default visual mismatch.

## Follow-up polish

- P3: small antialiasing and subpixel glyph-position differences remain between the source browser and local renderer.

## Annotation correction — bottom bar

- Проверка выполнялась по внешней аннотации и сессионным снимкам, которые не входят в поддерживаемый контекст проекта.
- The non-product blue footer and its 28 px height reservation were removed. The workspace now ends at the viewport boundary (`workspaceBottom === innerHeight`) with no replacement strip or unintended gap.

**Результат проверки:** пройдено для зафиксированного состояния.
