import {
  createButton,
  createIcon,
  createInput,
  createResizeHandle,
  createTree,
} from '../../component-library-transfer/src/index.js';
import { initialProjectTreeContext, projectNodes } from './data/project-tree.js';
import { createSettingsDrawer } from './features/settings-drawer.js';
import { mountDigitalChessboard } from './integrations/digital-chessboard/adapter.js';
import { icons } from './ui/icons.js';

const navigation = [
  'Проекты',
  'Закрытые периоды',
  'Обновления',
  'Мобильное приложение',
  'Заявки НСИ',
  'Отчёты',
  'Цифровая шахматка',
];

function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function libraryIcon(name, factory, size = 20) {
  return createIcon({ name, size, fallback: factory });
}

function findTreeNodePathById(nodes, id, parentPath = []) {
  for (const node of nodes) {
    const nodePath = [...parentPath, node];
    if (node.id === id) return nodePath;
    const match = findTreeNodePathById(node.children || [], id, nodePath);
    if (match) return match;
  }
  return null;
}

function formatPixelValue(value) {
  const pixels = Math.round(value);
  const lastTwoDigits = pixels % 100;
  const lastDigit = pixels % 10;
  const unit = lastTwoDigits >= 11 && lastTwoDigits <= 14
    ? 'пикселей'
    : lastDigit === 1
      ? 'пиксель'
      : lastDigit >= 2 && lastDigit <= 4
        ? 'пикселя'
        : 'пикселей';
  return `${pixels} ${unit}`;
}

function createHeader() {
  const header = el('header', 's-center-header');
  const utilityRow = el('div', 's-center-header__utility');
  const brandGroup = el('div', 's-center-brand');
  brandGroup.append(
    libraryIcon('apps', icons.apps, 20),
    libraryIcon('brand', icons.brand, 22),
    el('span', 's-center-brand__name', 'S.Center'),
    el('span', 's-center-brand__environment', 'STAGE'),
  );

  const utilityNav = el('nav', 's-center-utility-nav');
  utilityNav.setAttribute('aria-label', 'Служебная навигация');
  ['Аналитика', 'Помощь'].forEach(label => {
    const link = el('a', 's-center-utility-nav__link', label);
    link.href = '#';
    utilityNav.append(link);
  });
  const notificationButton = el('button', 's-center-icon-button');
  notificationButton.type = 'button';
  notificationButton.setAttribute('aria-label', 'Уведомления');
  notificationButton.append(libraryIcon('bell', icons.bell, 20));
  const avatar = el('div', 's-center-avatar');
  avatar.setAttribute('role', 'img');
  avatar.setAttribute('aria-label', 'Профиль пользователя');
  utilityNav.append(notificationButton, avatar);
  utilityRow.append(brandGroup, utilityNav);

  const productNav = el('nav', 's-center-product-nav');
  productNav.setAttribute('aria-label', 'Разделы S.Center');
  navigation.forEach(label => {
    const link = el('a', 's-center-product-nav__link', label);
    link.href = '#';
    if (label === 'Цифровая шахматка') {
      link.classList.add('is-current');
      link.setAttribute('aria-current', 'page');
    }
    link.addEventListener('click', event => {
      event.preventDefault();
      productNav.querySelectorAll('.s-center-product-nav__link').forEach(item => {
        item.classList.remove('is-current');
        item.removeAttribute('aria-current');
      });
      link.classList.add('is-current');
      link.setAttribute('aria-current', 'page');
    });
    productNav.append(link);
  });
  header.append(utilityRow, productNav);
  return header;
}

