import { createButton } from './button.js';
import { createCard } from './card.js';
import { createTag } from './tag.js';

export default {
  title: 'Data Display/Card',
  tags: ['autodocs'],
};

const STORY_ICONS = Object.freeze({
  'clipboard-list': ['M9 5h6', 'M9 9h6', 'M9 13h4', 'M7 3h10a2 2 0 0 1 2 2v16H5V5a2 2 0 0 1 2-2Z'],
  'building-2': ['M4 21h16', 'M6 21V5l6-3 6 3v16', 'M9 8h.01', 'M15 8h.01', 'M9 12h.01', 'M15 12h.01'],
  'wallet-cards': ['M4 7h16v12H4z', 'M4 10h16', 'M15 14h3'],
  'calendar-days': ['M3 5h18v16H3z', 'M8 3v4', 'M16 3v4', 'M3 10h18', 'M8 14h.01', 'M12 14h.01', 'M16 14h.01'],
  'file-check': ['M6 2h8l4 4v16H6z', 'M14 2v6h6', 'm9 15 2 2 4-4'],
  'file-signature': ['M6 2h8l4 4v16H6z', 'M14 2v6h6', 'm8 17 2-2 2 2 3-3'],
  history: ['M3 12a9 9 0 1 0 3-6.7', 'M3 4v5h5', 'M12 7v5l3 2'],
  'list-checks': ['m4 6 2 2 3-3', 'M11 7h9', 'm4 12 2 2 3-3', 'M11 13h9', 'm4 18 2 2 3-3', 'M11 19h9'],
  'mouse-pointer-click': ['m5 3 7 17 2-7 7-2Z', 'M16 3v3', 'M20 7h-3'],
  check: ['m5 12 4 4 10-10'],
});

function createStoryIcon(name, size = 20) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  (STORY_ICONS[name] ?? STORY_ICONS['clipboard-list']).forEach(definition => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', definition);
    svg.append(path);
  });
  return svg;
}

function stageCard({ title, description, state = 'default', disabled = false, icon = 'clipboard-list' }) {
  return createCard({
    title,
    description,
    leading: createStoryIcon(icon),
    indicator: state === 'success' ? createStoryIcon('check', 10) : null,
    state,
    layout: 'vertical',
    interactive: true,
    disabled,
    ariaLabel: `${title}. ${description}`,
  }).element;
}

function storyGrid() {
  const grid = document.createElement('div');
  grid.className = 'component-card-story-grid';
  return grid;
}

export const Default = {
  render: () => createCard({
    title: 'Проверка комплекта документов',
    description: 'Карточка с заголовком и поясняющим текстом.',
    leading: createStoryIcon('file-check'),
  }).element,
};

export const StageStates = {
  render: () => {
    const grid = storyGrid();
    grid.append(
      stageCard({ title: 'Потребность', description: 'Этап 1 · Доступен' }),
      stageCard({ title: 'Контрагент', description: 'Этап 2 · Текущий этап', state: 'accent', icon: 'building-2' }),
      stageCard({ title: 'Условия оплаты', description: 'Этап 3 · Этап подтверждён', state: 'success', icon: 'wallet-cards' }),
      stageCard({ title: 'Сроки и формат', description: 'Этап 4 · Будет доступен позже', disabled: true, icon: 'calendar-days' }),
    );
    return grid;
  },
};

export const TagsAndDescription = {
  render: () => createCard({
    title: 'Согласование договора',
    description: 'Карточка принимает несколько тегов и сохраняет перенос длинного описания.',
    leading: createStoryIcon('file-signature'),
    tags: [
      createTag({ label: 'В работе', color: 'blue', tone: 'light' }).element,
      createTag({ label: 'Высокий приоритет', color: 'red', tone: 'light' }).element,
      createTag({ label: '3 файла', color: 'gray', tone: 'light' }).element,
    ],
  }).element,
};

export const WithoutDescription = {
  render: () => createCard({
    title: 'История изменений',
    leading: createStoryIcon('history'),
    tags: createTag({ label: '12 записей', color: 'gray', tone: 'light' }).element,
  }).element,
};

export const ActionsAndContent = {
  render: () => {
    const content = document.createElement('p');
    content.className = 'component-card-story-copy';
    content.textContent = 'Контентная область может содержать текст, форму, таблицу или другие компоненты базы.';
    const footer = document.createElement('span');
    footer.textContent = 'Изменено сегодня в 12:40';
    return createCard({
      title: 'Атрибуты документа',
      description: 'Проверено 8 из 12 обязательных значений.',
      leading: createStoryIcon('list-checks'),
      state: 'warning',
      tags: createTag({ label: 'Требует внимания', color: 'red', tone: 'light' }).element,
      actions: [
        createButton({ label: 'Подробнее', variant: 'text', size: 'small' }),
        createButton({ label: 'Редактировать', variant: 'outlined', size: 'small' }),
      ],
      content,
      footer,
    }).element;
  },
};

export const SemanticStates = {
  render: () => {
    const grid = storyGrid();
    grid.append(
      createCard({ title: 'Активная карточка', description: 'Выбранное или текущее состояние.', state: 'accent' }).element,
      createCard({ title: 'Завершено', description: 'Действие выполнено успешно.', state: 'success' }).element,
      createCard({ title: 'Предупреждение', description: 'Требуется внимание пользователя.', state: 'warning' }).element,
      createCard({ title: 'Ошибка', description: 'Действие завершилось с ошибкой.', state: 'danger' }).element,
    );
    return grid;
  },
};

export const Interactive = {
  render: () => {
    let selected = false;
    const card = createCard({
      title: 'Выберите карточку',
      description: 'Нажатие переключает локальное демонстрационное состояние.',
      leading: createStoryIcon('mouse-pointer-click'),
      interactive: true,
      attributes: { 'aria-pressed': 'false' },
      onClick: () => {
        selected = !selected;
        card.setState(selected ? 'accent' : 'default');
        card.element.setAttribute('aria-pressed', String(selected));
      },
    });
    return card.element;
  },
};

export const ContentOnly = {
  render: () => {
    const content = document.createElement('p');
    content.className = 'component-card-story-copy';
    content.textContent = 'Контентная карточка без видимого header получает доступное имя через ariaLabel.';
    return createCard({
      ariaLabel: 'Содержимое карточки',
      content,
    }).element;
  },
};
