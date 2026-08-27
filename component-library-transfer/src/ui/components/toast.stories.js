import { createButton } from './button.js';
import { createToast } from './toast.js';

export default { title: 'Feedback/Toast', tags: ['autodocs'] };

function renderToast({ label, title, message, variant }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'component-story-canvas';
  const toast = createToast({ duration: 0, variant });
  const trigger = createButton({
    label,
    variant: 'primary',
    onClick: () => toast.show({ title, message, variant }),
  });
  wrapper.append(trigger, toast.element);
  return wrapper;
}

export const Information = {
  render: () => {
    return renderToast({
      label: 'Показать информацию',
      title: 'Информация',
      message: 'Открыт выбор документов для добавления в пакет.',
      variant: 'info',
    });
  },
};

export const Success = {
  render: () => renderToast({
    label: 'Показать подтверждение',
    title: 'Действие выполнено',
    message: 'Изменения применены.',
    variant: 'success',
  }),
};

export const Error = {
  render: () => renderToast({
    label: 'Показать ошибку',
    title: 'Ошибка',
    message: 'Не удалось выполнить действие.',
    variant: 'error',
  }),
};
