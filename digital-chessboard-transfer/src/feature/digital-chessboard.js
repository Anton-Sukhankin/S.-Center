// Feature «Цифровая шахматка». Нативный classic-script модуль без зависимости от сборщика.
(function (window, document) {
    'use strict';

    const STATUS_META = {
        'in-progress': { label: 'В работе', className: 'is-in-progress' },
        completed: { label: 'Выполнено', className: 'is-completed' },
        delayed: { label: 'Отстаёт', className: 'is-delayed' },
        'no-data': { label: 'Нет данных', className: 'is-no-data' },
        'not-applicable': { label: 'Не применимо', className: 'is-not-applicable' }
    };
    const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    let root = null;
    let context = null;
    let model = null;
    let projectId = null;
    let activeObjectId = null;
    let activePeriodId = null;
    let activeRange = null;
    let viewMode = 'fact';
    let appliedWorkIds = [null, null];
    let overlay = null;
    let pickerSlot = null;
    let pendingWorkId = null;
    let compareDraft = [null, null];
    let activeCompareSlot = 0;
    let searchQuery = '';
    let calendarMonth = '2026-06-01';
    let calendarDraft = null;
    let calendarHover = null;
    let syncingScroll = false;
    let scrollObserver = null;
    let stopScrollDrag = null;
    let overlayReturnFocusKey = null;
    let pendingFocusKey = null;
    let shouldFocusModalSearch = false;
    let mounted = false;

    function esc(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
    }

    function icon(name, size = 18) {
        return `<i data-lucide="${name}" aria-hidden="true" style="width:${size}px;height:${size}px"></i>`;
    }

    function refreshIcons() {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });
        }
    }

    function activeObject() {
        return model && model.status === 'ready' ? model.objects.find((item) => item.id === activeObjectId) || model.objects[0] : null;
    }

    function activePeriod() {
        const object = activeObject();
        return object ? object.periods.find((item) => item.id === activePeriodId) || object.periods[0] : null;
    }

    function findWork(workId) {
        return activePeriod()?.works.find((item) => item.id === workId) || null;
    }

    function resetForModel() {
        if (!model || model.status !== 'ready') {
            activeObjectId = activePeriodId = null;
            appliedWorkIds = [null, null];
            return;
        }
        const object = model.objects[0];
        const period = object.periods[0];
        activeObjectId = object.id;
        activePeriodId = period.id;
        activeRange = { start: period.startDate, end: period.endDate };
        appliedWorkIds = [period.works[0]?.id || null, null];
        viewMode = 'fact';
        closeOverlays();
    }

    function formatRange(range) {
        if (!range?.start || !range?.end) return 'Выберите период';
        const start = new Date(`${range.start}T00:00:00`);
        const end = new Date(`${range.end}T00:00:00`);
        return `${start.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} — ${end.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    }

    function formatFullDate(value) {
        if (!value) return '';
        return new Date(`${value}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function objectCardViewModels() {
        return model.objects.map((object) => {
            const selected = object.id === activeObjectId;
            const period = object.periods.find((item) => item.id === activePeriodId) || object.periods[0];
            const summary = period.summary;
            const deviation = summary.deviation === 0 ? 'По плану' : `${summary.deviation > 0 ? '+' : ''}${summary.deviation} п.п. к плану`;
            return {
                id: object.id,
                name: object.name,
                typeLabel: object.typeLabel || object.type,
                descriptionLabel: object.structure,
                icon: object.icon,
                progressPercent: summary.actual,
                deviationLabel: deviation,
                deviationTone: summary.deviation < 0 ? 'behind' : 'on-plan',
                metaLabel: object.structure,
                selected
            };
        });
    }

    function objectCards() {
        const renderer = window.SCenterComponents?.renderConstructionObjectSelector;
        if (typeof renderer !== 'function') throw new Error('Construction object selector is not loaded.');
        return renderer(objectCardViewModels(), {
            activeId: activeObjectId,
            ariaLabel: 'Объекты строительства',
            className: 'dch-object-selector',
            action: 'select-object'
        });
    }

    function metricsBar() {
        const summary = activePeriod().summary;
        return `<section class="dch-metrics" aria-label="Сводная статистика и режим отображения">
            <div class="dch-summary-item dch-summary-readiness"><span>Готовность</span><strong>${summary.actual}%</strong></div>
            <div class="dch-summary-item"><span>План</span><strong>${summary.plan}%</strong></div>
            <div class="dch-summary-item dch-summary-deviation"><span>Отклонение</span><strong>${summary.deviation > 0 ? '+' : ''}${summary.deviation} п.п.</strong></div>
            <div class="dch-summary-item dch-summary-updated"><span>Обновлено</span><strong>${esc(summary.updatedAt)}</strong></div>
            <div class="dch-summary-actions">
                <div class="dch-date-wrap"><button class="dch-context-trigger${overlay === 'date' ? ' is-open' : ''}" type="button" data-action="toggle-date" data-focus-key="date-trigger" aria-haspopup="dialog" aria-expanded="${overlay === 'date'}">${icon('calendar-days', 18)}<span>${formatRange(activeRange)}</span>${icon('chevron-down', 16)}</button>${overlay === 'date' ? datePopover() : ''}</div>
                <div class="dch-segmented" aria-label="Режим отображения"><button type="button" data-action="view-fact" class="${viewMode === 'fact' ? 'is-active' : ''}">Факт</button><button type="button" data-action="view-plan" class="${viewMode === 'fact-plan' ? 'is-active' : ''}">Факт / план</button></div>
                <button class="dch-primary dch-compare-button" type="button" data-action="open-compare" data-focus-key="compare-trigger" ${appliedWorkIds.every((id) => !id) ? 'disabled' : ''}>${icon('git-compare-arrows', 16)}<span>Сравнить работы</span></button>
            </div>
        </section>`;
    }

    function workSectionHeader() {
        return `<header class="dch-section-header" aria-labelledby="dch-work-section-title"><h2 id="dch-work-section-title">Готовность секций по этажам</h2></header>`;
    }

    function statusValue(cell) {
        if (cell.status === 'no-data' || cell.status === 'not-applicable') return '—';
        const fact = cell.actual === null ? '—' : `${cell.actual}%`;
        const plan = cell.plan === null ? '—' : `${cell.plan}%`;
        return viewMode === 'fact-plan' ? `${fact} / ${plan}` : fact;
    }

    function workHeader(work, slot) {
        return `<div class="dch-work-details">
            <section class="dch-work-identity">${work ? `<button class="dch-work-name" type="button" data-action="open-picker" data-slot="${slot}" data-focus-key="work-name-${slot}" title="Изменить вид работ" aria-label="Изменить вид работ: ${esc(work.code)} ${esc(work.name)}"><span class="dch-work-dot ${STATUS_META[Object.values(work.cells)[0]?.status]?.className || 'is-in-progress'}"></span><span class="dch-work-name-text">${esc(work.code)} ${esc(work.name)}</span><span class="dch-work-name-icon" aria-hidden="true">${icon('pencil', 16)}</span></button>` : '<span class="dch-work-empty-title">Работа не выбрана</span>'}</section>
            <section class="dch-work-parameters">${work ? `<dl><div><dt>Плановый срок</dt><dd>${esc(work.plannedStart)} — ${esc(work.plannedEnd)}</dd></div><div><dt>Подрядчик</dt><dd>${esc(work.contractor)}</dd></div><div><dt>Общая готовность по работе</dt><dd class="dch-completion">${work.completion}%</dd></div></dl>` : ''}</section>
            <section class="dch-work-remove"><button class="dch-icon-button" type="button" data-action="remove-work" data-slot="${slot}" aria-label="Убрать выбранную работу" ${work ? '' : 'disabled'}>${icon('x', 14)}</button></section>
        </div>`;
    }

    function matrix(work, object, slot) {
        const minWidth = 92 + work.sections.length * 112;
        const heads = work.sections.map((section) => `<th scope="col">${esc(section.name)}</th>`).join('');
        const rows = work.floors.map((floor) => {
            const cells = work.sections.map((section) => {
                const cell = work.cells[`${floor}:${section.id}`];
                const meta = STATUS_META[cell.status];
                const title = `${meta.label}. Факт ${cell.actual === null ? '—' : `${cell.actual}%`}, план ${cell.plan === null ? '—' : `${cell.plan}%`}`;
                return `<td><span class="dch-matrix-cell ${meta.className}" title="${esc(title)}">${statusValue(cell)}</span></td>`;
            }).join('');
            return `<tr><th scope="row">${floor}</th>${cells}</tr>`;
        }).join('');
        return `<div class="dch-matrix-shell"><div class="dch-matrix-scroll" tabindex="0" data-matrix-slot="${slot}"><table class="dch-matrix-table" style="--dch-matrix-min-width:${minWidth}px"><thead><tr><th scope="col">${esc(object.rowLabel)}</th>${heads}</tr></thead><tbody>${rows}</tbody></table></div><i class="dch-scroll-indicator is-vertical"><b data-scroll-axis="vertical"></b></i><i class="dch-scroll-indicator is-horizontal"><b data-scroll-axis="horizontal"></b></i></div>`;
    }

    function legend() {
        return `<footer class="dch-legend-row"><div class="dch-legend">${Object.keys(STATUS_META).map((status) => `<span><i class="dch-legend-swatch ${STATUS_META[status].className}"></i>${STATUS_META[status].label}</span>`).join('')}</div></footer>`;
    }

    function emptyState(slot) {
        return `<div class="dch-empty-state"><div class="dch-empty-icon">${icon('table-2', 28)}</div><div><h2>Вид работ не выбран</h2><p>Выберите работу, чтобы увидеть готовность по этажам и секциям.</p></div><button class="dch-primary dch-empty-action" type="button" data-action="open-picker" data-slot="${slot}" data-focus-key="empty-select-${slot}">Выбрать работу</button></div>`;
    }

    function workCard(work, slot, object) {
        return `<article class="dch-work-card${work ? '' : ' is-empty'}">${workHeader(work, slot)}${work ? matrix(work, object, slot) + legend() : emptyState(slot)}</article>`;
    }

    function workArea() {
        const object = activeObject();
        const visible = appliedWorkIds.map((id, slot) => ({ work: findWork(id), slot })).filter((entry) => entry.work);
        if (!visible.length) return `<div class="dch-work-grid">${workCard(null, 0, object)}</div>`;
        return `<div class="dch-work-grid${visible.length === 2 ? ' is-comparing' : ''}">${visible.map(({ work, slot }) => workCard(work, slot, object)).join('')}</div>`;
    }

    function renderUnsupported() {
        return `<main class="dch-workspace is-unsupported"><header class="dch-view-header"><h1 class="dch-view-title">Шахматка</h1></header><div class="dch-unsupported"><div class="dch-empty-icon">${icon('building-2', 28)}</div><h1>${esc(model.title)}</h1><p>${esc(model.description)}</p><button class="dch-primary" type="button" data-action="return-dashboard">Вернуться к дашборду</button></div></main>`;
    }

    function render() {
        if (!root || !model) return;
        root.innerHTML = model.status !== 'ready' ? renderUnsupported() : `<main class="dch-workspace"><header class="dch-view-header"><h1 class="dch-view-title">Шахматка</h1></header>${objectCards()}<section class="dch-work-section" aria-labelledby="dch-work-section-title">${workSectionHeader()}<div class="dch-work-body">${metricsBar()}${workArea()}</div></section></main>${renderModal()}`;
        refreshIcons();
        bindScrollSync();
        requestAnimationFrame(() => {
            if (shouldFocusModalSearch && (overlay === 'picker' || overlay === 'compare')) {
                const input = root.querySelector('.dch-work-search input');
                input?.focus();
                shouldFocusModalSearch = false;
            }
            if (overlay === 'compare') {
                root.querySelector('.dch-work-option.is-selected')?.scrollIntoView({ block: 'nearest' });
            }
            if (pendingFocusKey) {
                root.querySelector(`[data-focus-key="${pendingFocusKey}"]`)?.focus();
                pendingFocusKey = null;
            }
        });
    }

    function renderWorkList(selectedId, otherId, mode) {
        const normalized = searchQuery.trim().toLocaleLowerCase('ru');
        const works = activePeriod().works.filter((work) => `${work.code} ${work.name} ${work.contractor}`.toLocaleLowerCase('ru').includes(normalized));
        const name = mode === 'compare' ? 'comparison-work' : 'work';
        return `<div class="dch-work-list" role="radiogroup"><div class="dch-work-list-head"><span>Работа</span><span>Подрядчик</span><span>Готовность</span></div>${works.length ? works.map((work) => {
            const unavailable = work.id === otherId;
            return `<label class="dch-work-option${work.id === selectedId ? ' is-selected' : ''}${unavailable ? ' is-unavailable' : ''}"><span class="dch-work-option-name"><input type="radio" name="${name}" value="${work.id}" data-action="select-modal-work" data-focus-key="modal-work-${work.id}" ${work.id === selectedId ? 'checked' : ''} ${unavailable ? 'disabled' : ''}><span>${esc(work.code)} ${esc(work.name)}</span></span><span>${esc(work.contractor)}</span><strong>${work.completion}%</strong></label>`;
        }).join('') : '<div class="dch-work-list-empty"><strong>Работы не найдены</strong><span>Измените поисковый запрос.</span></div>'}</div>`;
    }

    function modalHeader(title, description, action) {
        return `<header class="dch-modal-header"><div><h2>${title}</h2><p>${description}</p></div><button class="dch-modal-close" type="button" data-action="${action}" aria-label="Закрыть">${icon('x', 14)}</button></header>`;
    }

    function pickerModal() {
        const otherId = appliedWorkIds[pickerSlot === 0 ? 1 : 0];
        return `<div class="dch-backdrop" data-action="backdrop"><section class="dch-dialog dch-picker-dialog" role="dialog" aria-modal="true">${modalHeader('Выбор работы', 'Выберите одну работу для отображения в шахматке.', 'close-overlay')}<label class="dch-work-search">${icon('search', 18)}<input type="search" data-action="search-work" value="${esc(searchQuery)}" placeholder="Найти работу" autocomplete="off"></label>${renderWorkList(pendingWorkId, otherId, 'picker')}<footer class="dch-modal-footer"><button class="dch-secondary" type="button" data-action="close-overlay">Отмена</button><button class="dch-primary" type="button" data-action="apply-picker" ${pendingWorkId ? '' : 'disabled'}>Выбрать</button></footer></section></div>`;
    }

    function compareSlot(slot) {
        const work = findWork(compareDraft[slot]);
        return `<div class="dch-compare-slot${slot === activeCompareSlot ? ' is-active' : ''}${work ? '' : ' is-empty'}"><button type="button" class="dch-compare-slot-main" data-action="activate-compare-slot" data-slot="${slot}" aria-pressed="${slot === activeCompareSlot}">${work ? `<strong>${esc(work.code)} ${esc(work.name)}</strong><span>${esc(work.contractor)}</span><b>${work.completion}%</b>` : `<span class="dch-compare-empty"><span class="dch-compare-empty-icon">${icon('clipboard-x', 16)}</span><strong>Работа не выбрана</strong><small>Выберите работу из списка</small></span>`}</button>${work ? `<button class="dch-compare-clear" type="button" data-action="clear-compare-slot" data-slot="${slot}" aria-label="Сбросить выбор">${icon('x', 14)}</button>` : ''}</div>`;
    }

    function compareModal() {
        const selected = compareDraft[activeCompareSlot];
        const other = compareDraft[activeCompareSlot === 0 ? 1 : 0];
        const valid = compareDraft[0] && compareDraft[1] && compareDraft[0] !== compareDraft[1];
        const dirty = compareDraft[0] !== appliedWorkIds[0] || compareDraft[1] !== appliedWorkIds[1];
        return `<div class="dch-backdrop" data-action="backdrop"><section class="dch-dialog dch-compare-dialog" role="dialog" aria-modal="true">${modalHeader('Настройка сравнения', 'Выберите две разные работы, чтобы сопоставить готовность по этажам и секциям.', 'close-overlay')}<div class="dch-compare-slots">${compareSlot(0)}${compareSlot(1)}</div><label class="dch-work-search">${icon('search', 18)}<input type="search" data-action="search-work" value="${esc(searchQuery)}" placeholder="Поиск по работе или подрядчику" autocomplete="off"></label>${renderWorkList(selected, other, 'compare')}<footer class="dch-modal-footer"><button class="dch-secondary" type="button" data-action="close-overlay">Отмена</button><button class="dch-primary" type="button" data-action="apply-compare" ${valid && dirty ? '' : 'disabled'}>Применить сравнение</button></footer></section></div>`;
    }

    function renderModal() {
        if (overlay === 'picker') return pickerModal();
        if (overlay === 'compare') return compareModal();
        return '';
    }

    function monthGrid(monthIso) {
        const date = new Date(`${monthIso}T00:00:00`);
        const year = date.getFullYear();
        const month = date.getMonth();
        const lead = (new Date(year, month, 1).getDay() + 6) % 7;
        const count = new Date(year, month + 1, 0).getDate();
        const blanks = Array.from({ length: lead }, () => '<span></span>').join('');
        const days = Array.from({ length: count }, (_, index) => {
            const value = `${year}-${String(month + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
            const inRange = calendarDraft?.start && calendarDraft?.end && value > calendarDraft.start && value < calendarDraft.end;
            const edge = value === calendarDraft?.start || value === calendarDraft?.end;
            const preview = calendarDraft?.start && !calendarDraft?.end && calendarHover && value > calendarDraft.start && value <= calendarHover;
            return `<button type="button" class="dch-calendar-day${inRange ? ' is-in-range' : ''}${preview ? ' is-preview' : ''}${edge ? ' is-edge' : ''}" data-action="select-date" data-date="${value}">${index + 1}</button>`;
        }).join('');
        return `<section class="dch-calendar-month"><h3>${MONTHS[month]} <span>${year}</span></h3><div class="dch-weekdays">${WEEKDAYS.map((day) => `<span>${day}</span>`).join('')}</div><div class="dch-calendar-days">${blanks}${days}</div></section>`;
    }

    function shiftMonth(value, delta) {
        const date = new Date(`${value}T00:00:00`);
        return `${date.getFullYear()}-${String(date.getMonth() + delta + 1).padStart(2, '0')}-01`;
    }

    function datePopover() {
        const periods = activeObject().periods;
        return `<div class="dch-date-popover" role="dialog"><header><div><strong>Диапазон дат</strong><span>Выберите начало и окончание периода</span></div><div><button type="button" data-action="calendar-prev" aria-label="Предыдущий месяц">${icon('chevron-left', 16)}</button><button type="button" data-action="calendar-next" aria-label="Следующий месяц">${icon('chevron-right', 16)}</button></div></header><div class="dch-date-presets">${periods.map((period) => `<button type="button" data-action="date-preset" data-start="${period.startDate}" data-end="${period.endDate}">${esc(period.label)}</button>`).join('')}</div><div class="dch-calendar-months">${monthGrid(calendarMonth)}${monthGrid(shiftMonth(calendarMonth, 1))}</div><footer><div><span>Выбранный период</span><strong>${calendarDraft?.start ? formatFullDate(calendarDraft.start) : 'Начальная дата'}${calendarDraft?.end ? ` — ${formatFullDate(calendarDraft.end)}` : ' — выберите окончание'}</strong></div><div><button class="dch-secondary" type="button" data-action="close-overlay">Отмена</button><button class="dch-primary" type="button" data-action="apply-date" ${calendarDraft?.start && calendarDraft?.end ? '' : 'disabled'}>Применить</button></div></footer></div>`;
    }

    function retainWorks(period) {
        appliedWorkIds = appliedWorkIds.map((id) => id && period.works.some((work) => work.id === id) ? id : null);
        if (!appliedWorkIds[0] && !appliedWorkIds[1]) appliedWorkIds[0] = period.works[0]?.id || null;
    }

    function closeOverlays(restoreFocus = false) {
        if (restoreFocus && overlayReturnFocusKey) pendingFocusKey = overlayReturnFocusKey;
        overlay = null;
        pickerSlot = null;
        pendingWorkId = null;
        searchQuery = '';
        calendarHover = null;
        overlayReturnFocusKey = null;
        shouldFocusModalSearch = false;
    }

    function selectObject(objectId, focusAfterRender = false) {
        activeObjectId = objectId;
        const period = activeObject().periods.find((item) => item.id === activePeriodId) || activeObject().periods[0];
        activePeriodId = period.id;
        activeRange = { start: period.startDate, end: period.endDate };
        retainWorks(period);
        closeOverlays();
        if (focusAfterRender) pendingFocusKey = `construction-object-${objectId}`;
    }

    function handleClick(event) {
        const target = event.target.closest('[data-action]');
        if (!target || !root?.contains(target)) return;
        const action = target.dataset.action;
        if (action === 'select-object') {
            selectObject(target.dataset.constructionObjectId);
        } else if (action === 'view-fact') viewMode = 'fact';
        else if (action === 'view-plan') viewMode = 'fact-plan';
        else if (action === 'toggle-date') {
            if (overlay === 'date') closeOverlays(true);
            else { overlayReturnFocusKey = 'date-trigger'; overlay = 'date'; calendarDraft = { ...activeRange }; calendarMonth = shiftMonth(`${activeRange.start.slice(0, 7)}-01`, -1); }
        } else if (action === 'open-picker') {
            overlayReturnFocusKey = target.dataset.focusKey || `work-name-${target.dataset.slot || 0}`;
            pickerSlot = Number(target.dataset.slot || 0); overlay = 'picker'; pendingWorkId = null; searchQuery = ''; shouldFocusModalSearch = true;
        } else if (action === 'remove-work') {
            const slot = Number(target.dataset.slot);
            appliedWorkIds[slot] = null;
            pendingFocusKey = `empty-select-${slot}`;
        } else if (action === 'open-compare') {
            overlayReturnFocusKey = 'compare-trigger';
            compareDraft = [...appliedWorkIds]; activeCompareSlot = compareDraft.findIndex((id) => !id); if (activeCompareSlot < 0) activeCompareSlot = 0; overlay = 'compare'; searchQuery = ''; shouldFocusModalSearch = true;
        } else if (action === 'activate-compare-slot') {
            activeCompareSlot = Number(target.dataset.slot); searchQuery = '';
        } else if (action === 'clear-compare-slot') {
            activeCompareSlot = Number(target.dataset.slot); compareDraft[activeCompareSlot] = null; searchQuery = '';
        } else if (action === 'select-modal-work') {
            if (overlay === 'picker') pendingWorkId = target.value;
            if (overlay === 'compare') compareDraft[activeCompareSlot] = target.value;
            pendingFocusKey = `modal-work-${target.value}`;
        } else if (action === 'apply-picker' && pendingWorkId) {
            const slot = pickerSlot;
            appliedWorkIds[slot] = pendingWorkId; viewMode = 'fact'; closeOverlays(); pendingFocusKey = `work-name-${slot}`;
        } else if (action === 'apply-compare' && compareDraft[0] && compareDraft[1] && compareDraft[0] !== compareDraft[1]) {
            appliedWorkIds = [...compareDraft]; viewMode = 'fact'; closeOverlays(); pendingFocusKey = 'compare-trigger';
        } else if (action === 'calendar-prev') calendarMonth = shiftMonth(calendarMonth, -1);
        else if (action === 'calendar-next') calendarMonth = shiftMonth(calendarMonth, 1);
        else if (action === 'date-preset') calendarDraft = { start: target.dataset.start, end: target.dataset.end };
        else if (action === 'select-date') {
            const value = target.dataset.date;
            if (!calendarDraft?.start || calendarDraft.end) calendarDraft = { start: value, end: null };
            else calendarDraft = value < calendarDraft.start ? { start: value, end: calendarDraft.start } : { start: calendarDraft.start, end: value };
        } else if (action === 'apply-date' && calendarDraft?.start && calendarDraft?.end) {
            activeRange = { ...calendarDraft };
            const end = new Date(`${activeRange.end}T00:00:00`).getTime();
            const period = activeObject().periods.reduce((nearest, item) => Math.abs(new Date(`${item.endDate}T00:00:00`).getTime() - end) < Math.abs(new Date(`${nearest.endDate}T00:00:00`).getTime() - end) ? item : nearest, activeObject().periods[0]);
            activePeriodId = period.id; retainWorks(period); closeOverlays(); pendingFocusKey = 'date-trigger';
        } else if (action === 'close-overlay' || action === 'backdrop' && event.target === target) closeOverlays(true);
        else if (action === 'return-dashboard') document.getElementById('nav-dashboard')?.click();
        else return;
        render();
    }

    function handleInput(event) {
        if (event.target.dataset.action !== 'search-work') return;
        searchQuery = event.target.value;
        const position = event.target.selectionStart;
        render();
        const input = root.querySelector('.dch-work-search input');
        input?.focus();
        input?.setSelectionRange(position, position);
    }

    function handleKeyDown(event) {
        const objectCard = event.target.closest?.('.cos-card');
        if (objectCard && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
            const nextId = window.SCenterComponents?.getConstructionObjectSelectorNextId?.(
                objectCardViewModels(),
                activeObjectId,
                event.key
            );
            if (!nextId) return;
            event.preventDefault();
            selectObject(nextId, true);
            render();
            return;
        }
        if (event.key === 'Tab' && (overlay === 'picker' || overlay === 'compare')) {
            const dialog = root.querySelector('.dch-dialog');
            const focusable = dialog ? [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])')].filter((element) => element.offsetParent !== null) : [];
            if (focusable.length) {
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        }
        if (event.key === 'Escape' && overlay) { closeOverlays(true); render(); }
    }

    function handleMouseOver(event) {
        const day = event.target.closest?.('[data-action="select-date"]');
        if (!day || overlay !== 'date' || !calendarDraft?.start || calendarDraft.end || day.dataset.date === calendarHover) return;
        calendarHover = day.dataset.date;
        render();
    }

    function handleDocumentClick(event) {
        if (overlay !== 'date') return;
        const dateWrap = event.target.closest?.('.dch-date-wrap');
        if (dateWrap) return;
        closeOverlays(true);
        render();
    }

    function handlePointerDown(event) {
        const thumb = event.target.closest?.('[data-scroll-axis]');
        if (!thumb || !root?.contains(thumb)) return;
        const shell = thumb.closest('.dch-matrix-shell');
        const scroller = shell?.querySelector('.dch-matrix-scroll');
        const track = thumb.parentElement;
        if (!scroller || !track) return;
        event.preventDefault();
        const axis = thumb.dataset.scrollAxis;
        const startPointer = axis === 'vertical' ? event.clientY : event.clientX;
        const startScroll = axis === 'vertical' ? scroller.scrollTop : scroller.scrollLeft;
        const trackLength = axis === 'vertical' ? track.clientHeight : track.clientWidth;
        const thumbLength = axis === 'vertical' ? thumb.offsetHeight : thumb.offsetWidth;
        const scrollRange = axis === 'vertical' ? scroller.scrollHeight - scroller.clientHeight : scroller.scrollWidth - scroller.clientWidth;
        const travel = Math.max(1, trackLength - thumbLength);
        thumb.setPointerCapture?.(event.pointerId);
        thumb.classList.add('is-dragging');
        const move = (moveEvent) => {
            const pointer = axis === 'vertical' ? moveEvent.clientY : moveEvent.clientX;
            const next = startScroll + (pointer - startPointer) * scrollRange / travel;
            if (axis === 'vertical') scroller.scrollTop = next;
            else scroller.scrollLeft = next;
        };
        const stop = () => {
            thumb.classList.remove('is-dragging');
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', stop);
            stopScrollDrag = null;
        };
        stopScrollDrag?.();
        stopScrollDrag = stop;
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', stop, { once: true });
    }

    function bindScrollSync() {
        scrollObserver?.disconnect();
        const scrollers = [...root.querySelectorAll('.dch-matrix-scroll')];
        function updateIndicators(scroller) {
            const shell = scroller.closest('.dch-matrix-shell');
            const vertical = shell?.querySelector('.dch-scroll-indicator.is-vertical b');
            const horizontal = shell?.querySelector('.dch-scroll-indicator.is-horizontal b');
            if (vertical) {
                const ratio = Math.min(1, scroller.clientHeight / scroller.scrollHeight);
                const travel = 100 - ratio * 100;
                vertical.parentElement.hidden = ratio >= 1;
                vertical.style.height = `${Math.max(8, ratio * 100)}%`;
                vertical.style.top = `${scroller.scrollHeight === scroller.clientHeight ? 0 : (scroller.scrollTop / (scroller.scrollHeight - scroller.clientHeight)) * travel}%`;
            }
            if (horizontal) {
                const ratio = Math.min(1, scroller.clientWidth / scroller.scrollWidth);
                const travel = 100 - ratio * 100;
                horizontal.parentElement.hidden = ratio >= 1;
                horizontal.style.width = `${Math.max(8, ratio * 100)}%`;
                horizontal.style.left = `${scroller.scrollWidth === scroller.clientWidth ? 0 : (scroller.scrollLeft / (scroller.scrollWidth - scroller.clientWidth)) * travel}%`;
            }
        }
        scrollers.forEach((source) => {
            updateIndicators(source);
            source.addEventListener('scroll', () => {
                updateIndicators(source);
                if (scrollers.length !== 2 || syncingScroll) return;
                syncingScroll = true;
                scrollers.forEach((target) => {
                    if (target !== source) {
                        target.scrollTop = source.scrollTop;
                        target.scrollLeft = source.scrollLeft;
                        updateIndicators(target);
                    }
                });
                requestAnimationFrame(() => { syncingScroll = false; });
            }, { passive: true });
        });
        if (window.ResizeObserver) {
            scrollObserver = new window.ResizeObserver(() => scrollers.forEach(updateIndicators));
            scrollers.forEach((scroller) => scrollObserver.observe(scroller));
        }
    }

    function mount(nextRoot, options = {}) {
        if (!nextRoot) throw new Error('SCenterDigitalChessboard.mount: root is required.');
        if (mounted && root !== nextRoot) destroy();
        root = nextRoot;
        root.addEventListener('click', handleClick);
        root.addEventListener('input', handleInput);
        root.addEventListener('mouseover', handleMouseOver);
        root.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('click', handleDocumentClick);
        mounted = true;
        setContext(options.context || window.activeContext || null);
    }

    function setContext(nextContext) {
        context = nextContext;
        const nextModel = window.digitalChessboardData?.getForContext(context);
        if (!nextModel) throw new Error('Data layer is not loaded.');
        const nextProjectId = nextModel.projectId;
        model = nextModel;
        if (nextProjectId !== projectId) { projectId = nextProjectId; resetForModel(); }
        render();
    }

    function show() { if (root) { root.hidden = false; render(); } }
    function hide() { closeOverlays(); if (root) root.hidden = true; }
    function destroy() {
        if (!root) return;
        root.removeEventListener('click', handleClick);
        root.removeEventListener('input', handleInput);
        root.removeEventListener('mouseover', handleMouseOver);
        root.removeEventListener('pointerdown', handlePointerDown);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('click', handleDocumentClick);
        scrollObserver?.disconnect();
        stopScrollDrag?.();
        root.innerHTML = '';
        root = null; mounted = false;
    }

    window.SCenterDigitalChessboard = Object.freeze({ mount, setContext, show, hide, closeOverlays: () => { closeOverlays(); render(); }, destroy });
})(window, document);
