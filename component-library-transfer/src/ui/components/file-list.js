import { createEmptyState } from './empty-state.js';
import { createFileItem } from './file-item.js';
import { setAttributes } from './dom.js';

let fileListSequence = 0;

function getFileId(file, index) {
  return String(file?.id ?? file?.name ?? index);
}

export function createFileList({
  id = `ds-file-list-${++fileListSequence}`,
  title = 'Файлы',
  showHeader = true,
  showCount = true,
  variant = 'default',
  files = [],
  activeFileId = null,
  downloadable = true,
  selectionIndicator = true,
  selectOnOpen = true,
  emptyTitle = 'Файлы не добавлены',
  emptyDescription = 'Прикреплённые файлы появятся в этом списке.',
  emptyActions = [],
  className = '',
  attributes = {},
  getFileProps,
  onFileOpen,
  onFileDownload,
} = {}) {
  let currentFiles = Array.from(files || []);
  let currentActiveFileId = activeFileId === null || activeFileId === undefined ? null : String(activeFileId);
  let itemComponents = [];

  const element = document.createElement('section');
  element.id = id;
  element.className = ['ds-file-list', `ds-file-list--${variant}`, className].filter(Boolean).join(' ');
  setAttributes(element, attributes);

  const header = document.createElement('div');
  header.className = 'ds-file-list__header';
  const titleElement = document.createElement('h3');
  titleElement.id = `${id}-title`;
  titleElement.className = 'ds-file-list__title';
  titleElement.textContent = title;
  const countElement = document.createElement('span');
  countElement.className = 'ds-file-list__count';
  countElement.setAttribute('aria-label', 'Количество файлов');
  countElement.hidden = !showCount;
  header.append(titleElement, countElement);
  header.hidden = !showHeader;
  if (showHeader) element.setAttribute('aria-labelledby', titleElement.id);
  else element.setAttribute('aria-label', title);

  const list = document.createElement('div');
  list.className = 'ds-file-list__items';
  list.setAttribute('role', 'list');
  element.append(header, list);

  const syncSelection = () => {
    itemComponents.forEach(({ id: itemId, component }) => {
      component.setSelected(currentActiveFileId !== null && itemId === currentActiveFileId);
    });
  };

  const render = () => {
    list.replaceChildren();
    itemComponents = [];
    countElement.textContent = String(currentFiles.length);

    if (currentFiles.length === 0) {
      const empty = createEmptyState({
        id: `${id}-empty`,
        title: emptyTitle,
        description: emptyDescription,
        actions: emptyActions,
        size: 'small',
        surface: 'plain',
        className: 'ds-file-list__empty',
      });
      list.append(empty.element);
      return;
    }

    currentFiles.forEach((file, index) => {
      const itemId = getFileId(file, index);
      const props = getFileProps?.(file, index) || {};
      const component = createFileItem({
        file,
        selected: currentActiveFileId !== null && itemId === currentActiveFileId,
        downloadable,
        selectionIndicator,
        ...props,
        onOpen: (selectedFile, event) => {
          if (selectOnOpen) {
            currentActiveFileId = itemId;
            syncSelection();
          }
          props.onOpen?.(selectedFile, event);
          onFileOpen?.(selectedFile, event);
        },
        onDownload: (selectedFile, event) => {
          props.onDownload?.(selectedFile, event);
          onFileDownload?.(selectedFile, event);
        },
      });
      itemComponents.push({ id: itemId, component });
      list.append(component.element);
    });
  };

  render();

  return {
    element,
    header,
    titleElement,
    countElement,
    list,
    setFiles(nextFiles) {
      currentFiles = Array.from(nextFiles || []);
      if (!currentFiles.some((file, index) => getFileId(file, index) === currentActiveFileId)) {
        currentActiveFileId = null;
      }
      render();
    },
    setActiveFileId(nextId) {
      currentActiveFileId = nextId === null || nextId === undefined ? null : String(nextId);
      syncSelection();
    },
    getActiveFileId() {
      return currentActiveFileId;
    },
  };
}
