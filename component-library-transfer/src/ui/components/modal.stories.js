import { createButton } from './button.js';
import { createDocumentPreviewIcon } from './document-preview-icon.js';
import { createModal } from './modal.js';

export default { title: 'Overlays/Modal', tags: ['autodocs'] };

export const Confirmation = {
  render: () => {
    const wrapper = document.createElement('div');
    const content = document.createElement('p');
    content.textContent = 'Подтвердите выполнение действия.';
    const modal = createModal({
      title: 'Подтверждение',
      content,
      actions: [
        { label: 'Отмена', variant: 'text', onClick: () => modal.close() },
        { label: 'Подтвердить', variant: 'primary', onClick: () => modal.close() },
      ],
    });
    const trigger = createButton({ label: 'Открыть окно', variant: 'primary', onClick: event => modal.open(event.currentTarget) });
    wrapper.append(trigger, modal.element);
    return wrapper;
  },
};

export const IconClose = {
  render: () => {
    const wrapper = document.createElement('div');
    const content = document.createElement('p');
    content.textContent = 'Модальное окно с компактной кнопкой закрытия в хедере.';
    const modal = createModal({
      title: 'Выбор элемента',
      content,
      closeIcon: createDocumentPreviewIcon('x', 18),
      actions: [
        { label: 'Отмена', variant: 'outlined', onClick: () => modal.close() },
        { label: 'Выбрать', variant: 'primary', onClick: () => modal.close() },
      ],
    });
    const trigger = createButton({ label: 'Открыть окно', variant: 'primary', onClick: event => modal.open(event.currentTarget) });
    wrapper.append(trigger, modal.element);
    return wrapper;
  },
};
