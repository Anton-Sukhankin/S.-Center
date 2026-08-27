import { appendContent, setAttributes } from './dom.js';
import { createEmptyState } from './empty-state.js';

const ALIGNMENTS = new Set(['start', 'center', 'end']);
const ROW_SIZES = new Set(['small', 'medium', 'large']);
const SORT_DIRECTIONS = new Set(['none', 'ascending', 'descending']);

function normalizeAlignment(alignment) {
  return ALIGNMENTS.has(alignment) ? alignment : 'start';
}

function normalizeRowSize(size) {
  return ROW_SIZES.has(size) ? size : 'medium';
}

function normalizeSortDirection(direction) {
  return SORT_DIRECTIONS.has(direction) ? direction : 'none';
}

function normalizeLength(value) {
  if (value === undefined || value === null || value === '') return '';
  return typeof value === 'number' ? `${value}px` : String(value);
}

function appendResolvedContent(target, content) {
  if (content?.element instanceof Node) {
    target.append(content.element);
    return;
  }
  appendContent(target, content);
}

function isTableCellComponent(value) {
  return value?.element?.tagName === 'TD' || value?.element?.tagName === 'TH';
}

function isInteractiveTarget(target) {
  return target instanceof Element && Boolean(target.closest(
    'a, button, input, select, textarea, summary, [role="button"], [role="combobox"], [role="menuitem"], [contenteditable="true"]',
  ));
}

function setCellDimensions(element, { width, minWidth, maxWidth } = {}) {
  element.style.width = normalizeLength(width);
  element.style.minWidth = normalizeLength(minWidth);
  element.style.maxWidth = normalizeLength(maxWidth);
}

function createDefaultTableEmptyState() {
  return createEmptyState({
    title: 'Нет данных',
    description: 'В таблице пока нет элементов для отображения.',
    size: 'small',
    surface: 'plain',
    role: 'status',
  }).element;
}

export function createTableHeaderCell({
  content,
  align = 'start',
  sortable = false,
  sortDirection = 'none',
  width,
  minWidth,
  maxWidth,
  truncate = false,
  className = '',
  attributes = {},
  onSort,
} = {}) {
  const element = document.createElement('th');
  const normalizedAlign = normalizeAlignment(align);
  element.scope = 'col';
  element.className = [
    'ds-data-table__header-cell',
    `ds-data-table__cell--${normalizedAlign}`,
    truncate ? 'ds-data-table__cell--truncate' : '',
    sortable ? 'is-sortable' : '',
    className,
  ].filter(Boolean).join(' ');
  setCellDimensions(element, { width, minWidth, maxWidth });
  setAttributes(element, attributes);

  const contentElement = document.createElement('span');
  contentElement.className = 'ds-data-table__cell-content';
  appendResolvedContent(contentElement, content);

  let button = null;
  let indicator = null;
  let currentDirection = normalizeSortDirection(sortDirection);

  const setSortDirection = nextDirection => {
    currentDirection = normalizeSortDirection(nextDirection);
    if (sortable) element.setAttribute('aria-sort', currentDirection);
    if (indicator) indicator.dataset.direction = currentDirection;
  };

  if (sortable) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'ds-data-table__sort-button';
    button.append(contentElement);

    indicator = document.createElement('span');
    indicator.className = 'ds-data-table__sort-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    button.append(indicator);
    button.addEventListener('click', event => onSort?.(currentDirection, event));
    element.append(button);
  } else {
    element.append(contentElement);
  }

  setSortDirection(currentDirection);
  return { element, contentElement, button, setSortDirection };
}

export function createTableCell({
  content,
  align = 'start',
  colSpan,
  rowSpan,
  truncate = false,
  className = '',
  attributes = {},
} = {}) {
  const element = document.createElement('td');
  const normalizedAlign = normalizeAlignment(align);
  element.className = [
    'ds-data-table__cell',
    `ds-data-table__cell--${normalizedAlign}`,
    truncate ? 'ds-data-table__cell--truncate' : '',
    className,
  ].filter(Boolean).join(' ');
  if (colSpan) element.colSpan = colSpan;
  if (rowSpan) element.rowSpan = rowSpan;
  setAttributes(element, attributes);

  const contentElement = document.createElement('div');
  contentElement.className = 'ds-data-table__cell-content';
  appendResolvedContent(contentElement, content);
  element.append(contentElement);

  return { element, contentElement };
}

