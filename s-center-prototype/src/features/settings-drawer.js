import {
  createAlert,
  createButton,
  createCheckbox,
  createDrawer,
  createEmptyState,
  createIcon,
  createInput,
  createSelect,
  createTable,
  createTabs,
} from '../../../component-library-transfer/src/index.js';
import { constructionObjectsByProject, projects } from '../data/construction-objects.js';
import { constructionTypes } from '../data/construction-types.js';
import { icons } from '../ui/icons.js';

const infoIconUrl = new URL('../../../component-library-transfer/src/assets/icons/circle-info.svg', import.meta.url).href;
const closeIconUrl = new URL('../../../component-library-transfer/src/assets/icons/x.svg', import.meta.url).href;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function imageIcon(src, name, size = 20) {
  const image = document.createElement('img');
  image.src = src;
  image.alt = '';
  return createIcon({ name, size, fallback: image });
}

function sameSelection(left, right) {
  return left.size === right.size && Array.from(left).every(id => right.has(id));
}

function createDeferredPanel(message) {
  return createEmptyState({
    description: message,
    size: 'small',
    surface: 'plain',
    role: 'status',
    className: 's-center-settings-placeholder',
  }).element;
}

function createInformationBlock({ paragraphs, important }) {
  const copy = element('div', 's-center-settings-info__copy');
  paragraphs.forEach(paragraph => copy.append(element('p', '', paragraph)));
  if (important) {
    const line = element('p');
    line.append(element('strong', '', 'Важно: '), important);
    copy.append(line);
  }
  return createAlert({
    icon: imageIcon(infoIconUrl, 'circle-info', 20),
    message: copy,
    variant: 'info',
    dismissible: false,
    className: 's-center-settings-info',
  }).element;
}

function createTypesPanel({ onDirtyChange }) {
  let savedSelection = new Set(constructionTypes.filter(item => item.selected).map(item => item.id));
  let draftSelection = new Set(savedSelection);
  let query = '';
  const panel = element('div', 's-center-settings-types');
  const information = createInformationBlock({
    paragraphs: ['Настройки предназначены для выбора видов объектов строительства, которые будут отображаться в дереве проектов и использоваться в дальнейшей работе Цифровой шахматки. Для объектов строительства выбранных видов в дальнейшем будет доступна настройка работ, внесение плановых и фактических данных, а также расчёт степени готовности.'],
    important: 'настройки являются глобальными и применяются ко всем проектам системы.',
  });
  const search = createInput({
    placeholder: 'Поиск по видам объектов строительства',
    className: 's-center-settings-search',
    leadingIcon: createIcon({ name: 'search', size: 18, fallback: icons.search }),
    attributes: { 'aria-label': 'Поиск по видам объектов строительства', autocomplete: 'off' },
    onInput: value => { query = value; renderRows(); },
  });
  const headerSelection = createCheckbox({
    ariaLabel: 'Использовать все отображаемые виды в цифровой шахматке',
    className: 's-center-settings-table__checkbox',
    onChange: checked => {
      getVisibleRows().forEach(item => checked ? draftSelection.add(item.id) : draftSelection.delete(item.id));
      renderRows();
      syncDirty();
    },
  });
  const selectionHeader = element('div', 's-center-settings-table__selection-header');
  selectionHeader.append(headerSelection.element, element('span', '', 'Использовать в цифровой шахматке'));
  const resultsStatus = element('div', 'ds-visually-hidden');
  resultsStatus.setAttribute('role', 'status');
  resultsStatus.setAttribute('aria-live', 'polite');
  const table = createTable({
    caption: 'Виды объектов строительства для цифровой шахматки',
    captionHidden: true,
    className: 's-center-settings-table',
    columns: [
      { key: 'label', header: 'Вид объекта строительства', minWidth: 320 },
      { key: 'selected', header: selectionHeader, width: 260, render: (_, item) => createCheckbox({
        ariaLabel: `Использовать «${item.label}» в цифровой шахматке`,
        checked: draftSelection.has(item.id),
        className: 's-center-settings-table__checkbox',
        onChange: checked => {
          if (checked) draftSelection.add(item.id); else draftSelection.delete(item.id);
          syncHeaderSelection();
          syncDirty();
        },
      }).element },
    ],
    rows: constructionTypes,
    rowSize: 'medium',
    striped: true,
    hoverable: false,
    scrollable: true,
    layout: 'fixed',
    emptyContent: createEmptyState({ description: 'По заданному запросу ничего не найдено', size: 'small', surface: 'plain', role: 'status' }).element,
  });
  function getVisibleRows() {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru');
    return normalizedQuery ? constructionTypes.filter(item => item.label.toLocaleLowerCase('ru').includes(normalizedQuery)) : constructionTypes;
  }
  function syncHeaderSelection() {
    const rows = getVisibleRows();
    const count = rows.filter(item => draftSelection.has(item.id)).length;
    headerSelection.setChecked(rows.length > 0 && count === rows.length, count > 0 && count < rows.length);
  }
  function syncDirty() { onDirtyChange(!sameSelection(savedSelection, draftSelection)); }
  function renderRows() {
    const rows = getVisibleRows();
    table.setRows(rows);
    syncHeaderSelection();
    resultsStatus.textContent = `Найдено видов: ${rows.length}`;
  }
  const filterGroup = element('section', 's-center-settings-types__filter');
  filterGroup.setAttribute('aria-label', 'Фильтр видов объектов строительства');
  filterGroup.append(search.element, resultsStatus);
  const tableGroup = element('section', 's-center-settings-types__table');
  tableGroup.setAttribute('aria-label', 'Выбор видов объектов строительства');
  tableGroup.append(table.element);
  panel.append(information, filterGroup, tableGroup);
  renderRows();
  return {
    element: panel,
    reset() {
      draftSelection = new Set(savedSelection);
      query = '';
      search.setValue('');
      renderRows();
      syncDirty();
    },
    save() {
      savedSelection = new Set(draftSelection);
      syncDirty();
    },
    refresh: syncDirty,
  };
}

