import { createAccordion, createAccordionBadge } from './accordion.js';
import { createButton } from './button.js';
import { createCheckbox } from './checkbox.js';
import { createIcon } from './icon.js';
import { createInput } from './input.js';
import { createSelect } from './select.js';
import { createSwitch } from './switch.js';

export default {
  title: 'Disclosure/Accordion',
  tags: ['autodocs'],
  args: {
    title: 'Дополнительные параметры',
    description: 'Настройте состав и правила отображения раздела.',
    open: false,
    disabled: false,
  },
};

function paragraph(text) {
  const element = document.createElement('p');
  element.className = 'component-accordion-story__copy';
  element.textContent = text;
  return element;
}

function storyElement(accordion) {
  accordion.element.classList.add('component-accordion-story');
  return accordion.element;
}

function renderBase(args, overrides = {}) {
  return storyElement(createAccordion({
    ...args,
    icon: createIcon({ name: 'file-text' }),
    indicators: createAccordionBadge({ label: '3' }),
    content: paragraph('Контентная область принимает текст или любой компонент из общей компонентной базы.'),
    ...overrides,
  }));
}

export const Playground = {
  render: args => renderBase(args),
};

export const Expanded = {
  args: { open: true },
  render: args => renderBase(args),
};

export const WithoutDescription = {
  args: {
    title: 'История изменений',
    description: '',
    open: true,
  },
  render: args => renderBase(args, {
    icon: createIcon({ name: 'history' }),
    indicators: createAccordionBadge({ label: '12' }),
  }),
};

export const AccentIndicator = {
  args: {
    title: 'Активные параметры',
    description: 'Синий индикатор выделяет активное или требующее внимания значение.',
    open: true,
  },
  render: args => renderBase(args, {
    icon: createIcon({ name: 'settings-2' }),
    indicators: [
      createAccordionBadge({ label: 'Активно', variant: 'accent' }),
      createAccordionBadge({ label: '5' }),
    ],
  }),
};

export const HeaderActions = {
  args: {
    title: 'Атрибуты шаблона',
    description: 'Действия доступны только в раскрытом состоянии.',
    open: true,
  },
  render: args => renderBase(args, {
    icon: createIcon({ name: 'list-tree' }),
    indicators: createAccordionBadge({ label: '18', variant: 'accent' }),
    actions: [
      createButton({
        label: 'Добавить',
        size: 'small',
        variant: 'outlined',
        icon: createIcon({ name: 'plus' }),
      }),
      createButton({
        iconOnly: true,
        ariaLabel: 'Настроить раздел',
        size: 'small',
        variant: 'text',
        icon: createIcon({ name: 'settings' }),
      }),
    ],
  }),
};

export const FormContent = {
  args: {
    title: 'Параметры документа',
    description: 'В содержимом могут находиться поля и другие компоненты базы.',
    open: true,
  },
  render: args => {
    const form = document.createElement('div');
    form.className = 'component-accordion-story__form';
    form.append(
      createInput({
        label: 'Название',
        placeholder: 'Введите название',
        description: 'Отображается в карточке документа.',
      }).element,
      createSelect({
        label: 'Тип документа',
        placeholder: 'Выберите тип',
        options: ['Договор', 'Заявка', 'Приказ'],
      }).element,
    );

    const choices = document.createElement('div');
    choices.className = 'component-accordion-story__choices';
    choices.append(
      createCheckbox({ label: 'Обязательный параметр', checked: true }).element,
      createSwitch({ label: 'Показывать в карточке', checked: true }).element,
    );
    form.append(choices);

    return renderBase(args, {
      icon: createIcon({ name: 'file-cog' }),
      indicators: createAccordionBadge({ label: '2' }),
      content: form,
    });
  },
};

export const Disabled = {
  args: {
    title: 'Недоступный раздел',
    description: 'Заголовок и причина недоступности остаются видимыми.',
    disabled: true,
  },
  render: args => renderBase(args, {
    icon: createIcon({ name: 'lock' }),
    indicators: createAccordionBadge({ label: '0' }),
  }),
};
