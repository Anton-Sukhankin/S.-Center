import { createCheckbox } from './checkbox.js';
import { setAttributes } from './dom.js';
import { createPackageDisclosureIcon } from './package-disclosure-icon.js';

let treeSequence = 0;

function toId(value) {
  return String(value);
}

function normalizeNodes(nodes = []) {
  return nodes.map(node => ({
    ...node,
    id: toId(node.id),
    label: String(node.label ?? node.name ?? ''),
    children: Array.isArray(node.children) ? normalizeNodes(node.children) : [],
  }));
}

function collectDescendantIds(node, result = []) {
  node.children.forEach(child => {
    result.push(child.id);
    collectDescendantIds(child, result);
  });
  return result;
}

function filterNodes(nodes, query) {
  const normalizedQuery = String(query || '').trim().toLocaleLowerCase();
  if (!normalizedQuery) return nodes;

  return nodes.flatMap(node => {
    const children = filterNodes(node.children, normalizedQuery);
    if (!node.label.toLocaleLowerCase().includes(normalizedQuery) && children.length === 0) return [];
    return [{ ...node, children }];
  });
}

export function createTree(options = {}) {
  const treeId = `ds-tree-${++treeSequence}`;
  let settings = { ...options };
  let nodes = normalizeNodes(settings.nodes);
  let selectedIds = new Set((settings.selectedIds || []).map(toId));
  let expandedIds = new Set((settings.expandedIds || []).map(toId));
  let disabledIds = new Set((settings.disabledIds || []).map(toId));

  const element = document.createElement('div');
  element.className = 'ds-tree';
  element.id = settings.id || treeId;

  function isDisabled(node) {
    return Boolean(node.disabled) || disabledIds.has(node.id);
  }

  function notifySelection(node, selected, reason, event) {
    settings.onSelectionChange?.(Array.from(selectedIds), {
      node,
      selected,
      reason,
      event,
    });
  }

  function setNodeSelection(node, shouldSelect, event, reason = 'select') {
    if (isDisabled(node) || settings.selectionMode === 'none') return;

    if (settings.selectionMode === 'single') {
      selectedIds = new Set([node.id]);
      shouldSelect = true;
    } else {
      const affectedIds = [node.id];
      if (settings.cascadeSelection) collectDescendantIds(node, affectedIds);
      affectedIds.forEach(id => {
        if (shouldSelect) selectedIds.add(id);
        else selectedIds.delete(id);
      });
    }

    render(node.id);
    notifySelection(node, shouldSelect, reason, event);
  }

  function toggleExpanded(node, event) {
    if (node.children.length === 0 || isDisabled(node)) return;
    const expanded = !expandedIds.has(node.id);
    if (expanded) expandedIds.add(node.id);
    else expandedIds.delete(node.id);
    render(node.id);
    settings.onToggle?.(node.id, expanded, Array.from(expandedIds), event);
  }

  function focusRelative(row, offset) {
    const rows = Array.from(element.querySelectorAll('.ds-tree__row:not([aria-disabled="true"])'));
    const index = rows.indexOf(row);
    focusRow(rows[Math.max(0, Math.min(rows.length - 1, index + offset))]);
  }

  function focusRow(row) {
    if (!row) return;
    element.querySelectorAll('.ds-tree__row').forEach(item => {
      item.tabIndex = item === row ? 0 : -1;
    });
    row.focus();
  }

  function renderNode(node, depth, forceExpanded) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ds-tree__node';
    wrapper.dataset.treeNodeId = node.id;

    const row = document.createElement('div');
    row.className = 'ds-tree__row';
    row.style.setProperty('--ds-tree-indent', `${8 + depth * 20}px`);
    row.style.setProperty('--ds-tree-guide', `${18 + Math.max(0, depth - 1) * 20}px`);
    row.dataset.treeRowId = node.id;
    row.tabIndex = -1;
    row.setAttribute('role', 'treeitem');
    row.setAttribute('aria-level', String(depth + 1));
    row.setAttribute('aria-label', node.label);

    const disabled = isDisabled(node);
    const hasChildren = node.children.length > 0;
    const expanded = hasChildren && (forceExpanded || expandedIds.has(node.id));
    const selected = selectedIds.has(node.id);
    const descendantIds = settings.cascadeSelection ? collectDescendantIds(node, []) : [];
    const partiallySelected = !selected && descendantIds.some(id => selectedIds.has(id));

    row.classList.toggle('is-selected', selected);
    row.classList.toggle('is-disabled', disabled);
    row.setAttribute('aria-selected', String(selected));
    row.setAttribute('aria-disabled', String(disabled));
    if (hasChildren) row.setAttribute('aria-expanded', String(expanded));

    if (settings.selectionMode === 'multiple') {
      const checkbox = createCheckbox({
        ariaLabel: `Выбрать «${node.label}»`,
        checked: selected,
        indeterminate: partiallySelected,
        disabled,
        className: 'ds-tree__checkbox',
        onChange: (checked, event) => setNodeSelection(node, checked, event),
      });
      checkbox.input.tabIndex = -1;
      checkbox.element.addEventListener('click', event => event.stopPropagation());
      row.append(checkbox.element);
    }

    const disclosure = document.createElement(hasChildren ? 'button' : 'span');
    disclosure.className = 'ds-tree__disclosure';
    if (hasChildren) {
      disclosure.type = 'button';
      disclosure.tabIndex = -1;
      disclosure.disabled = disabled;
      disclosure.setAttribute('aria-label', `${expanded ? 'Свернуть' : 'Развернуть'} «${node.label}»`);
      disclosure.setAttribute('aria-expanded', String(expanded));
      disclosure.addEventListener('click', event => {
        event.stopPropagation();
        toggleExpanded(node, event);
      });
    } else {
      disclosure.setAttribute('aria-hidden', 'true');
    }
    disclosure.append(createPackageDisclosureIcon({
      state: hasChildren ? (expanded ? 'expanded' : 'collapsed') : 'leaf',
    }));
    row.append(disclosure);

    const label = document.createElement('span');
    label.className = 'ds-tree__label';
    label.textContent = node.label;
    row.append(label);

    row.addEventListener('click', event => {
      if (disabled || event.target.closest('.ds-tree__disclosure, .ds-tree__checkbox')) return;
      if (hasChildren && settings.branchClickAction === 'toggle') {
        toggleExpanded(node, event);
        return;
      }
      if (settings.selectionMode === 'none') settings.onActivate?.(node, event);
      else setNodeSelection(node, settings.selectionMode === 'multiple' ? !selected : true, event);
    });

    row.addEventListener('keydown', event => {
      if (disabled) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        focusRelative(row, 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        focusRelative(row, -1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        focusRow(element.querySelector('.ds-tree__row:not([aria-disabled="true"])'));
      } else if (event.key === 'End') {
        event.preventDefault();
        const rows = element.querySelectorAll('.ds-tree__row:not([aria-disabled="true"])');
        focusRow(rows[rows.length - 1]);
      } else if (event.key === 'ArrowRight' && hasChildren && !expanded) {
        event.preventDefault();
        toggleExpanded(node, event);
      } else if (event.key === 'ArrowLeft' && hasChildren && expanded) {
        event.preventDefault();
        toggleExpanded(node, event);
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (hasChildren && (settings.selectionMode === 'none' || settings.branchClickAction === 'toggle')) toggleExpanded(node, event);
        else if (settings.selectionMode === 'none') settings.onActivate?.(node, event);
        else setNodeSelection(node, settings.selectionMode === 'multiple' ? !selected : true, event, 'keyboard');
      }
    });

    wrapper.append(row);
    if (expanded) {
      const group = document.createElement('div');
      group.className = 'ds-tree__group';
      group.setAttribute('role', 'group');
      node.children.forEach(child => group.append(renderNode(child, depth + 1, forceExpanded)));
      wrapper.append(group);
    }

    return wrapper;
  }

  function render(focusId) {
    const activeId = focusId || element.querySelector('.ds-tree__row:focus')?.dataset.treeRowId;
    element.replaceChildren();
    element.className = ['ds-tree', settings.className].filter(Boolean).join(' ');
    element.setAttribute('role', 'tree');
    element.setAttribute('aria-label', settings.label || 'Дерево');
    if (settings.selectionMode === 'multiple') element.setAttribute('aria-multiselectable', 'true');
    else element.removeAttribute('aria-multiselectable');
    setAttributes(element, settings.attributes || {});

    const visibleNodes = filterNodes(nodes, settings.query);
    const forceExpanded = Boolean(String(settings.query || '').trim());
    if (visibleNodes.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'ds-tree__empty';
      empty.textContent = settings.emptyMessage || 'Нет элементов';
      element.append(empty);
    } else {
      visibleNodes.forEach(node => element.append(renderNode(node, 0, forceExpanded)));
    }

    const focusableRows = Array.from(element.querySelectorAll('.ds-tree__row:not([aria-disabled="true"])'));
    const activeRow = activeId
      ? focusableRows.find(row => row.dataset.treeRowId === toId(activeId))
      : null;
    const selectedRow = focusableRows.find(row => row.getAttribute('aria-selected') === 'true');
    const tabStop = activeRow || selectedRow || focusableRows[0];
    if (tabStop) tabStop.tabIndex = 0;
    if (activeRow) activeRow.focus();
  }

  function update(next = {}) {
    settings = { ...settings, ...next };
    if ('nodes' in next) nodes = normalizeNodes(next.nodes);
    if ('selectedIds' in next) selectedIds = new Set((next.selectedIds || []).map(toId));
    if ('expandedIds' in next) expandedIds = new Set((next.expandedIds || []).map(toId));
    if ('disabledIds' in next) disabledIds = new Set((next.disabledIds || []).map(toId));
    render();
  }

  render();

  return Object.freeze({
    element,
    update,
    setNodes: nextNodes => update({ nodes: nextNodes }),
    setSelectedIds: ids => update({ selectedIds: ids }),
    setExpandedIds: ids => update({ expandedIds: ids }),
    getSelectedIds: () => Array.from(selectedIds),
    getExpandedIds: () => Array.from(expandedIds),
  });
}
