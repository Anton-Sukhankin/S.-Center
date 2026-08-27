import { setAttributes } from './dom.js';

export const CHESSBOARD_SELECTION_MODES = Object.freeze(['none', 'single', 'multiple']);
export const CHESSBOARD_TONES = Object.freeze(['neutral', 'accent', 'info', 'success', 'warning', 'danger']);
export const CHESSBOARD_PATTERNS = Object.freeze(['none', 'solid', 'diagonal']);
export const CHESSBOARD_CELL_APPEARANCES = Object.freeze(['default', 'absent']);

const selectionModes = new Set(CHESSBOARD_SELECTION_MODES);
const tones = new Set(CHESSBOARD_TONES);
const patterns = new Set(CHESSBOARD_PATTERNS);
const cellAppearances = new Set(CHESSBOARD_CELL_APPEARANCES);

export function createChessboardCellKey(rowId, columnId) {
  return `${String(rowId)}:${String(columnId)}`;
}

function normalizeAxis(items, axisName) {
  if (!Array.isArray(items)) throw new Error(`Chessboard ${axisName} must be an array.`);
  const ids = new Set();
  return items.map((item, index) => {
    const normalized = typeof item === 'object' && item !== null
      ? { ...item, id: String(item.id ?? index), label: String(item.label ?? item.id ?? index) }
      : { id: String(item), label: String(item) };
    if (ids.has(normalized.id)) throw new Error(`Duplicate chessboard ${axisName} id: ${normalized.id}`);
    ids.add(normalized.id);
    return normalized;
  });
}

function normalizeCell(cell = {}) {
  const tone = tones.has(cell.tone) ? cell.tone : 'neutral';
  return {
    state: cell.state ? String(cell.state) : '',
    label: cell.label ? String(cell.label) : '',
    text: cell.text === undefined || cell.text === null ? '' : String(cell.text),
    tone,
    pattern: patterns.has(cell.pattern) ? cell.pattern : 'none',
    appearance: cellAppearances.has(cell.appearance) ? cell.appearance : 'default',
    disabled: Boolean(cell.disabled),
  };
}

/**
 * Creates an accessible row-by-column matrix with none, single or multiple selection.
 * Domain state labels, colors and mutation results are supplied by the consumer.
 */
