import { createBulkActionBar } from './bulk-action-bar.js';
import { createButton } from './button.js';
import { createDocumentPreviewIcon } from './document-preview-icon.js';

export default {
  title: 'Overlays/Bulk Action Bar',
  tags: ['autodocs'],
  args: {
    active: true,
    count: 12,
    showCount: true,
  },
  argTypes: {
    active: { control: 'boolean' },
    count: { control: { type: 'number', min: 0, step: 1 } },
    showCount: { control: 'boolean' },
  },
};

function actionDefinitions(onAction = () => {}) {
  return [
    {
      id: 'change-status',
      label: 'Изменить статус',
      icon: createDocumentPreviewIcon('pencil-line', 16),
      onClick: () => onAction('Изменение статуса'),
    },
    {
      id: 'move-to-group',
      label: 'Переместить в группу',
      icon: createDocumentPreviewIcon('files', 16),
      onClick: () => onAction('Перемещение в группу'),
    },
    {
      id: 'take-to-work',
      label: 'Взять в работу',
      icon: createDocumentPreviewIcon('check', 16),
      onClick: () => onAction('Взятие в работу'),
    },
  ];
}

function interactiveStory({ count = 12, showCount = true } = {}) {
  const story = document.createElement('div');
  story.className = 'component-bulk-action-story';

  const status = document.createElement('p');
  status.className = 'component-bulk-action-story__status';
  status.setAttribute('role', 'status');
  status.textContent = 'Панель открыта';

  let bar;
  const showButton = createButton({
    label: 'Показать панель действий',
    variant: 'outlined',
    onClick: () => {
      status.textContent = 'Панель открыта';
      bar.setActive(true);
    },
  });
  bar = createBulkActionBar({
    active: true,
    count,
    showCount,
    actions: actionDefinitions(action => { status.textContent = `${action}: действие передано потребителю`; }),
    onClear: () => { status.textContent = 'Выбор сброшен, панель закрыта'; },
  });
  story.append(status, showButton, bar.element);
  return story;
}

export const Playground = {
  render: args => createBulkActionBar({
    ...args,
    actions: actionDefinitions(),
  }).element,
};

export const ReferenceStyle = {
  render: () => interactiveStory({ count: 1, showCount: true }),
};

export const WithoutCounter = {
  render: () => interactiveStory({ showCount: false }),
};

export const Hidden = {
  render: () => {
    const story = document.createElement('div');
    const bar = createBulkActionBar({ active: false, actions: actionDefinitions() });
    story.append(createButton({
      label: 'Открыть скрытую панель',
      variant: 'outlined',
      onClick: () => bar.setActive(true),
    }), bar.element);
    return story;
  },
};
