import { createCheckbox } from './checkbox.js';
import { appendContent, setAttributes } from './dom.js';
import { createIcon } from './icon.js';
import { createTag } from './tag.js';

function createLucideFallback(definitions) {
  const namespace = 'http://www.w3.org/2000/svg';
  const icon = document.createElementNS(namespace, 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '2');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
  icon.setAttribute('aria-hidden', 'true');
  definitions.forEach(([tagName, attributes]) => {
    const child = document.createElementNS(namespace, tagName);
    Object.entries(attributes).forEach(([name, value]) => child.setAttribute(name, value));
    icon.append(child);
  });
  return icon;
}

const TASK_METAPHOR_ICON = Object.freeze([
  ['path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z' }],
  ['path', { d: 'M14 2v6h6' }],
  ['path', { d: 'm9 15 2 2 4-4' }],
]);

const TASK_DATE_ICON = Object.freeze([
  ['path', { d: 'M8 2v4' }],
  ['path', { d: 'M16 2v4' }],
  ['rect', { x: '3', y: '4', width: '18', height: '18', rx: '2' }],
  ['path', { d: 'M3 10h18' }],
]);

export function createTaskMetaphorIcon() {
  return createIcon({
    name: 'file-check',
    size: 16,
    className: 'ds-task-title__icon',
    fallback: () => createLucideFallback(TASK_METAPHOR_ICON),
  });
}

export function createTaskDateIcon() {
  return createIcon({
    name: 'calendar',
    size: 16,
    className: 'ds-task-date__icon',
    fallback: () => createLucideFallback(TASK_DATE_ICON),
  });
}

function createPerson(person) {
  if (!person) {
    const empty = document.createElement('span');
    empty.className = 'ds-table-empty-val';
    empty.textContent = '–';
    return empty;
  }

  const displayName = person.displayName || person.fullName || person.label || '';
  const fullName = person.fullName || displayName;
  const cell = document.createElement('div');
  cell.className = 'ds-person-cell ds-person-cell--card';
  cell.title = fullName;

  const avatar = document.createElement('img');
  avatar.className = 'ds-person-cell__avatar';
  avatar.src = person.avatarUrl || '';
  avatar.alt = fullName;
  avatar.loading = 'lazy';

  const body = document.createElement('div');
  body.className = 'ds-person-cell__body';
  const name = document.createElement('span');
  name.className = 'ds-person-cell__name';
  name.textContent = displayName;
  body.append(name);

  if (person.email) {
    const email = document.createElement('button');
    email.className = 'ds-person-cell__email js-copy-person-email';
    email.type = 'button';
    email.dataset.email = person.email;
    email.title = 'Скопировать email';
    email.textContent = person.email;
    body.append(email);
  }

  cell.append(avatar, body);
  return cell;
}

/**
 * Shared representation of one task in the alternative card-list view.
 * Product filtering, pagination and drawer state remain with the Tasks feature.
 */
export function createTaskListCard({
  taskId,
  title,
  status,
  statusColor,
  person,
  date,
  selected = false,
  overdue = false,
  newTask = false,
  searchText = '',
  className = '',
  attributes = {},
  onOpen,
  onSelectionChange,
} = {}) {
  const safeTaskId = String(taskId ?? '');
  const safeTitle = String(title ?? '');
  const element = document.createElement('div');
  element.className = [
    'ds-task-row',
    'ds-task-list-card',
    selected ? 'is-selected' : '',
    overdue ? 'is-overdue' : '',
    newTask ? 'is-new' : '',
    className,
  ].filter(Boolean).join(' ');
  setAttributes(element, { 'data-id': safeTaskId, 'data-search': searchText, ...attributes });

  const selection = createCheckbox({
    id: `task-selection-card-${safeTaskId}`,
    ariaLabel: `Выбрать задачу ${safeTaskId}`,
    checked: selected,
    className: 'ds-task-selection-control',
    inputClassName: 'js-task-select',
    attributes: { 'data-id': safeTaskId },
    onChange: onSelectionChange,
  });
  selection.input.toggleAttribute('checked', selected);

  const main = document.createElement('div');
  main.className = 'ds-task-row__main';
  const id = document.createElement('span');
  id.className = 'ds-task-row__id';
  id.textContent = safeTaskId;
  const name = document.createElement('span');
  name.className = 'ds-task-row__name';
  const titleButton = document.createElement('button');
  titleButton.className = 'ds-task-title js-open-task-card';
  titleButton.type = 'button';
  titleButton.dataset.taskId = safeTaskId;
  titleButton.title = safeTitle;
  titleButton.setAttribute('aria-label', `Открыть карточку задачи «${safeTitle}»`);
  const titleText = document.createElement('span');
  titleText.className = 'ds-task-title__text';
  titleText.textContent = safeTitle;
  titleButton.append(createTaskMetaphorIcon(), titleText);
  if (onOpen) titleButton.addEventListener('click', onOpen);
  name.append(titleButton);
  main.append(id, name);

  const meta = document.createElement('div');
  meta.className = 'ds-task-row__meta';
  const statusTag = status instanceof Node
    ? status
    : createTag({ label: status || 'Без статуса', color: statusColor, tone: 'contrast', className: 'ds-task-status-tag' }).element;
  const dateSlot = document.createElement('span');
  dateSlot.className = 'ds-task-row__date';
  if (date) {
    const dateValue = document.createElement('span');
    dateValue.className = ['ds-task-date', overdue ? 'ds-task-date--alert' : ''].filter(Boolean).join(' ');
    const value = document.createElement('span');
    value.className = 'ds-task-date__value';
    value.textContent = date;
    dateValue.append(createTaskDateIcon(), value);
    dateSlot.append(dateValue);
  } else {
    appendContent(dateSlot, '–');
  }
  meta.append(statusTag, createPerson(person), dateSlot);
  element.append(selection.element, main, meta);

  return { element, selection: selection.input, titleButton };
}
