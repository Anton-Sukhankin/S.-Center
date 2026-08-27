// Общий каталог стабильной идентичности объектов строительства.
// Подключается обычным <script> до feature-specific data-слоев.
(function (window) {
    'use strict';

    const CATALOG = Object.freeze([
        Object.freeze({ id: 'house-1', name: 'Дом 1', type: 'residential', typeLabel: 'Жилой дом', icon: 'building-2' }),
        Object.freeze({ id: 'house-2', name: 'Дом 2', type: 'residential', typeLabel: 'Жилой дом', icon: 'building-2' }),
        Object.freeze({ id: 'house-3', name: 'Дом 3', type: 'residential', typeLabel: 'Жилой дом', icon: 'building-2' }),
        Object.freeze({ id: 'parking', name: 'Паркинг', type: 'parking', typeLabel: 'Паркинг', icon: 'square-parking' }),
        Object.freeze({ id: 'kindergarten', name: 'Детский сад', type: 'social', typeLabel: 'Социальный объект', icon: 'school' })
    ]);

    function clone(value) {
        return typeof window.structuredClone === 'function'
            ? window.structuredClone(value)
            : JSON.parse(JSON.stringify(value));
    }

    function getAll() {
        return clone(CATALOG);
    }

    function getById(objectId) {
        const object = CATALOG.find((item) => item.id === objectId);
        return object ? clone(object) : null;
    }

    function validate() {
        const errors = [];
        const ids = new Set();

        if (CATALOG.length !== 5) {
            errors.push(`Ожидалось 5 объектов, получено ${CATALOG.length}.`);
        }

        CATALOG.forEach((object) => {
            if (!object.id || !object.name || !object.type || !object.typeLabel || !object.icon) {
                errors.push(`${object.id || 'unknown'}: заполнены не все поля стабильной идентичности.`);
            }
            if (ids.has(object.id)) errors.push(`${object.id}: идентификатор объекта повторяется.`);
            ids.add(object.id);
        });

        return errors;
    }

    window.constructionObjectsData = Object.freeze({ getAll, getById, validate });
})(window);
