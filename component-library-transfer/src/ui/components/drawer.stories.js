import { createButton } from './button.js';
import { createDrawer } from './drawer.js';

export default { title: 'Overlays/Drawer', tags: ['autodocs'] };

function createCopy(text) {
  const paragraph = document.createElement('p');
  paragraph.className = 'component-drawer-story__copy';
  paragraph.textContent = text;
  return paragraph;
}

function createFooterActions(primaryLabel = 'Применить') {
  const actions = document.createElement('div');
  actions.className = 'component-drawer-story__footer-actions';
  actions.append(
    createButton({ label: 'Отмена', variant: 'outlined' }),
    createButton({ label: primaryLabel, variant: 'primary' }),
  );
  return actions;
}

function mountDrawerStory(drawer, label = 'Открыть панель') {
  const wrapper = document.createElement('div');
  const trigger = createButton({
    label,
    variant: 'primary',
    onClick: event => drawer.open(event.currentTarget),
  });
  wrapper.append(trigger);
  drawer.mount(wrapper);
  return wrapper;
}

export const Default = {
  render: () => {
    const drawer = createDrawer({
      title: 'Настройки отображения',
      description: 'Выберите параметры и примените изменения.',
      content: createCopy('Контентная область принимает текст, поля, списки и составные интерфейсные компоненты.'),
      footer: createFooterActions(),
    });
    return mountDrawerStory(drawer);
  },
};

export const NestedStage = {
  render: () => {
    let drawer;

    const showDetails = () => {
      const content = document.createElement('div');
      content.className = 'component-drawer-story__stack';
      content.append(
        createCopy('Это второй этап внутри того же drawer. Кнопка возврата ведет к исходному составу панели.'),
        createCopy('Продуктовый модуль может заменить эту область формой, фильтрами или списком доступных параметров.'),
      );
      drawer.setHeader({
        title: 'Дополнительные условия',
        description: 'Настройте параметры выбранного раздела.',
        backVisible: true,
      });
      drawer.setContent(content);
      drawer.setFooter(createFooterActions('Сохранить'));
    };

    const showRoot = () => {
      const content = document.createElement('div');
      content.className = 'component-drawer-story__stack';
      const next = createButton({
        label: 'Перейти к дополнительным условиям',
        variant: 'outlined',
        onClick: showDetails,
      });
      content.append(
        createCopy('Исходный этап содержит точку входа в следующий состав drawer.'),
        next,
      );
      drawer.setHeader({
        title: 'Настройки фильтра',
        description: 'Определите основные параметры.',
        backVisible: false,
      });
      drawer.setContent(content);
      drawer.setFooter(createFooterActions());
    };

    drawer = createDrawer({
      title: 'Настройки фильтра',
      description: 'Определите основные параметры.',
      content: document.createElement('div'),
      footer: createFooterActions(),
      onBack: showRoot,
    });
    showRoot();
    return mountDrawerStory(drawer, 'Открыть многоэтапный drawer');
  },
};

export const ScrollableContent = {
  render: () => {
    const content = document.createElement('div');
    content.className = 'component-drawer-story__stack';
    Array.from({ length: 18 }, (_, index) => {
      const section = document.createElement('section');
      section.className = 'component-drawer-story__section';
      const heading = document.createElement('h3');
      heading.textContent = `Группа параметров ${index + 1}`;
      section.append(heading, createCopy('Содержимое прокручивается независимо от фиксированных хедера и футера.'));
      return section;
    }).forEach(section => content.append(section));

    const drawer = createDrawer({
      title: 'Расширенные настройки',
      description: 'Все группы доступны в прокручиваемой контентной области.',
      content,
      footer: createFooterActions('Сохранить'),
    });
    return mountDrawerStory(drawer, 'Открыть длинную панель');
  },
};

export const Expanded = {
  render: () => {
    const drawer = createDrawer({
      title: 'Расширенные настройки',
      content: createCopy('Расширенное состояние предназначено для таблиц, вкладок и составных форм.'),
      footer: createFooterActions('Сохранить'),
      expanded: true,
    });
    return mountDrawerStory(drawer, 'Открыть расширенную панель');
  },
};

export const Bottom = {
  render: () => {
    const content = document.createElement('div');
    content.className = 'component-drawer-story__stack';
    Array.from({ length: 12 }, (_, index) => {
      const section = document.createElement('section');
      section.className = 'component-drawer-story__section';
      const heading = document.createElement('h3');
      heading.textContent = `Раздел ${index + 1}`;
      section.append(
        heading,
        createCopy('Контент прокручивается внутри нижнего drawer, а хедер и футер остаются на своих местах.'),
      );
      return section;
    }).forEach(section => content.append(section));

    const drawer = createDrawer({
      title: 'Выбор типа документа',
      description: 'Выберите вариант для перехода к следующему этапу.',
      content,
      footer: createFooterActions('Продолжить'),
      placement: 'bottom',
      closeLabel: 'Закрыть выбор типа документа',
    });
    return mountDrawerStory(drawer, 'Открыть нижний drawer');
  },
};
