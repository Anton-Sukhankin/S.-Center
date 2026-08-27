import { createAlert } from './alert.js';
import infoIconUrl from '../../assets/icons/circle-info.svg';

export default { title: 'Feedback/Alert', tags: ['autodocs'] };

function renderAlert({ title, message, variant }) {
  const canvas = document.createElement('div');
  canvas.className = 'component-story-canvas';
  const alert = createAlert({ title, message, variant });
  canvas.append(alert.element);
  return canvas;
}

export const Information = {
  render: () => renderAlert({
    title: 'Информация',
    message: 'Открыт выбор документов для добавления в пакет.',
    variant: 'info',
  }),
};

export const RichInformation = {
  render: () => {
    const icon = document.createElement('img');
    icon.src = infoIconUrl;
    icon.alt = '';
    const message = document.createElement('span');
    message.append('Параметры применяются ко всем разделам. ');
    const important = document.createElement('strong');
    important.textContent = 'Важно: изменения являются глобальными.';
    message.append(important);
    return createAlert({
      icon,
      message,
      variant: 'info',
      dismissible: false,
    }).element;
  },
};

export const Success = {
  render: () => renderAlert({
    title: 'Действие выполнено',
    message: 'Выбранные документы добавлены в пакет.',
    variant: 'success',
  }),
};

export const Error = {
  render: () => renderAlert({
    title: 'Не удалось выполнить действие',
    message: 'Повторите попытку или проверьте обязательные поля.',
    variant: 'error',
  }),
};
