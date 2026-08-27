import { createResizeHandle } from './resize-handle.js';

export default {
  title: 'Utilities/Resize Handle',
  tags: ['autodocs'],
};

export const Vertical = {
  render: () => {
    const layout = document.createElement('div');
    layout.className = 'component-resize-story component-resize-story--vertical';
    const first = document.createElement('div');
    first.className = 'component-resize-story__pane';
    first.textContent = 'Панель';
    const second = document.createElement('div');
    second.className = 'component-resize-story__pane';
    second.textContent = 'Рабочая область';
    const handle = createResizeHandle({
      label: 'Изменить ширину панели',
      value: 180,
      defaultValue: 180,
      min: 120,
      max: 280,
      onChange: nextValue => {
        first.style.width = `${nextValue}px`;
      },
    });
    first.style.width = '180px';
    layout.append(first, handle.element, second);
    return layout;
  },
};

export const Horizontal = {
  render: () => {
    const layout = document.createElement('div');
    layout.className = 'component-resize-story component-resize-story--horizontal';
    const first = document.createElement('div');
    first.className = 'component-resize-story__pane';
    first.textContent = 'Верхняя область';
    const second = document.createElement('div');
    second.className = 'component-resize-story__pane';
    second.textContent = 'Нижняя область';
    const handle = createResizeHandle({
      label: 'Изменить высоту области',
      orientation: 'horizontal',
      value: 72,
      defaultValue: 72,
      min: 48,
      max: 120,
      onChange: nextValue => {
        first.style.height = `${nextValue}px`;
      },
    });
    first.style.height = '72px';
    layout.append(first, handle.element, second);
    return layout;
  },
};