function createWorkspace(onOpenSettings, settingsDrawerId, onChessboardContextChange) {
  const workspace = el('div', 's-center-workspace');
  let updateSelectedTreePath = () => {};
  const sidebar = el('aside', 's-center-sidebar');
  sidebar.id = 's-center-project-tree';
  sidebar.setAttribute('aria-label', 'Все проекты');
  const sidebarHeader = el('div', 's-center-sidebar__header');
  const sidebarTitle = el('div', 's-center-sidebar__title-row');
  sidebarTitle.append(el('h2', 's-center-sidebar__title', 'Все проекты'), el('span', 's-center-sidebar__count', '104'));

  const tree = createTree({
    label: 'Проекты и объекты строительства',
    nodes: projectNodes,
    selectionMode: 'single',
    branchClickAction: 'select',
    selectedIds: [initialProjectTreeContext.selectedId],
    expandedIds: ['alkhimovo', 'queue-1'],
    onSelectionChange: (_selectedIds, details) => {
      if (!details.node.context) return;
      updateSelectedTreePath(details.node);
      onChessboardContextChange(details.node.context);
    },
  });

  const search = createInput({
    placeholder: '',
    className: 's-center-project-search',
    leadingIcon: libraryIcon('search', icons.search, 18),
    attributes: { 'aria-label': 'Поиск по проектам', autocomplete: 'off' },
    onInput: value => tree.update({ query: value }),
  });
  sidebarHeader.append(sidebarTitle, search.element);
  const treeScroller = el('div', 's-center-tree-scroller');
  treeScroller.append(tree.element);
  sidebar.append(sidebarHeader, treeScroller);

  const resizer = createResizeHandle({
    label: 'Изменить ширину списка проектов',
    value: 332,
    defaultValue: 332,
    min: 280,
    max: 480,
    step: 8,
    className: 's-center-resizer',
    indicator: icons.resize(),
    attributes: { 'aria-controls': sidebar.id },
    formatValue: formatPixelValue,
    onChange: value => workspace.style.setProperty('--s-center-sidebar-width', `${value}px`),
  });

  const main = el('div', 's-center-main');
  const mainHeader = el('div', 's-center-main__header');
  const heading = el('h1', 's-center-main__title');
  const headingLabel = el('span', 's-center-main__title-label', 'Цифровая шахматка');
  const headingContext = el('span', 's-center-main__title-context');
  heading.append(headingLabel, headingContext);

  updateSelectedTreePath = node => {
    const nodePath = node?.context?.objectId
      ? findTreeNodePathById(projectNodes, node.id)
      : null;
    const pathLabels = nodePath?.map(pathNode => pathNode.label) || [];

    headingContext.replaceChildren();
    pathLabels.forEach((label, index) => {
      const separator = el('span', 's-center-main__title-separator');
      separator.setAttribute('aria-hidden', 'true');
      const pathNode = el('span', 's-center-main__title-path-node', label);
      pathNode.classList.toggle('is-current', index === pathLabels.length - 1);
      pathNode.title = label;
      headingContext.append(separator, pathNode);
    });

    headingContext.hidden = pathLabels.length === 0;
    const accessiblePath = ['Цифровая шахматка', ...pathLabels];
    heading.setAttribute('aria-label', accessiblePath.join(', '));
    heading.title = accessiblePath.join(' • ');
  };
  const initialTreePath = findTreeNodePathById(projectNodes, initialProjectTreeContext.selectedId);
  updateSelectedTreePath(initialTreePath?.at(-1));

  const settingsButton = createButton({
    label: 'Настройки',
    icon: libraryIcon('gear', icons.gear, 18),
    variant: 'outlined',
    className: 's-center-settings',
    attributes: {
      'aria-controls': settingsDrawerId,
      'aria-expanded': 'false',
      'aria-haspopup': 'dialog',
    },
    onClick: event => {
      onOpenSettings(event.currentTarget);
    },
  });
  mainHeader.append(heading, settingsButton);

  const mainBody = el('div', 's-center-main__body s-center-main__body--digital-chessboard');
  const chessboardView = el('section');
  chessboardView.id = 'digital-chessboard-view';
  chessboardView.setAttribute('aria-label', 'Цифровая шахматка');
  const chessboardRoot = el('div');
  chessboardRoot.id = 'digital-chessboard-root';
  chessboardView.append(chessboardRoot);
  mainBody.append(chessboardView);
  main.append(mainHeader, mainBody);
  workspace.append(sidebar, resizer.element, main);
  return { element: workspace, chessboardRoot };
}

function renderApp() {
  const root = document.querySelector('#app');
  const settingsDrawer = createSettingsDrawer();
  let chessboard = null;
  let activeChessboardContext = initialProjectTreeContext.context;
  const workspace = createWorkspace(
    trigger => settingsDrawer.open(trigger),
    settingsDrawer.id,
    context => {
      activeChessboardContext = context;
      chessboard?.setContext(context);
    },
  );
  const app = el('div', 's-center-app');
  app.append(
    createHeader(),
    workspace.element,
  );
  root.replaceChildren(app);
  chessboard = mountDigitalChessboard(workspace.chessboardRoot, {
    context: activeChessboardContext,
  });
  settingsDrawer.mount(document.body);
  window.addEventListener('beforeunload', () => chessboard.destroy(), { once: true });
}

renderApp();
