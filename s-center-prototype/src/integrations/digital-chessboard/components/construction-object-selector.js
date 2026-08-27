// Общий pure-renderer карточек выбора объекта строительства.
(function (window) {
    'use strict';

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
        }[char]));
    }

    function escapeAttr(value) {
        return escapeHtml(value).replace(/`/g, '&#096;');
    }

    const ICON_PATHS = Object.freeze({
        'building-2': '<path d="M10 12h4"/><path d="M10 8h4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>',
        'square-parking': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
        school: '<path d="m3 10 9-5 9 5-9 5-9-5Z"/><path d="M7 12v5c3 2 7 2 10 0v-5"/><path d="M21 10v6"/>',
        check: '<path d="m5 12 4 4L19 6"/>'
    });

    function icon(name, size) {
        const paths = ICON_PATHS[name] || ICON_PATHS['building-2'];
        return `<svg class="cos-card-icon-svg" aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
    }

    function normalizeProgress(value) {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric))) : 0;
    }

    function normalizeCards(cards) {
        return Array.isArray(cards)
            ? cards.filter((card) => card && card.id && !card.disabled)
            : [];
    }

    function renderCard(card, activeId, action) {
        const selected = card.id === activeId;
        const progress = normalizeProgress(card.progressPercent);
        const deviationTone = card.deviationTone === 'behind' ? 'is-behind' : 'is-on-plan';
        const descriptionLabel = card.descriptionLabel || card.metaLabel || card.typeLabel || card.type || '';
        return `<button class="cos-card${selected ? ' is-selected' : ''}" type="button" role="tab" data-action="${escapeAttr(action)}" data-construction-object-id="${escapeAttr(card.id)}" data-focus-key="construction-object-${escapeAttr(card.id)}" aria-selected="${selected}" tabindex="${selected ? 0 : -1}">
            <span class="cos-card-head">
                <span class="cos-card-icon">${icon(card.icon || 'building-2', 24)}</span>
                <span class="cos-card-title"><strong title="${escapeAttr(card.name)}">${escapeHtml(card.name)}</strong><small title="${escapeAttr(descriptionLabel)}">${escapeHtml(descriptionLabel)}</small></span>
                ${selected ? `<span class="cos-card-check">${icon('check', 15)}</span>` : ''}
            </span>
            <span class="cos-card-readiness"><span class="cos-card-progress"><span class="cos-card-ring" style="--cos-progress:${progress}%"></span><strong>${progress}%</strong></span><span class="cos-card-deviation ${deviationTone}">${escapeHtml(card.deviationLabel || 'По плану')}</span></span>
        </button>`;
    }

    function renderConstructionObjectSelector(cards, options) {
        const settings = options || {};
        const normalizedCards = normalizeCards(cards);
        const activeId = normalizedCards.some((card) => card.id === settings.activeId)
            ? settings.activeId
            : normalizedCards[0]?.id || null;
        const className = settings.className ? ` ${escapeAttr(settings.className)}` : '';
        const ariaLabel = settings.ariaLabel || 'Выбор объекта строительства';
        const action = settings.action || 'select-object';
        const renderedCards = normalizedCards.map((card) => renderCard(card, activeId, action)).join('');

        return `<section class="cos-selector${className}"><div class="cos-list" role="tablist" aria-label="${escapeAttr(ariaLabel)}">${renderedCards}</div></section>`;
    }

    function getConstructionObjectSelectorNextId(cards, activeId, key) {
        const normalizedCards = normalizeCards(cards);
        if (!normalizedCards.length) return null;

        const currentIndex = Math.max(0, normalizedCards.findIndex((card) => card.id === activeId));
        if (key === 'Home') return normalizedCards[0].id;
        if (key === 'End') return normalizedCards[normalizedCards.length - 1].id;
        if (key === 'ArrowRight' || key === 'ArrowDown') {
            return normalizedCards[(currentIndex + 1) % normalizedCards.length].id;
        }
        if (key === 'ArrowLeft' || key === 'ArrowUp') {
            return normalizedCards[(currentIndex - 1 + normalizedCards.length) % normalizedCards.length].id;
        }
        return null;
    }

    function handleConstructionObjectSelectorKeydown(event, options) {
        const settings = options || {};
        const nextId = getConstructionObjectSelectorNextId(settings.cards, settings.activeId, event?.key);
        if (!nextId) return false;
        event.preventDefault();
        if (typeof settings.onSelect === 'function') {
            settings.onSelect(nextId, { focus: true, event });
        }
        return true;
    }

    window.SCenterComponents = window.SCenterComponents || {};
    window.SCenterComponents.renderConstructionObjectSelector = renderConstructionObjectSelector;
    window.SCenterComponents.getConstructionObjectSelectorNextId = getConstructionObjectSelectorNextId;
    window.SCenterComponents.handleConstructionObjectSelectorKeydown = handleConstructionObjectSelectorKeydown;
})(window);