export function createChessboard({
  label = 'Шахматка',
  rowHeaderLabel = 'Строка',
  rows = [],
  columns = [],
  cells = {},
  states = [],
  selectionMode = 'single',
  selectedKeys = [],
  showLegend = true,
  showCellTitle = true,
  emptyMessage = 'Нет данных для отображения',
  className = '',
  attributes = {},
  onSelectionChange,
  onCellActivate,
} = {}) {
  if (!selectionModes.has(selectionMode)) throw new Error(`Unknown chessboard selection mode: ${selectionMode}`);

  const normalizedRows = normalizeAxis(rows, 'rows');
  const normalizedColumns = normalizeAxis(columns, 'columns');
  const stateMap = new Map(states.map(state => [String(state.id), {
    ...state,
    id: String(state.id),
    label: String(state.label ?? state.id),
    tone: tones.has(state.tone) ? state.tone : 'neutral',
    pattern: patterns.has(state.pattern) ? state.pattern : 'none',
  }]));
  const cellData = new Map();
  Object.entries(cells || {}).forEach(([key, cell]) => cellData.set(String(key), normalizeCell(cell)));

  const element = document.createElement('section');
  element.className = ['ds-chessboard', className].filter(Boolean).join(' ');
  setAttributes(element, attributes);

  const scroll = document.createElement('div');
  scroll.className = 'ds-chessboard__scroll';
  scroll.tabIndex = 0;
  scroll.setAttribute('role', 'region');
  scroll.setAttribute('aria-label', `${label}. Прокручиваемая область`);

  const table = document.createElement('table');
  table.className = 'ds-chessboard__table';
  table.setAttribute('aria-label', label);

  const caption = document.createElement('caption');
  caption.className = 'ds-visually-hidden';
  caption.textContent = label;
  table.append(caption);

  const liveRegion = document.createElement('span');
  liveRegion.className = 'ds-visually-hidden';
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');

  const cellElements = new Map();
  const cellPositions = new Map();
  let currentSelectionMode = selectionMode;
  let selected = new Set();
  let rovingKey = null;

  const cellDescription = (row, column, cell) => {
    const state = stateMap.get(cell.state);
    const stateLabel = cell.label || state?.label || 'Без состояния';
    return `${row.label}, ${column.label}: ${cell.disabled ? stateLabel || 'Недоступно' : stateLabel}`;
  };

  const syncCell = key => {
    const button = cellElements.get(key);
    if (!button) return;
    const cell = cellData.get(key) ?? normalizeCell();
    const selectedState = selected.has(key);
    const state = stateMap.get(cell.state);
    const position = cellPositions.get(key);
    const tone = tones.has(cell.tone) && cell.tone !== 'neutral' ? cell.tone : state?.tone || cell.tone;
    const pattern = cell.pattern !== 'none' ? cell.pattern : state?.pattern || cell.pattern;
    button.dataset.tone = tone;
    button.dataset.state = cell.state;
    button.dataset.pattern = pattern;
    button.dataset.appearance = cell.appearance;
    button.classList.toggle('is-selected', selectedState);
    button.disabled = cell.disabled;
    button.textContent = cell.text;
    button.setAttribute('aria-label', cellDescription(position.row, position.column, cell));
    if (showCellTitle) button.title = button.getAttribute('aria-label');
    else button.removeAttribute('title');
    if (currentSelectionMode === 'none') button.removeAttribute('aria-pressed');
    else button.setAttribute('aria-pressed', String(selectedState));
  };

  const syncRovingTabIndex = preferredKey => {
    const enabledKeys = [...cellElements.entries()].filter(([, button]) => !button.disabled).map(([key]) => key);
    if (preferredKey && enabledKeys.includes(preferredKey)) rovingKey = preferredKey;
    else if (!rovingKey || !enabledKeys.includes(rovingKey)) rovingKey = enabledKeys[0] ?? null;
    cellElements.forEach((button, key) => { button.tabIndex = key === rovingKey ? 0 : -1; });
    scroll.tabIndex = rovingKey ? -1 : 0;
  };

  const selectionDetails = () => [...selected].map(key => {
    const position = cellPositions.get(key);
    return position ? { key, ...position, cell: { ...(cellData.get(key) ?? normalizeCell()) } } : null;
  }).filter(Boolean);

  const emitSelection = (reason, event) => {
    const details = selectionDetails();
    liveRegion.textContent = details.length ? `Выбрано позиций: ${details.length}` : 'Выбор сброшен';
    onSelectionChange?.(details, { keys: [...selected], reason, event });
  };

  const setSelectedKeys = (nextKeys, { emit = false, reason = 'api', event } = {}) => {
    const validKeys = [...new Set(nextKeys || [])].map(String).filter(key => {
      const cell = cellData.get(key) ?? normalizeCell();
      return cellElements.has(key) && !cell.disabled;
    });
    selected = new Set(currentSelectionMode === 'none' ? [] : currentSelectionMode === 'single' ? validKeys.slice(0, 1) : validKeys);
    cellElements.forEach((_, key) => syncCell(key));
    syncRovingTabIndex([...selected][0]);
    if (emit) emitSelection(reason, event);
  };

  const moveFocus = (key, rowDelta, columnDelta, edge) => {
    const position = cellPositions.get(key);
    if (!position) return;
    let rowIndex = position.rowIndex;
    let columnIndex = position.columnIndex;
    if (edge === 'start') columnIndex = 0;
    else if (edge === 'end') columnIndex = normalizedColumns.length - 1;
    else {
      rowIndex += rowDelta;
      columnIndex += columnDelta;
    }
    while (rowIndex >= 0 && rowIndex < normalizedRows.length && columnIndex >= 0 && columnIndex < normalizedColumns.length) {
      const nextKey = createChessboardCellKey(normalizedRows[rowIndex].id, normalizedColumns[columnIndex].id);
      const next = cellElements.get(nextKey);
      if (next && !next.disabled) {
        rovingKey = nextKey;
        syncRovingTabIndex(nextKey);
        next.focus();
        return;
      }
      if (edge) return;
      rowIndex += rowDelta;
      columnIndex += columnDelta;
    }
  };

  if (normalizedRows.length && normalizedColumns.length) {
    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    const corner = document.createElement('th');
    corner.scope = 'col';
    corner.className = 'ds-chessboard__corner';
    corner.textContent = rowHeaderLabel;
    headRow.append(corner);
    normalizedColumns.forEach(column => {
      const header = document.createElement('th');
      header.scope = 'col';
      header.textContent = column.label;
      headRow.append(header);
    });
    head.append(headRow);

    const body = document.createElement('tbody');
    normalizedRows.forEach((row, rowIndex) => {
      const tableRow = document.createElement('tr');
      const rowHeader = document.createElement('th');
      rowHeader.scope = 'row';
      rowHeader.textContent = row.label;
      tableRow.append(rowHeader);
      normalizedColumns.forEach((column, columnIndex) => {
        const key = createChessboardCellKey(row.id, column.id);
        const cell = cellData.get(key) ?? normalizeCell();
        cellData.set(key, cell);
        cellPositions.set(key, { row, column, rowIndex, columnIndex });

        const tableCell = document.createElement('td');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'ds-chessboard__cell';
        button.dataset.cellKey = key;
        button.addEventListener('click', event => {
          if (currentSelectionMode === 'single') {
            setSelectedKeys(selected.has(key) ? [] : [key], { emit: true, reason: selected.has(key) ? 'deselect' : 'select', event });
          } else if (currentSelectionMode === 'multiple') {
            const next = new Set(selected);
            next.has(key) ? next.delete(key) : next.add(key);
            setSelectedKeys(next, { emit: true, reason: next.has(key) ? 'select' : 'deselect', event });
          }
          onCellActivate?.({ key, row, column, cell: { ...cellData.get(key) }, selected: selected.has(key), event });
        });
        button.addEventListener('keydown', event => {
          const keyMap = {
            ArrowUp: [-1, 0],
            ArrowDown: [1, 0],
            ArrowLeft: [0, -1],
            ArrowRight: [0, 1],
          };
          if (keyMap[event.key]) {
            event.preventDefault();
            moveFocus(key, ...keyMap[event.key]);
          } else if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            moveFocus(key, 0, 0, event.key === 'Home' ? 'start' : 'end');
          }
        });
        cellElements.set(key, button);
        syncCell(key);
        tableCell.append(button);
        tableRow.append(tableCell);
      });
      body.append(tableRow);
    });
    table.append(head, body);
    scroll.append(table);
  } else {
    const empty = document.createElement('p');
    empty.className = 'ds-chessboard__empty';
    empty.setAttribute('role', 'status');
    empty.textContent = emptyMessage;
    scroll.append(empty);
  }

  const legend = document.createElement('ul');
  legend.className = 'ds-chessboard__legend';
  legend.setAttribute('aria-label', 'Легенда состояний');
  states.forEach(state => {
    const item = document.createElement('li');
    const marker = document.createElement('span');
    marker.className = 'ds-chessboard__legend-marker';
    marker.dataset.tone = tones.has(state.tone) ? state.tone : 'neutral';
    marker.dataset.pattern = patterns.has(state.pattern) ? state.pattern : 'none';
    marker.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.textContent = state.label ?? state.id;
    item.append(marker, text);
    legend.append(item);
  });
  legend.hidden = !showLegend || states.length === 0;

  element.append(scroll, legend, liveRegion);
  setSelectedKeys(selectedKeys);

  return {
    element,
    scroll,
    table,
    legend,
    getSelectedKeys: () => [...selected],
    getSelectedCells: selectionDetails,
    setSelectedKeys,
    clearSelection(options = {}) {
      setSelectedKeys([], { reason: 'clear', ...options });
    },
    setSelectionMode(nextMode, { emit = false } = {}) {
      if (!selectionModes.has(nextMode)) throw new Error(`Unknown chessboard selection mode: ${nextMode}`);
      currentSelectionMode = nextMode;
      setSelectedKeys([...selected], { emit, reason: 'mode-change' });
    },
    setCellState(key, nextCell) {
      const normalizedKey = String(key);
      if (!cellElements.has(normalizedKey)) return false;
      const merged = { ...cellData.get(normalizedKey), ...nextCell };
      if (Object.hasOwn(nextCell, 'state') && !Object.hasOwn(nextCell, 'pattern')) merged.pattern = 'none';
      cellData.set(normalizedKey, normalizeCell(merged));
      syncCell(normalizedKey);
      syncRovingTabIndex(rovingKey);
      return true;
    },
    getCellElement(key) {
      return cellElements.get(String(key)) ?? null;
    },
    focusCell(key) {
      const normalizedKey = String(key);
      const button = cellElements.get(normalizedKey);
      if (!button || button.disabled) return false;
      syncRovingTabIndex(normalizedKey);
      button.focus();
      return true;
    },
  };
}