function createSelectionPanel({ onDirtyChange, onSummaryChange }) {
  const savedSelections = new Map(Object.entries(constructionObjectsByProject).map(([projectId, rows]) => [projectId, new Set(rows.filter(row => row.selected).map(row => row.id))]));
  let draftSelections = new Map(Array.from(savedSelections, ([id, selection]) => [id, new Set(selection)]));
  let currentProjectId = 'alkhimovo';
  const panel = element('div', 's-center-settings-selection');
  const projectSelect = createSelect({
    id: 's-center-settings-project',
    label: 'Проект',
    value: currentProjectId,
    options: projects,
    onChange: value => {
      currentProjectId = value;
      renderRows();
    },
  });
  projectSelect.element.classList.add('s-center-settings-project');
  const information = createInformationBlock({
    paragraphs: [
      'Выбор объектов строительства позволяет исключить из дерева и, соответственно, работы в Шахматке уже сданные объекты или объекты из перспективных очередей. Выбор сохраняется для каждого проекта отдельно.',
      'Отображаются объекты, соответствующие выбранным видам ОС.',
    ],
  });
  const headerSelection = createCheckbox({
    ariaLabel: 'Отображать все объекты проекта в дереве и Шахматке',
    className: 's-center-settings-table__checkbox',
    onChange: checked => {
      const selection = draftSelections.get(currentProjectId);
      getRows().forEach(row => checked ? selection.add(row.id) : selection.delete(row.id));
      renderRows();
    },
  });
  const selectionHeader = element('div', 's-center-settings-table__selection-header');
  selectionHeader.append(headerSelection.element, element('span', '', 'Отображать в дереве и Шахматке'));
  const table = createTable({
    caption: 'Объекты строительства выбранного проекта',
    captionHidden: true,
    className: 's-center-settings-table s-center-settings-selection-table',
    columns: [
      { key: 'name', header: 'Наименование объекта строительства', minWidth: 220 },
      { key: 'queue', header: 'Очередь', minWidth: 220 },
      { key: 'kind', header: 'Вид ОС', minWidth: 150 },
      { key: 'type', header: 'Тип ОС', minWidth: 120 },
      { key: 'selected', header: selectionHeader, width: 250, render: (_, row) => createCheckbox({
        ariaLabel: `Отображать «${row.name}» в дереве и Шахматке`,
        checked: draftSelections.get(currentProjectId).has(row.id),
        className: 's-center-settings-table__checkbox',
        onChange: checked => {
          const selection = draftSelections.get(currentProjectId);
          if (checked) selection.add(row.id); else selection.delete(row.id);
          syncState();
        },
      }).element },
    ],
    rows: [],
    rowSize: 'medium',
    hoverable: false,
    scrollable: true,
    layout: 'fixed',
  });
  function getRows() { return constructionObjectsByProject[currentProjectId] || []; }
  function hasChanges() {
    return Array.from(savedSelections).some(([projectId, saved]) => !sameSelection(saved, draftSelections.get(projectId) || new Set()));
  }
  function syncState() {
    const rows = getRows();
    const selection = draftSelections.get(currentProjectId) || new Set();
    const count = rows.filter(row => selection.has(row.id)).length;
    headerSelection.setChecked(rows.length > 0 && count === rows.length, count > 0 && count < rows.length);
    onSummaryChange({ total: rows.length, selected: count });
    onDirtyChange(hasChanges());
  }
  function renderRows() {
    table.setRows(getRows());
    syncState();
  }
  const projectGroup = element('section', 's-center-settings-selection__project');
  projectGroup.setAttribute('aria-label', 'Выбор проекта');
  projectGroup.append(projectSelect.element);
  const infoGroup = element('section', 's-center-settings-selection__info');
  infoGroup.setAttribute('aria-label', 'Сведения о выборе объектов');
  infoGroup.append(information);
  const tableGroup = element('section', 's-center-settings-selection__table');
  tableGroup.setAttribute('aria-label', 'Выбор объектов строительства');
  tableGroup.append(table.element);
  panel.append(projectGroup, infoGroup, tableGroup);
  renderRows();
  return {
    element: panel,
    reset() {
      draftSelections = new Map(Array.from(savedSelections, ([id, selection]) => [id, new Set(selection)]));
      currentProjectId = 'alkhimovo';
      projectSelect.setValue(currentProjectId);
      renderRows();
    },
    save() {
      draftSelections.forEach((selection, id) => savedSelections.set(id, new Set(selection)));
      syncState();
    },
    refresh: syncState,
  };
}

