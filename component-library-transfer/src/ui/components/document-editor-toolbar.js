import { createButton } from './button.js';
import { createDocumentPreviewIcon } from './document-preview-icon.js';
import { setAttributes } from './dom.js';

export const DOCUMENT_EDITOR_TOOLBAR_FORMATS = Object.freeze(['DOCX', 'XLSX', 'PDF']);

const COMMON_GROUPS = Object.freeze([[
  { action: 'undo', label: 'Отменить действие', icon: 'undo-2' },
  { action: 'redo', label: 'Повторить действие', icon: 'redo-2' },
]]);

const FORMAT_GROUPS = Object.freeze({
  DOCX: [
    [
      { action: 'style', label: 'Обычный текст', type: 'select' },
      { action: 'font', label: 'Inter', type: 'select' },
      { action: 'font-size', label: '14', type: 'select', compact: true },
    ],
    [
      { action: 'bold', label: 'Полужирный', icon: 'bold', toggle: true },
      { action: 'italic', label: 'Курсив', icon: 'italic', toggle: true },
      { action: 'underline', label: 'Подчёркнутый', icon: 'underline', toggle: true },
      { action: 'highlight', label: 'Цвет выделения', icon: 'highlighter', toggle: true, className: 'ds-document-toolbar__highlight-color' },
      { action: 'text-color', label: 'Цвет текста', icon: 'type', toggle: true, className: 'ds-document-toolbar__text-color' },
    ],
    [
      { action: 'align', label: 'Выравнивание абзаца', icon: 'align-left', toggle: true },
      { action: 'list', label: 'Маркированный или нумерованный список', icon: 'list', toggle: true },
      { action: 'line-spacing', label: 'Межстрочный интервал', icon: 'move-vertical' },
    ],
    [
      { action: 'link', label: 'Добавить ссылку', icon: 'link-2', toggle: true },
      { action: 'image', label: 'Добавить изображение', icon: 'image-plus' },
      { action: 'table', label: 'Вставить таблицу', icon: 'table-2' },
    ],
  ],
  XLSX: [
    [
      { action: 'cell-format', label: 'Общий', type: 'select' },
      { action: 'font', label: 'Inter', type: 'select' },
      { action: 'font-size', label: '11', type: 'select', compact: true },
    ],
    [
      { action: 'bold', label: 'Полужирный', icon: 'bold', toggle: true },
      { action: 'text-color', label: 'Цвет текста', icon: 'type', toggle: true, className: 'ds-document-toolbar__text-color' },
      { action: 'fill-color', label: 'Цвет заливки ячейки', icon: 'paint-bucket', toggle: true, className: 'ds-document-toolbar__fill-color' },
      { action: 'borders', label: 'Границы ячейки', icon: 'grid-2x2', toggle: true },
    ],
    [
      { action: 'align', label: 'Выравнивание в ячейке', icon: 'align-center', toggle: true },
      { action: 'wrap', label: 'Перенести текст', icon: 'wrap-text', toggle: true },
      { action: 'merge', label: 'Объединить ячейки', icon: 'table-cells-merge', toggle: true },
    ],
    [
      { action: 'insert-row', label: 'Добавить строку', icon: 'rows-3' },
      { action: 'insert-column', label: 'Добавить столбец', icon: 'columns-3' },
      { action: 'sort', label: 'Сортировка', icon: 'arrow-down-a-z' },
      { action: 'filter', label: 'Фильтр', icon: 'filter', toggle: true },
      { action: 'autosum', label: 'Автосумма', icon: 'sigma' },
    ],
  ],
  PDF: [
    [
      { action: 'select', label: 'Выбрать текст или объект', icon: 'mouse-pointer-2', toggle: true },
      { action: 'hand', label: 'Перемещать страницу', icon: 'hand', toggle: true },
    ],
    [
      { action: 'highlight', label: 'Выделить текст', icon: 'highlighter', toggle: true, className: 'ds-document-toolbar__highlight-color' },
      { action: 'underline', label: 'Подчеркнуть текст', icon: 'underline', toggle: true },
      { action: 'strike', label: 'Зачеркнуть текст', icon: 'strikethrough', toggle: true },
      { action: 'draw', label: 'Рисование', icon: 'pencil-line', toggle: true },
      { action: 'comment', label: 'Добавить комментарий', icon: 'message-square-plus', toggle: true },
    ],
    [
      { action: 'add-text', label: 'Добавить текстовый блок', icon: 'text-cursor-input' },
      { action: 'image', label: 'Добавить изображение', icon: 'image-plus' },
      { action: 'signature', label: 'Добавить подпись', icon: 'signature' },
      { action: 'pages', label: 'Действия со страницами', icon: 'files' },
    ],
  ],
});

function normalizeFormat(format) {
  const normalized = String(format || 'DOCX').toUpperCase();
  return DOCUMENT_EDITOR_TOOLBAR_FORMATS.includes(normalized) ? normalized : 'DOCX';
}

