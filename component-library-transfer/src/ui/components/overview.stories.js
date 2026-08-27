import { componentRegistry } from './registry.js';

export default {
  title: 'Overview/Component Registry',
  tags: ['autodocs'],
};

export const Registry = {
  render: () => {
    const table = document.createElement('table');
    table.className = 'component-registry-table';
    table.innerHTML = `
      <thead>
        <tr><th>ID</th><th>Компонент</th><th>Категория</th><th>Потребители</th><th>DS binding</th></tr>
      </thead>
      <tbody></tbody>
    `;
    const body = table.querySelector('tbody');
    componentRegistry.forEach(component => {
      const row = document.createElement('tr');
      [
        component.id,
        component.name,
        component.category,
        component.consumers.join(', '),
        component.dsBinding || 'Не назначен',
      ].forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      body.append(row);
    });
    return table;
  },
};
