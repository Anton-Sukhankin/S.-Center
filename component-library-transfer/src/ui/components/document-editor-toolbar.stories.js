import { createButton } from './button.js';
import { createDocumentEditorToolbar } from './document-editor-toolbar.js';

export default {
  title: 'Controls/Document Editor Toolbar',
  tags: ['autodocs'],
};

function interactiveToolbar(format = 'DOCX') {
  const canvas = document.createElement('div');
  canvas.className = 'ds-document-toolbar-story';
  const status = document.createElement('p');
  status.className = 'ds-file-list-story-status';
  status.textContent = `Формат: ${format}. Выберите инструмент.`;
  const activeActions = new Set(format === 'PDF' ? ['select'] : ['bold']);
  let fullscreen = false;
  const toolbar = createDocumentEditorToolbar({
    format,
    activeActions,
    onAction: (action, context) => {
      if (action === 'fullscreen') fullscreen = !fullscreen;
      else if (context.definition.toggle) {
        if (activeActions.has(action)) activeActions.delete(action);
        else activeActions.add(action);
      }
      toolbar.setActiveActions(activeActions);
      toolbar.setFullscreen(fullscreen);
      status.textContent = `Последнее действие: ${action}`;
    },
  });
  canvas.append(toolbar.element, status);
  return canvas;
}

export const Docx = { render: () => interactiveToolbar('DOCX') };
export const PdfAnnotations = { render: () => interactiveToolbar('PDF') };
export const Spreadsheet = { render: () => interactiveToolbar('XLSX') };

export const SwitchingFormats = {
  render: () => {
    const canvas = document.createElement('div');
    canvas.className = 'ds-document-toolbar-story';
    const switcher = document.createElement('div');
    switcher.className = 'ds-document-toolbar-story__switcher';
    const status = document.createElement('p');
    status.className = 'ds-file-list-story-status';
    const activeByFormat = new Map([
      ['DOCX', new Set(['bold'])],
      ['XLSX', new Set(['bold'])],
      ['PDF', new Set(['select'])],
    ]);
    let currentFormat = 'DOCX';
    const toolbar = createDocumentEditorToolbar({
      format: currentFormat,
      activeActions: activeByFormat.get(currentFormat),
      onAction: (action, context) => {
        if (context.definition.toggle && action !== 'fullscreen') {
          const active = activeByFormat.get(currentFormat);
          if (active.has(action)) active.delete(action);
          else active.add(action);
          toolbar.setActiveActions(active);
        }
        status.textContent = `${currentFormat}: ${context.definition.label}`;
      },
    });
    ['DOCX', 'XLSX', 'PDF'].forEach(format => switcher.append(createButton({
      label: format,
      variant: 'outlined',
      size: 'small',
      onClick: () => {
        currentFormat = format;
        toolbar.setFormat(format);
        toolbar.setActiveActions(activeByFormat.get(format));
        status.textContent = `Панель переключена на ${format}`;
      },
    })));
    status.textContent = 'Панель переключена на DOCX';
    canvas.append(switcher, toolbar.element, status);
    return canvas;
  },
};
