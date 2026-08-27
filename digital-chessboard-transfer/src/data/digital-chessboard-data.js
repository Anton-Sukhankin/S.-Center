// Демонстрационный data-слой feature «Цифровая шахматка».
// Подключается обычным <script> до src/features/digital-chessboard/digital-chessboard.js.
(function (window) {
    'use strict';

    const STATUS = Object.freeze({
        IN_PROGRESS: 'in-progress',
        COMPLETED: 'completed',
        DELAYED: 'delayed',
        NO_DATA: 'no-data',
        NOT_APPLICABLE: 'not-applicable'
    });

    if (!window.constructionObjectsData || typeof window.constructionObjectsData.getAll !== 'function') {
        throw new Error('Construction object identity catalog is not loaded.');
    }

    const OBJECT_GEOMETRY = Object.freeze({
        'house-1': Object.freeze({ floorCount: 34, partCount: 16, rowLabel: 'Этаж', partLabel: 'Секция', structure: '34 этажа · 16 секций', actual: 45, plan: 52 }),
        'house-2': Object.freeze({ floorCount: 34, partCount: 16, rowLabel: 'Этаж', partLabel: 'Секция', structure: '34 этажа · 16 секций', actual: 37, plan: 37 }),
        'house-3': Object.freeze({ floorCount: 34, partCount: 16, rowLabel: 'Этаж', partLabel: 'Секция', structure: '34 этажа · 16 секций', actual: 54, plan: 55 }),
        parking: Object.freeze({ floorCount: 5, partCount: 3, rowLabel: 'Уровень', partLabel: 'Зона', structure: '5 уровней · 3 зоны', actual: 64, plan: 66 }),
        kindergarten: Object.freeze({ floorCount: 3, partCount: 2, rowLabel: 'Этаж', partLabel: 'Корпус', structure: '3 этажа · 2 корпуса', actual: 82, plan: 82 })
    });

    const OBJECT_TEMPLATES = window.constructionObjectsData.getAll().map((identity) => ({
        ...identity,
        ...OBJECT_GEOMETRY[identity.id]
    }));

    const WORK_CATALOG = [
        ['monolith', '1.1', 'Монолитные работы', 'Основные конструкции', 'СМУ-1', 52],
        ['slabs', '1.2', 'Устройство перекрытий', 'Основные конструкции', 'СМУ-2', 38],
        ['masonry', '2.1', 'Кладка наружных стен', 'Ограждающие конструкции', 'КладкаСтрой', 31],
        ['partitions', '2.2', 'Внутренние перегородки', 'Ограждающие конструкции', 'СМУ-3', 24],
        ['facade', '3.1', 'Фасадные работы', 'Фасады', 'ФасадСтрой', 18],
        ['interior', '4.1', 'Внутренняя отделка', 'Отделочные работы', 'ОтделкаГрупп', 12],
        ['rough-finish', '4.2', 'Черновая отделка', 'Отделочные работы', 'ОтделкаПрофи', 28],
        ['fine-finish', '4.3', 'Чистовая отделка', 'Отделочные работы', 'МастерФиниш', 16],
        ['internal-utilities', '5.1', 'Внутренние инженерные сети', 'Инженерные системы', 'ИнжСистемы', 42],
        ['electrical', '5.2', 'Электромонтажные работы', 'Инженерные системы', 'ЭнергоМонтаж', 55],
        ['low-current', '5.3', 'Слаботочные системы', 'Инженерные системы', 'СигналПро', 33],
        ['ventilation', '5.4', 'Вентиляция', 'Инженерные системы', 'ВентСтрой', 47],
        ['heating', '5.5', 'Отопление', 'Инженерные системы', 'ТеплоСервис', 61],
        ['water-supply', '5.6', 'Водоснабжение и канализация', 'Инженерные системы', 'АкваМонтаж', 50],
        ['elevators', '6.1', 'Лифтовое оборудование', 'Оборудование', 'ЛифтКомплект', 27],
        ['commissioning', '6.2', 'Пусконаладочные работы', 'Оборудование', 'ПНР Групп', 15],
        ['roofing', '7.1', 'Кровельные работы', 'Кровля', 'КровляСтрой', 74],
        ['parapets', '7.2', 'Устройство парапетов', 'Кровля', 'ВысотаПро', 69],
        ['windows', '8.1', 'Окна и витражи', 'Светопрозрачные конструкции', 'ОкнаПроект', 58],
        ['doors', '8.2', 'Установка дверей', 'Заполнение проемов', 'ДвериСтрой', 46],
        ['balcony-railings', '8.3', 'Ограждения балконов', 'Металлоконструкции', 'МеталлКонтур', 38],
        ['landscaping', '9.1', 'Благоустройство территории', 'Благоустройство', 'ГородСреда', 22],
        ['external-utilities', '9.2', 'Наружные инженерные сети', 'Благоустройство', 'СетьСтрой', 65],
        ['road-surfaces', '9.3', 'Дорожные покрытия', 'Благоустройство', 'ДорИнвест', 31],
        ['planting', '9.4', 'Озеленение', 'Благоустройство', 'Зеленый Город', 12],
        ['entrance-groups', '10.1', 'Входные группы', 'Завершающие работы', 'ФасадКомплект', 44],
        ['handover-cleaning', '10.2', 'Уборка и подготовка к сдаче', 'Завершающие работы', 'КлинингСтрой', 7]
    ];

    function hash(value) {
        let result = 2166136261;
        String(value).split('').forEach((char) => {
            result ^= char.charCodeAt(0);
            result = Math.imul(result, 16777619);
        });
        return result >>> 0;
    }

    function randomUnit(seed, salt) {
        let value = (seed ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0;
        value ^= value >>> 16;
        value = Math.imul(value, 0x7feb352d);
        value ^= value >>> 15;
        value = Math.imul(value, 0x846ca68b);
        value ^= value >>> 16;
        return (value >>> 0) / 4294967295;
    }

    function randomRange(seed, salt, min, max) {
        return min + randomUnit(seed, salt) * (max - min);
    }

    function clamp(value) {
        return Math.max(0, Math.min(100, Math.round(value)));
    }

    function resolveStatus(actual, plan, applicable) {
        if (!applicable) return STATUS.NOT_APPLICABLE;
        if (actual === null || actual === undefined) return STATUS.NO_DATA;
        if (actual >= 100) return STATUS.COMPLETED;
        if (plan !== null && actual < plan - 10) return STATUS.DELAYED;
        return STATUS.IN_PROGRESS;
    }

    function roundProgress(value, seed, salt) {
        const bounded = clamp(value);
        if (bounded >= 97) {
            if (randomUnit(seed, salt) > 0.58) return 100;
            return 95 + Math.floor(randomUnit(seed, salt + 2) * 5);
        }
        if (randomUnit(seed, salt + 1) < 0.58) return Math.round(bounded / 5) * 5;
        return bounded;
    }

    function createCell(workSeed, floor, partIndex, completion, floorCount) {
        const sequenceFloor = floor;
        const cellSalt = floor * 131 + partIndex * 977;
        const sectionSpread = Math.max(2, floorCount * 0.2);
        const sectionOffset = randomRange(workSeed, 101 + partIndex * 17, -sectionSpread, sectionSpread);
        const sectionWave = Math.sin((partIndex + (workSeed % 7)) * 0.86) * Math.max(0.8, floorCount * 0.055);
        const nominalFront = 2.4 + floorCount * (completion / 100);
        const activityFront = Math.max(0.8, Math.min(floorCount + 2.5, nominalFront + sectionOffset + sectionWave));
        const distanceToFront = activityFront - sequenceFloor;
        const notApplicableRate = floorCount <= 5 ? 0.025 : 0.014;
        const applicabilityRoll = randomUnit(workSeed, 5000 + cellSalt);

        if (applicabilityRoll < notApplicableRate) {
            return { actual: null, plan: null, applicable: false, status: STATUS.NOT_APPLICABLE };
        }

        if (distanceToFront < -0.65) {
            return { actual: null, plan: null, applicable: true, status: STATUS.NO_DATA };
        }

        const activeDataGapRate = distanceToFront < 1.4 ? 0.075 : 0.018;
        if (randomUnit(workSeed, 7000 + cellSalt) < activeDataGapRate) {
            return { actual: null, plan: null, applicable: true, status: STATUS.NO_DATA };
        }

        const floorCluster = Math.floor((sequenceFloor - 1) / 3);
        const sectionCluster = Math.floor(partIndex / 2);
        const clusterSalt = 9000 + floorCluster * 61 + sectionCluster * 193;
        const clusterVariation = randomRange(workSeed, clusterSalt, -10, 10);
        const sectionVariation = randomRange(workSeed, 11000 + partIndex * 29, -14, 14);
        const localVariation = randomRange(workSeed, 13000 + cellSalt, -9, 9);
        const rawActual = 16 + distanceToFront * 19 + clusterVariation + sectionVariation + localVariation;
        const actual = roundProgress(rawActual, workSeed, 15000 + cellSalt);

        if (actual <= 0) {
            return { actual: null, plan: null, applicable: true, status: STATUS.NO_DATA };
        }

        if (actual >= 100) {
            return { actual: 100, plan: 100, applicable: true, status: STATUS.COMPLETED };
        }

        const lagRoll = randomUnit(workSeed, 17000 + cellSalt);
        const nearFrontPenalty = distanceToFront < 2 ? 0.08 : 0;
        const isDelayed = lagRoll < 0.16 + nearFrontPenalty;
        const planGap = isDelayed
            ? randomRange(workSeed, 19000 + cellSalt, 12, 24)
            : randomRange(workSeed, 21000 + cellSalt, 2, 10);
        const plan = Math.max(actual, roundProgress(actual + planGap, workSeed, 23000 + cellSalt));
        return { actual, plan, applicable: true, status: resolveStatus(actual, plan, true) };
    }

    function formatPlannedDate(index, isEnd) {
        const month = String(((index * 2 + (isEnd ? 5 : 1)) % 12) + 1).padStart(2, '0');
        const year = 2024 + Math.floor((index + (isEnd ? 8 : 0)) / 12);
        const day = isEnd ? '30' : String((index % 18) + 1).padStart(2, '0');
        return `${day}.${month}.${year}`;
    }

    function createWork(tuple, object, periodIndex, projectSeed, objectIndex, workIndex) {
        const [id, code, name, group, contractor, baseCompletion] = tuple;
        const completion = clamp(baseCompletion + objectIndex * 3 - periodIndex * 6 + (projectSeed % 5) - 2);
        const floors = Array.from({ length: object.floorCount }, (_, index) => index + 1);
        const sections = Array.from({ length: object.partCount }, (_, index) => ({ id: `part-${index + 1}`, name: `${object.partLabel} ${index + 1}` }));
        const cells = {};
        const workSeed = hash(`${projectSeed}:${object.id}:${id}`);
        floors.forEach((floor) => {
            sections.forEach((section, partIndex) => {
                cells[`${floor}:${section.id}`] = createCell(workSeed, floor, partIndex, completion, object.floorCount);
            });
        });
        return {
            id,
            code,
            name,
            group,
            contractor,
            plannedStart: formatPlannedDate(workIndex, false),
            plannedEnd: formatPlannedDate(workIndex, true),
            completion,
            floors,
            sections,
            cells
        };
    }

    function createPeriod(object, projectSeed, objectIndex, periodIndex) {
        const isPrevious = periodIndex === 1;
        const actual = clamp(object.actual + (projectSeed % 5) - 2 - (isPrevious ? 6 : 0));
        const baseGap = object.actual - object.plan;
        const plan = clamp(actual - baseGap);
        const dates = isPrevious
            ? { id: '2026-w29', label: '13.07–19.07.2026', startDate: '2026-07-13', endDate: '2026-07-19', updatedAt: '19.07.2026 18:00' }
            : { id: '2026-w30', label: '20.07–26.07.2026', startDate: '2026-07-20', endDate: '2026-07-26', updatedAt: '25.07.2026 09:30' };
        return {
            ...dates,
            summary: { actual, plan, deviation: actual - plan, updatedAt: dates.updatedAt },
            works: WORK_CATALOG.map((work, workIndex) => createWork(work, object, periodIndex, projectSeed, objectIndex, workIndex))
        };
    }

    function createProjectModel(projectId) {
        const projectSeed = hash(projectId);
        return {
            status: 'ready',
            projectId,
            objects: OBJECT_TEMPLATES.map((template, objectIndex) => ({
                ...template,
                projectId,
                periods: [createPeriod(template, projectSeed, objectIndex, 0), createPeriod(template, projectSeed, objectIndex, 1)]
            }))
        };
    }

    function resolveProjectId(context) {
        if (!context || context.type === 'bu') return null;
        if (context.type === 'project') return context.id || context.projectId || null;
        return context.projectId || null;
    }

    function getForContext(context) {
        const projectId = resolveProjectId(context);
        if (!projectId) {
            return {
                status: 'unsupported-context',
                projectId: null,
                title: 'Выберите проект',
                description: 'Цифровая шахматка строится для конкретного проекта. Вернитесь в сводный дашборд и выберите проект в дереве.'
            };
        }
        return createProjectModel(projectId);
    }

    function validate(model) {
        const errors = [];
        if (model.status !== 'ready') return errors;
        if (model.objects.length !== 5) errors.push('Ожидалось 5 объектов.');
        model.objects.forEach((object) => {
            object.periods.forEach((period) => {
                if (period.works.length !== 27) errors.push(`${object.id}/${period.id}: ожидалось 27 работ.`);
                const periodStatuses = new Set();
                period.works.forEach((work) => {
                    Object.values(work.cells).forEach((cell) => periodStatuses.add(cell.status));
                });
                Object.values(STATUS).forEach((status) => {
                    if (!periodStatuses.has(status)) errors.push(`${object.id}/${period.id}: отсутствует ${status}.`);
                });
            });
        });
        return errors;
    }

    window.digitalChessboardData = Object.freeze({ STATUS, getForContext, validate });
})(window);