export function createSettingsDrawer() {
  let activeTab = 'types';
  let triggerElement = null;
  let drawer;
  const summary = element('div', 's-center-settings-footer__summary');
  summary.setAttribute('role', 'status');
  summary.setAttribute('aria-live', 'polite');
  const hint = element('div', 's-center-settings-footer__hint', 'После сохранения дерево проектов будет обновлено');
  const cancelButton = createButton({
    label: 'Отменить',
    variant: 'outlined',
    className: 's-center-settings-action s-center-settings-action--cancel',
    onClick: () => { getActiveController().reset(); drawer.close({ reason: 'cancel' }); },
  });
  const saveButton = createButton({
    label: 'Сохранить',
    variant: 'primary',
    className: 's-center-settings-action s-center-settings-action--save',
    onClick: () => { getActiveController().save(); drawer.close({ reason: 'save' }); },
  });
  const actions = element('div', 's-center-settings-actions');
  actions.append(cancelButton, saveButton);
  const actionGroup = element('div', 's-center-settings-footer__action-group');
  actionGroup.append(actions, hint);
  const footer = element('div', 's-center-settings-footer');
  footer.append(summary, actionGroup);
  function setDirty(dirty) {
    cancelButton.disabled = !dirty;
    saveButton.disabled = !dirty;
  }
  function setSummary({ total, selected }) { summary.textContent = `Всего объектов: ${total} Выбрано: ${selected}`; }
  const typesController = createTypesPanel({ onDirtyChange: dirty => { if (activeTab === 'types') setDirty(dirty); } });
  const selectionController = createSelectionPanel({
    onDirtyChange: dirty => { if (activeTab === 'selection') setDirty(dirty); },
    onSummaryChange: setSummary,
  });
  function getActiveController() { return activeTab === 'selection' ? selectionController : typesController; }
  function syncFooter() {
    const isSelectionTab = activeTab === 'selection';
    summary.hidden = !isSelectionTab;
    hint.hidden = !isSelectionTab;
    if (isSelectionTab) selectionController.refresh(); else typesController.refresh();
  }
  const tabs = createTabs({
    label: 'Разделы настроек',
    value: 'types',
    className: 's-center-settings-tabs',
    onChange: value => { activeTab = value; syncFooter(); },
    items: [
      { value: 'types', label: 'Виды ОС', content: typesController.element },
      { value: 'selection', label: 'Выбор ОС', content: selectionController.element },
      { value: 'work-template', label: 'Шаблон работ для ОС', content: createDeferredPanel('Шаблоны работ появятся на следующем этапе') },
      { value: 'plan-sources', label: 'Источники плана', content: createDeferredPanel('Источники плана появятся на следующем этапе') },
    ],
  });
  drawer = createDrawer({
    id: 's-center-settings-drawer',
    title: 'Настройки',
    content: tabs.element,
    footer,
    expanded: true,
    closeIcon: imageIcon(closeIconUrl, 'x', 20),
    closeLabel: 'Закрыть настройки',
    onOpen: () => {
      activeTab = 'types';
      typesController.reset();
      selectionController.reset();
      syncFooter();
    },
    onClose: () => {
      triggerElement?.setAttribute('aria-expanded', 'false');
      triggerElement = null;
    },
  });
  drawer.element.classList.add('s-center-settings-drawer');
  drawer.overlay.classList.add('s-center-settings-overlay');
  syncFooter();
  return {
    id: drawer.element.id,
    element: drawer.element,
    open(trigger) {
      triggerElement = trigger;
      triggerElement?.setAttribute('aria-expanded', 'true');
      tabs.setValue('types');
      drawer.open(trigger);
    },
    close: drawer.close,
    mount: drawer.mount,
    isOpen: drawer.isOpen,
  };
}
