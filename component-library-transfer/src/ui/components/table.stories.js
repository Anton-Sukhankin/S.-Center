import { createButton } from './button.js';
import { createCheckbox } from './checkbox.js';
import { createInput } from './input.js';
import { createSelect } from './select.js';
import { createTable, createTableCell, createTableHeaderCell, createTableRow } from './table.js';
import { createTag } from './tag.js';

const people = [
  { id: 'DOC-1042', title: 'Договор поставки', amount: 1250000, status: 'Согласован', owner: 'Анна Петрова', type: 'Договор' },
  { id: 'DOC-1043', title: 'Дополнительное соглашение', amount: 84000, status: 'На проверке', owner: 'Иван Орлов', type: 'Соглашение' },
  { id: 'DOC-1044', title: 'Приказ о назначении', amount: 0, status: 'Черновик', owner: 'Мария Белова', type: 'Приказ' },
];

const statusVariants = {
  'Согласован': 'success',
  'На проверке': 'warning',
  'Черновик': 'neutral',
};

function makeTag(label) {
  return createTag({ label, variant: statusVariants[label] || 'neutral' }).element;
}

function makeInput(value, rowId) {
  const input = createInput({
    value,
    className: 'ds-data-table__control',
    attributes: { 'aria-label': `Ответственный для ${rowId}` },
  });
  return input.element;
}

function makeSelect(value, rowId) {
  const select = createSelect({
    value,
    options: ['Договор', 'Соглашение', 'Приказ'],
    attributes: { 'aria-label': `Тип документа ${rowId}` },
  });
  select.element.classList.add('ds-data-table__control');
  return select.element;
}

function makeAction(rowId) {
  return createButton({
    label: 'Открыть',
    size: 'small',
    variant: 'text',
    attributes: { 'aria-label': `Открыть ${rowId}` },
  });
}

function createStoryTable(options = {}) {
  const story = document.createElement('div');
  story.className = 'ds-data-table-story';
  const table = createTable(options);
  story.append(table.element);
  return { story, table };
}

export default {
  title: 'Data Display/Table',
  tags: ['autodocs'],
};

export const Anatomy = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'ds-data-table-story';
    const container = document.createElement('div');
    container.className = 'ds-data-table-container';
    const table = document.createElement('table');
    table.className = 'ds-data-table';
    const head = document.createElement('thead');
    head.className = 'ds-data-table__head';
    const headerRow = document.createElement('tr');
    headerRow.className = 'ds-data-table__header-row';
    headerRow.append(
      createTableHeaderCell({ content: 'Название', minWidth: 260 }).element,
      createTableHeaderCell({ content: 'Количество', align: 'end', width: 140 }).element,
      createTableHeaderCell({ content: 'Статус', width: 160 }).element,
    );
    head.append(headerRow);
    const body = document.createElement('tbody');
    body.className = 'ds-data-table__body';
    body.append(createTableRow({
      cells: [
        createTableCell({ content: 'Договор поставки' }),
        createTableCell({ content: 24, align: 'end' }),
        createTableCell({ content: makeTag('Согласован') }),
      ],
    }).element);
    table.append(head, body);
    container.append(table);
    wrapper.append(container);
    return wrapper;
  },
};

export const ContentTypes = {
  render: () => createStoryTable({
    caption: 'Документы проекта',
    columns: [
      { key: 'title', header: 'Текст', minWidth: 190, truncate: true },
      { key: 'amount', header: 'Число', align: 'end', width: 120, render: value => value.toLocaleString('ru-RU') },
      { key: 'status', header: 'Тег', width: 140, render: makeTag },
      { key: 'owner', header: 'Текстовое поле', width: 180, render: (value, row) => makeInput(value, row.id) },
      { key: 'type', header: 'Селект', width: 170, render: (value, row) => makeSelect(value, row.id) },
      { key: 'action', header: 'Действие', align: 'center', width: 100, render: (_, row) => makeAction(row.id) },
    ],
    rows: people,
    rowSize: 'large',
  }).story,
};