export function createDocumentFullscreenIcon(fullscreen = false) {
  return createToolbarIcon(fullscreen ? 'minimize-2' : 'maximize-2');
}

function createToolbarIcon(name) {
  return createDocumentPreviewIcon(name);
}

function createSeparator() {
  const element = document.createElement('span');
  element.className = 'ds-document-toolbar__separator';
  element.setAttribute('aria-hidden', 'true');
  return element;
}

export function createDocumentEditorToolbar({
  format = 'DOCX', activeActions = [], disabledActions = [], fullscreen = false,
  className = '', attributes = {}, onAction,
} = {}) {
  let currentFormat = normalizeFormat(format);
  let currentActiveActions = new Set(activeActions || []);
  let currentDisabledActions = new Set(disabledActions || []);
  let currentFullscreen = Boolean(fullscreen);
  let fullscreenButton = null;
  const actionButtons = new Map();
  const actionDefinitions = new Map();

  const element = document.createElement('div');
  element.className = ['ds-document-toolbar', className].filter(Boolean).join(' ');
  element.setAttribute('role', 'toolbar');
  setAttributes(element, attributes);

  const scroller = document.createElement('div');
  scroller.className = 'ds-document-toolbar__scroller';
  element.append(scroller);

  const dispatchAction = (definition, event) => onAction?.(definition.action, {
    event, format: currentFormat, definition: { ...definition },
  });

  const createActionButton = definition => {
    const button = createButton({
      label: definition.label,
      icon: createToolbarIcon(definition.icon),
      iconOnly: true,
      ariaLabel: definition.label,
      variant: 'outlined',
      size: 'small',
      className: ['ds-document-toolbar__button', definition.className].filter(Boolean).join(' '),
      attributes: { title: definition.label },
      onClick: event => dispatchAction(definition, event),
    });
    button.dataset.action = definition.action;
    actionButtons.set(definition.action, button);
    actionDefinitions.set(definition.action, definition);
    return button;
  };

  const createSelectButton = definition => {
    const button = createButton({
      label: definition.label,
      icon: createToolbarIcon('chevron-down'),
      iconPosition: 'end',
      ariaLabel: definition.label,
      variant: 'outlined',
      size: 'small',
      className: ['ds-document-toolbar__select', definition.compact ? 'ds-document-toolbar__select--compact' : ''].filter(Boolean).join(' '),
      attributes: { title: definition.label, 'aria-haspopup': 'listbox' },
      onClick: event => dispatchAction(definition, event),
    });
    button.dataset.action = definition.action;
    actionButtons.set(definition.action, button);
    actionDefinitions.set(definition.action, definition);
    return button;
  };

  const appendGroups = groups => {
    groups.forEach(group => {
      if (scroller.childElementCount > 0) scroller.append(createSeparator());
      group.forEach(definition => scroller.append(
        definition.type === 'select' ? createSelectButton(definition) : createActionButton(definition),
      ));
    });
  };

  const renderControls = () => {
    actionButtons.clear();
    actionDefinitions.clear();
    scroller.replaceChildren();
    fullscreenButton = createActionButton({
      action: 'fullscreen', label: 'Развернуть карточку документа на весь экран', icon: 'maximize-2',
      className: 'ds-document-toolbar__fullscreen document-detail-fullscreen',
      toggle: true,
    });
    scroller.append(fullscreenButton);
    appendGroups(COMMON_GROUPS);
    appendGroups(FORMAT_GROUPS[currentFormat]);
    element.dataset.format = currentFormat;
    element.setAttribute('aria-label', `Инструменты редактирования ${currentFormat}`);
  };

  const sync = () => {
    actionButtons.forEach((button, action) => {
      const definition = actionDefinitions.get(action);
      button.disabled = currentDisabledActions.has(action);
      const pressed = action === 'fullscreen' ? currentFullscreen : Boolean(definition?.toggle && currentActiveActions.has(action));
      if (action === 'fullscreen' || definition?.toggle) button.setAttribute('aria-pressed', String(pressed));
      else button.removeAttribute('aria-pressed');
      button.classList.toggle('is-active', pressed);
    });
    const fullscreenLabel = currentFullscreen
      ? 'Вернуть прежний размер карточки документа'
      : 'Развернуть карточку документа на весь экран';
    fullscreenButton.setAttribute('aria-label', fullscreenLabel);
    fullscreenButton.title = fullscreenLabel;
    fullscreenButton.replaceChildren(createDocumentFullscreenIcon(currentFullscreen));
  };

  renderControls();
  sync();

  return {
    element, scroller, actionButtons,
    setFormat(nextFormat) {
      const normalizedFormat = normalizeFormat(nextFormat);
      if (normalizedFormat !== currentFormat) {
        currentFormat = normalizedFormat;
        renderControls();
      }
      sync();
    },
    setActiveActions(nextActions) { currentActiveActions = new Set(nextActions || []); sync(); },
    setDisabledActions(nextActions) { currentDisabledActions = new Set(nextActions || []); sync(); },
    setFullscreen(value) { currentFullscreen = Boolean(value); sync(); },
  };
}
