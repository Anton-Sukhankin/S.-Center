import { createBulkActionBar } from './bulk-action-bar.js';
import { createButton } from './button.js';
import { createChessboard, createChessboardCellKey } from './chessboard.js';
import { createDocumentPreviewIcon } from './document-preview-icon.js';
import { createMenu } from './menu.js';

export default {
  title: 'Data Display/Chessboard',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

const rows = [16, 15, 14, 13, 12].map(floor => ({ id: floor, label: String(floor) }));
const columns = [1, 2, 3, 4, 5, 6].map(section => ({ id: section, label: `Секция ${section}` }));

const states = Object.freeze([
  { id: 'no-work', label: 'Работы не ведутся', tone: 'neutral', pattern: 'none' },
  { id: 'current-work', label: 'В работе на текущей неделе', tone: 'success', pattern: 'diagonal' },
  { id: 'current-done', label: 'Завершено на текущей неделе', tone: 'success', pattern: 'solid' },
  { id: 'previous-work', label: 'Было в работе на предыдущей неделе', tone: 'info', pattern: 'diagonal' },
  { id: 'previous-done', label: 'Завершено на предыдущей неделе', tone: 'info', pattern: 'solid' },
]);
const editableStates = states.filter(state => state.id !== 'no-work');

function cells({ showValues = false } = {}) {
  const result = {};
  rows.forEach((row, rowIndex) => columns.forEach((column, columnIndex) => {
    const key = createChessboardCellKey(row.id, column.id);
    const state = states[(rowIndex + columnIndex) % states.length];
    const absent = row.id === 16 && column.id === 6;
    result[key] = {
      state: absent ? '' : state.id,
      tone: absent ? 'neutral' : state.tone,
      pattern: absent ? 'none' : state.pattern,
      label: absent ? 'Пересечение отсутствует' : state.label,
      text: showValues ? `${Math.min(100, 35 + rowIndex * 11 + columnIndex * 7)}%` : '',
      disabled: absent,
      appearance: absent ? 'absent' : 'default',
    };
  }));
  return result;
}

function storyShell() {
  const shell = document.createElement('div');
  shell.className = 'component-chessboard-story';
  return shell;
}

function statusActions(onChoose) {
  return [
    { id: 'current-work', label: 'В работе сейчас', icon: createDocumentPreviewIcon('pencil-line', 16), onClick: () => onChoose(editableStates[0]) },
    { id: 'current-done', label: 'Завершено сейчас', icon: createDocumentPreviewIcon('check', 16), onClick: () => onChoose(editableStates[1]) },
    { id: 'previous-work', label: 'В работе ранее', icon: createDocumentPreviewIcon('arrow-left', 16), onClick: () => onChoose(editableStates[2]) },
    { id: 'previous-done', label: 'Завершено ранее', icon: createDocumentPreviewIcon('check', 16), onClick: () => onChoose(editableStates[3]) },
  ];
}

function stateSwatch(state) {
  const swatch = document.createElement('span');
  swatch.className = 'component-chessboard-story__swatch';
  swatch.dataset.tone = state.tone;
  swatch.dataset.pattern = state.pattern;
  swatch.setAttribute('aria-hidden', 'true');
  return swatch;
}

function destroyWhenDisconnected(element, cleanup) {
  const observer = new MutationObserver(() => {
    if (element.isConnected) return;
    observer.disconnect();
    cleanup();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export const CurrentPrototypeVisual = {
  render: () => createChessboard({
    label: 'Готовность по этажам и секциям',
    rowHeaderLabel: 'Этаж',
    rows,
    columns,
    cells: cells(),
    states,
    selectionMode: 'none',
  }).element,
};

export const NormalizedWeeklyStates = {
  render: () => {
    const stateColumns = [
      ...states.map(state => ({ id: state.id, label: state.label })),
      { id: 'absent', label: 'Пересечение отсутствует' },
    ];
    const stateCells = Object.fromEntries(stateColumns.map(column => {
      const key = createChessboardCellKey('sample', column.id);
      if (column.id === 'absent') return [key, { label: 'Пересечение отсутствует', disabled: true, appearance: 'absent' }];
      const state = states.find(item => item.id === column.id);
      return [key, { state: state.id, label: state.label, tone: state.tone, pattern: state.pattern }];
    }));
    return createChessboard({
      label: 'Нормализованные недельные состояния',
      rowHeaderLabel: 'Состояние',
      rows: [{ id: 'sample', label: 'Пример' }],
      columns: stateColumns,
      cells: stateCells,
      states,
      selectionMode: 'none',
    }).element;
  },
};

export const VariableGeometry = {
  render: () => {
    const geometryRows = [8, 7, 6, 5, 4, 3, 2, 1].map(level => ({ id: level, label: `Уровень ${level}` }));
    const geometryColumns = [
      { id: 'area-a', label: 'Область A', height: 8 },
      { id: 'area-b', label: 'Область B', height: 6 },
      { id: 'area-c', label: 'Область C', height: 4 },
      { id: 'area-d', label: 'Область D', height: 7 },
    ];
    const geometryCells = {};
    geometryRows.forEach(row => geometryColumns.forEach(column => {
      const key = createChessboardCellKey(row.id, column.id);
      const absent = row.id > column.height;
      geometryCells[key] = absent
        ? { label: 'Пересечение отсутствует', appearance: 'absent', disabled: true }
        : { label: 'Существующая ячейка без назначенного состояния' };
    }));
    return createChessboard({
      label: 'Матрица с переменной геометрией колонок',
      rowHeaderLabel: 'Уровень',
      rows: geometryRows,
      columns: geometryColumns,
      cells: geometryCells,
      states: [],
      selectionMode: 'none',
    }).element;
  },
};

export const CellContextMenu = {
  render: () => {
    const shell = storyShell();
    shell.classList.add('component-chessboard-story--context-menu');
    const hint = document.createElement('p');
    hint.className = 'component-chessboard-story__hint';
    hint.setAttribute('role', 'status');
    hint.textContent = 'Активируйте доступную ячейку, затем выберите новое состояние.';
    let board;
    let activeMenu = null;

    const closeMenu = ({ returnFocus = false } = {}) => {
      if (!activeMenu) return;
      const { cellButton, menu } = activeMenu;
      activeMenu = null;
      cellButton.removeAttribute('aria-controls');
      cellButton.setAttribute('aria-expanded', 'false');
      menu.destroy();
      if (returnFocus && cellButton.isConnected) requestAnimationFrame(() => cellButton.focus());
    };

    const positionMenu = active => {
      const shellRect = shell.getBoundingClientRect();
      const cellRect = active.cellButton.getBoundingClientRect();
      active.menu.element.style.left = `${cellRect.left - shellRect.left}px`;
      active.menu.element.style.top = `${cellRect.top - shellRect.top}px`;
      active.menu.element.style.width = `${cellRect.width}px`;
      active.menu.element.style.height = `${cellRect.height}px`;
    };

    board = createChessboard({
      label: 'Матрица с контекстным меню ячейки',
      rowHeaderLabel: 'Уровень',
      rows: rows.slice(0, 3),
      columns: columns.slice(0, 5),
      cells: cells(),
      states,
      selectionMode: 'none',
      onCellActivate: detail => {
        const cellButton = detail.event.currentTarget;
        if (!(cellButton instanceof HTMLButtonElement) || cellButton.disabled) return;
        if (activeMenu?.cellButton === cellButton) {
          closeMenu({ returnFocus: true });
          return;
        }
        closeMenu();

        const anchor = document.createElement('button');
        anchor.type = 'button';
        anchor.tabIndex = -1;
        anchor.className = 'component-chessboard-story__menu-anchor';
        anchor.setAttribute('aria-hidden', 'true');
        const menu = createMenu({
          label: `Выбор состояния: ${detail.row.label}, ${detail.column.label}`,
          trigger: anchor,
          className: 'component-chessboard-story__cell-menu',
          items: editableStates.map(state => ({
            id: state.id,
            label: state.label,
            icon: stateSwatch(state),
            onSelect: () => {
              board.setCellState(detail.key, {
                state: state.id,
                tone: state.tone,
                pattern: state.pattern,
                label: state.label,
                text: '',
              });
              hint.textContent = `${detail.row.label}, ${detail.column.label}: выбрано состояние «${state.label}».`;
              closeMenu({ returnFocus: true });
            },
          })),
        });
        activeMenu = { cellButton, menu };
        shell.append(menu.element);
        cellButton.setAttribute('aria-haspopup', 'menu');
        cellButton.setAttribute('aria-controls', menu.menu.id);
        cellButton.setAttribute('aria-expanded', 'true');
        menu.menu.addEventListener('keydown', event => {
          if (event.key === 'Escape') requestAnimationFrame(() => closeMenu({ returnFocus: true }));
          else if (event.key === 'Tab') requestAnimationFrame(() => closeMenu());
        });
        menu.setOpen(true);
        positionMenu(activeMenu);
      },
    });

    const closeOnScroll = () => closeMenu();
    const closeOnResize = () => closeMenu();
    const closeOnOutsidePointer = event => {
      if (!activeMenu) return;
      if (!activeMenu.menu.element.contains(event.target) && event.target !== activeMenu.cellButton) closeMenu();
    };
    board.scroll.addEventListener('scroll', closeOnScroll);
    window.addEventListener('resize', closeOnResize);
    document.addEventListener('pointerdown', closeOnOutsidePointer, true);
    destroyWhenDisconnected(shell, () => {
      board.scroll.removeEventListener('scroll', closeOnScroll);
      window.removeEventListener('resize', closeOnResize);
      document.removeEventListener('pointerdown', closeOnOutsidePointer, true);
      closeMenu();
    });
    shell.append(hint, board.element);
    return shell;
  },
};

export const HorizontalOverflow = {
  render: () => {
    const shell = storyShell();
    shell.classList.add('component-chessboard-story--narrow');
    const hint = document.createElement('p');
    hint.className = 'component-chessboard-story__hint';
    hint.textContent = 'Ограниченный контейнер сохраняет горизонтальную прокрутку и фиксированную первую колонку.';
    const overflowColumns = Array.from({ length: 12 }, (_, index) => ({
      id: `column-${index + 1}`,
      label: `Колонка ${index + 1}`,
    }));
    const board = createChessboard({
      label: 'Матрица с горизонтальным переполнением',
      rowHeaderLabel: 'Уровень',
      rows: rows.slice(0, 4),
      columns: overflowColumns,
      states,
      selectionMode: 'single',
    });
    board.element.style.setProperty('--ds-chessboard-min-width', '1120px');
    shell.append(hint, board.element);
    return shell;
  },
};

export const SingleCellActions = {
  render: () => {
    const shell = storyShell();
    const hint = document.createElement('p');
    hint.className = 'component-chessboard-story__hint';
    hint.textContent = 'Выберите ячейку. Повторный выбор или кнопка сброса закрывают панель.';
    let board;
    const bar = createBulkActionBar({
      active: false,
      showCount: false,
      label: 'Изменение состояния выбранной ячейки',
      actions: statusActions(state => {
        board.getSelectedKeys().forEach(key => board.setCellState(key, {
          state: state.id,
          tone: state.tone,
          pattern: state.pattern,
          label: state.label,
          text: '',
        }));
      }),
      onClear: () => board.clearSelection({ emit: true }),
    });
    board = createChessboard({
      label: 'Шахматка с выбором одной ячейки',
      rowHeaderLabel: 'Этаж',
      rows,
      columns,
      cells: cells(),
      states,
      selectionMode: 'single',
      onSelectionChange: selected => bar.setActive(selected.length > 0),
    });
    shell.append(hint, board.element, bar.element);
    return shell;
  },
};

export const MultipleSelection = {
  render: () => {
    const shell = storyShell();
    const hint = document.createElement('p');
    hint.className = 'component-chessboard-story__hint';
    hint.setAttribute('role', 'status');
    hint.textContent = 'Выберите ячейки, назначьте цветовой статус и подтвердите изменения.';
    const initial = [
      createChessboardCellKey(16, 1),
      createChessboardCellKey(15, 2),
      createChessboardCellKey(14, 3),
    ];
    const initialCells = cells();
    const selected = new Set(initial);
    const drafts = new Map();
    let board;
    let bar;

    const restoreDrafts = keys => keys.forEach(key => {
      if (!drafts.has(key)) return;
      board.setCellState(key, initialCells[key]);
      drafts.delete(key);
    });

    const actions = () => [
      ...states.map(state => ({
        id: state.id,
        label: state.label,
        icon: stateSwatch(state),
        pressed: selected.size > 0 && [...selected].every(key => drafts.get(key) === state.id),
        onClick: () => {
          selected.forEach(key => {
            drafts.set(key, state.id);
            board.setCellState(key, { state: state.id, tone: state.tone, pattern: state.pattern, label: state.label, text: '' });
          });
          hint.textContent = `Статус «${state.label}» подготовлен для ${selected.size} позиций.`;
          bar.setActions(actions());
        },
      })),
      {
        id: 'confirm',
        label: 'Подтвердить',
        icon: createDocumentPreviewIcon('check', 16),
        disabled: drafts.size === 0,
        className: 'component-chessboard-story__confirm',
        onClick: () => {
          hint.textContent = `Подтверждено позиций: ${drafts.size}.`;
          drafts.clear();
          selected.clear();
          board.clearSelection({ emit: true });
        },
      },
    ];

    bar = createBulkActionBar({
      active: true,
      count: initial.length,
      showCount: true,
      countLabel: 'Выбрано:',
      actions: actions(),
      onClear: () => {
        restoreDrafts([...selected]);
        selected.clear();
        board.clearSelection({ emit: true });
        hint.textContent = 'Выбор сброшен.';
      },
    });
    board = createChessboard({
      label: 'Шахматка с множественным выбором',
      rowHeaderLabel: 'Этаж',
      rows,
      columns,
      cells: initialCells,
      states,
      selectionMode: 'multiple',
      selectedKeys: initial,
      onSelectionChange: details => {
        const next = new Set(details.map(detail => detail.key));
        restoreDrafts([...selected].filter(key => !next.has(key)));
        selected.clear();
        next.forEach(key => selected.add(key));
        bar.setCount(selected.size);
        bar.setActions(actions());
        bar.setActive(selected.size > 0);
      },
    });
    shell.append(hint, board.element, bar.element);
    return shell;
  },
};

export const RuntimeCellUpdate = {
  render: () => {
    const shell = storyShell();
    const key = createChessboardCellKey(16, 1);
    const board = createChessboard({
      label: 'Обновление состояния ячейки',
      rowHeaderLabel: 'Этаж',
      rows: rows.slice(0, 2),
      columns: columns.slice(0, 4),
      cells: cells(),
      states,
      selectionMode: 'single',
      selectedKeys: [key],
    });
    let stateIndex = 0;
    shell.append(createButton({
      label: 'Следующее состояние',
      variant: 'outlined',
      onClick: () => {
        stateIndex = (stateIndex + 1) % states.length;
        const state = states[stateIndex];
        board.setCellState(key, { state: state.id, tone: state.tone, pattern: state.pattern, label: state.label });
      },
    }), board.element);
    return shell;
  },
};

export const WithoutNativeCellTitle = {
  render: () => {
    const shell = storyShell();
    const hint = document.createElement('p');
    hint.className = 'component-chessboard-story__hint';
    hint.textContent = 'Нативный title отключён для композиции с отдельным Tooltip; доступные имена ячеек сохранены.';
    const board = createChessboard({
      label: 'Шахматка с внешней подсказкой',
      rowHeaderLabel: 'Этаж',
      rows: rows.slice(0, 2),
      columns: columns.slice(0, 4),
      cells: cells(),
      states,
      selectionMode: 'none',
      showCellTitle: false,
    });
    shell.append(hint, board.element);
    return shell;
  },
};

export const Empty = {
  render: () => createChessboard({ label: 'Пустая шахматка' }).element,
};