export const RowSizes = {
  render: () => createStoryTable({
    caption: 'Размеры строк',
    columns: [
      { key: 'sizeLabel', header: 'Размер', minWidth: 180 },
      { key: 'title', header: 'Пример содержимого', minWidth: 280 },
      { key: 'status', header: 'Статус', width: 160, render: makeTag },
    ],
    rows: [
      { sizeLabel: 'Маленький', title: 'Компактная строка', status: 'Согласован', size: 'small' },
      { sizeLabel: 'Средний', title: 'Строка по умолчанию', status: 'На проверке', size: 'medium' },
      { sizeLabel: 'Большой', title: 'Строка с увеличенной высотой', status: 'Черновик', size: 'large' },
    ],
    getRowProps: row => ({ size: row.size }),
  }).story,
};

export const States = {
  render: () => createStoryTable({
    caption: 'Состояния строк',
    columns: [
      { key: 'state', header: 'Состояние', width: 180 },
      { key: 'title', header: 'Название', minWidth: 300 },
      { key: 'status', header: 'Статус', width: 160, render: makeTag },
    ],
    rows: [
      { state: 'По умолчанию', title: 'Договор аренды', status: 'Согласован' },
      { state: 'При наведении', title: 'Протокол встречи', status: 'На проверке' },
      { state: 'Выбрано', title: 'Заявка на оплату', status: 'Согласован', selected: true },
      { state: 'Недоступно', title: 'Архивный приказ', status: 'Черновик', disabled: true },
    ],
    getRowProps: row => ({ selected: row.selected, disabled: row.disabled }),
    onRowActivate: () => {},
  }).story,
};

export const Sortable = {
  render: () => {
    let currentRows = [...people];
    let tableComponent;
    const { story, table } = createStoryTable({
      caption: 'Сортируемая таблица',
      columns: [
        { key: 'id', header: 'ID', width: 130, sortable: true },
        { key: 'title', header: 'Название', minWidth: 280, sortable: true },
        { key: 'amount', header: 'Сумма', align: 'end', width: 150, sortable: true, render: value => value.toLocaleString('ru-RU') },
        { key: 'status', header: 'Статус', width: 160, render: makeTag },
      ],
      rows: currentRows,
      onSort: ({ key, direction }) => {
        const multiplier = direction === 'ascending' ? 1 : -1;
        currentRows = [...currentRows].sort((left, right) => (
          String(left[key]).localeCompare(String(right[key]), 'ru', { numeric: true }) * multiplier
        ));
        tableComponent.setRows(currentRows);
      },
    });
    tableComponent = table;
    return story;
  },
};

export const Selection = {
  render: () => {
    const selected = new Set(people.map(person => person.id));
    let tableComponent;
    const headerCheckbox = createCheckbox({
      ariaLabel: 'Выбрать все документы',
      checked: true,
      onChange: checked => {
        selected.clear();
        if (checked) people.forEach(person => selected.add(person.id));
        tableComponent.setRows(people);
      },
    });
    const header = document.createElement('div');
    header.className = 'ds-data-table-story__selection-header';
    const label = document.createElement('span');
    label.textContent = 'Выбрано';
    header.append(headerCheckbox.element, label);
    const { story, table } = createStoryTable({
      caption: 'Выбор документов',
      columns: [
        { key: 'title', header: 'Название', minWidth: 320 },
        { key: 'status', header: 'Статус', width: 160, render: makeTag },
        {
          key: 'selected',
          header,
          width: 150,
          render: (_, row) => createCheckbox({
            ariaLabel: `Выбрать ${row.id}`,
            checked: selected.has(row.id),
            onChange: checked => {
              if (checked) selected.add(row.id);
              else selected.delete(row.id);
              headerCheckbox.setChecked(
                selected.size === people.length,
                selected.size > 0 && selected.size < people.length,
              );
            },
          }).element,
        },
      ],
      rows: people,
      rowSize: 'medium',
    });
    tableComponent = table;
    return story;
  },
};

export const Empty = {
  render: () => createStoryTable({
    caption: 'Пустая таблица',
    columns: [
      { key: 'title', header: 'Название', minWidth: 320 },
      { key: 'status', header: 'Статус', width: 180 },
    ],
    rows: [],
  }).story,
};