export function createTableRow({
  cells = [],
  size = 'medium',
  selected = false,
  disabled = false,
  className = '',
  attributes = {},
  onActivate,
} = {}) {
  const element = document.createElement('tr');
  const normalizedSize = normalizeRowSize(size);
  element.className = [
    'ds-data-table__row',
    `ds-data-table__row--${normalizedSize}`,
    selected ? 'is-selected' : '',
    disabled ? 'is-disabled' : '',
    onActivate ? 'is-interactive' : '',
    className,
  ].filter(Boolean).join(' ');
  if (selected) element.setAttribute('aria-selected', 'true');
  if (disabled) element.setAttribute('aria-disabled', 'true');
  setAttributes(element, attributes);

  cells.forEach(cell => {
    if (isTableCellComponent(cell)) {
      element.append(cell.element);
      return;
    }
    const definition = cell instanceof Node || typeof cell !== 'object' || cell === null
      ? { content: cell }
      : cell;
    element.append(createTableCell(definition).element);
  });

  if (onActivate) {
    element.tabIndex = disabled ? -1 : 0;
    const activate = event => {
      if (disabled || isInteractiveTarget(event.target)) return;
      onActivate(event);
    };
    element.addEventListener('click', activate);
    element.addEventListener('keydown', event => {
      if (disabled || isInteractiveTarget(event.target) || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      onActivate(event);
    });
  }

  return { element };
}

export function createTable({
  caption,
  captionHidden = false,
  columns = [],
  rows = [],
  rowSize = 'medium',
  stickyHeader = false,
  striped = false,
  hoverable = true,
  scrollable = false,
  layout = 'auto',
  emptyContent,
  className = '',
  attributes = {},
  getRowProps,
  onRowActivate,
  onSort,
} = {}) {
  const element = document.createElement('div');
  element.className = [
    'ds-data-table-container',
    scrollable ? 'is-scrollable' : '',
    className,
  ].filter(Boolean).join(' ');

  const table = document.createElement('table');
  table.className = [
    'ds-data-table',
    stickyHeader ? 'ds-data-table--sticky-header' : '',
    striped ? 'ds-data-table--striped' : '',
    hoverable ? 'ds-data-table--hoverable' : '',
    layout === 'fixed' ? 'ds-data-table--fixed' : '',
  ].filter(Boolean).join(' ');
  setAttributes(table, attributes);

  let captionElement = null;
  if (caption !== undefined && caption !== null) {
    captionElement = document.createElement('caption');
    captionElement.className = [
      'ds-data-table__caption',
      captionHidden ? 'ds-visually-hidden' : '',
    ].filter(Boolean).join(' ');
    appendResolvedContent(captionElement, caption);
    table.append(captionElement);
  }

  const head = document.createElement('thead');
  head.className = 'ds-data-table__head';
  const headerRow = document.createElement('tr');
  headerRow.className = 'ds-data-table__header-row';
  head.append(headerRow);

  const body = document.createElement('tbody');
  body.className = 'ds-data-table__body';
  table.append(head, body);
  element.append(table);

  let currentRows = [...rows];
  let currentRowSize = normalizeRowSize(rowSize);
  let sortState = {
    key: columns.find(column => normalizeSortDirection(column.sortDirection) !== 'none')?.key ?? null,
    direction: normalizeSortDirection(columns.find(column => normalizeSortDirection(column.sortDirection) !== 'none')?.sortDirection),
  };
  const headerCells = new Map();

  const syncSortState = () => {
    headerCells.forEach((headerCell, key) => {
      headerCell.setSortDirection(key === sortState.key ? sortState.direction : 'none');
    });
  };

  const handleSort = (column, currentDirection, event) => {
    const nextDirection = currentDirection === 'ascending' ? 'descending' : 'ascending';
    sortState = { key: column.key, direction: nextDirection };
    syncSortState();
    onSort?.({ key: column.key, direction: nextDirection, column }, event);
  };

  columns.forEach(column => {
    const headerCell = createTableHeaderCell({
      content: column.header ?? column.label ?? column.key,
      align: column.align,
      sortable: column.sortable,
      sortDirection: column.sortDirection,
      width: column.width,
      minWidth: column.minWidth,
      maxWidth: column.maxWidth,
      truncate: column.truncate,
      className: column.headerClassName,
      attributes: column.headerAttributes,
      onSort: (direction, event) => handleSort(column, direction, event),
    });
    headerCells.set(column.key, headerCell);
    headerRow.append(headerCell.element);
  });

  const renderRows = () => {
    body.replaceChildren();
    if (!currentRows.length) {
      const emptyRow = createTableRow({
        size: currentRowSize,
        cells: [{
          content: emptyContent === undefined ? createDefaultTableEmptyState() : emptyContent,
          colSpan: Math.max(columns.length, 1),
          className: 'ds-data-table__empty',
        }],
      });
      body.append(emptyRow.element);
      return;
    }

    currentRows.forEach((row, rowIndex) => {
      const rowProps = getRowProps?.(row, rowIndex) || {};
      const cells = columns.map(column => ({
        content: column.render
          ? column.render(row?.[column.key], row, rowIndex)
          : row?.[column.key],
        align: column.align,
        truncate: column.truncate,
        className: column.cellClassName,
        attributes: typeof column.cellAttributes === 'function'
          ? column.cellAttributes(row, rowIndex)
          : column.cellAttributes,
      }));
      const tableRow = createTableRow({
        cells,
        size: rowProps.size || currentRowSize,
        selected: rowProps.selected,
        disabled: rowProps.disabled,
        className: rowProps.className,
        attributes: rowProps.attributes,
        onActivate: onRowActivate
          ? event => onRowActivate(row, rowIndex, event)
          : undefined,
      });
      body.append(tableRow.element);
    });
  };

  renderRows();
  syncSortState();

  return {
    element,
    table,
    head,
    body,
    captionElement,
    setRows(nextRows = []) {
      currentRows = [...nextRows];
      renderRows();
    },
    setRowSize(nextSize) {
      currentRowSize = normalizeRowSize(nextSize);
      renderRows();
    },
    setSort(key, direction = 'none') {
      sortState = { key, direction: normalizeSortDirection(direction) };
      syncSortState();
    },
  };
}
