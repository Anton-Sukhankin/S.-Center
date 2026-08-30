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

    const DEMO_USERS = Object.freeze([
        Object.freeze({ displayName: 'Соколова Мария Андреевна', login: 'm.sokolova' }),
        Object.freeze({ displayName: 'Воронов Алексей Игоревич', login: 'a.voronov' }),
        Object.freeze({ displayName: 'Белова Ирина Павловна', login: 'i.belova' }),
        Object.freeze({ displayName: 'Орлов Денис Сергеевич', login: 'd.orlov' })
    ]);

    if (!window.constructionObjectsData || typeof window.constructionObjectsData.getAll !== 'function') {
        throw new Error('Construction object identity catalog is not loaded.');
    }

    const OBJECT_GEOMETRY = Object.freeze({
        'house-1': Object.freeze({ floorCount: 37, partCount: 16, rowLabel: 'Этаж', partLabel: 'Секция', structure: '37 этажей · 16 секций', actual: 45, plan: 52 }),
        'house-2': Object.freeze({ floorCount: 24, partCount: 16, rowLabel: 'Этаж', partLabel: 'Секция', structure: '24 этажа · 16 секций', actual: 37, plan: 37 }),
        'house-3': Object.freeze({ floorCount: 44, partCount: 16, rowLabel: 'Этаж', partLabel: 'Секция', structure: '44 этажа · 16 секций', actual: 54, plan: 55 }),
        parking: Object.freeze({ floorCount: 5, partCount: 3, rowLabel: 'Уровень', partLabel: 'Зона', structure: '5 уровней · 3 зоны', actual: 64, plan: 66 }),
        kindergarten: Object.freeze({ floorCount: 3, partCount: 2, rowLabel: 'Этаж', partLabel: 'Корпус', structure: '3 этажа · 2 корпуса', actual: 82, plan: 82 })
    });
    const MIN_RESIDENTIAL_SECTION_COUNT = 4;
    const MAX_RESIDENTIAL_SECTION_COUNT = 15;
    const FIXED_SECTION_QUEUE = Object.freeze({
        projectId: 'alkhimovo',
        queueId: 'queue-1',
        partCount: 15
    });
    const SECTION_HEIGHT_TIERS = Object.freeze([0, 1, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 1, 0]);

    const OBJECT_TEMPLATES = window.constructionObjectsData.getAll().map((identity) => ({
        ...identity,
        ...OBJECT_GEOMETRY[identity.id]
    }));

    const WORK_CATALOG = [
        ['monolith', '1.1', 'Монолитные работы', 'Основные конструкции', 'ООО «СМУ-1»', 52],
        ['slabs', '1.2', 'Устройство перекрытий', 'Основные конструкции', 'ООО «Монолит»', 38],
        ['masonry', '2.1', 'Кладка наружных стен', 'Ограждающие конструкции', 'ООО «КладкаСтрой»', 31],
        ['partitions', '2.2', 'Внутренние перегородки', 'Ограждающие конструкции', 'ООО «ГородСтрой»', 24],
        ['facade', '3.1', 'Фасадные работы', 'Фасады', 'ООО «Фасадные решения»', 18],
        ['interior', '4.1', 'Внутренняя отделка', 'Отделочные работы', 'ООО «Группа интерьерных решений»', 12],
        ['rough-finish', '4.2', 'Черновая отделка', 'Отделочные работы', 'ООО «ОтделкаПрофи»', 28],
        ['fine-finish', '4.3', 'Чистовая отделка', 'Отделочные работы', 'ООО «МастерФиниш»', 16],
        ['internal-utilities', '5.1', 'Внутренние инженерные сети', 'Инженерные системы', 'ООО «Инженерные системы зданий»', 42],
        ['electrical', '5.2', 'Электромонтажные работы', 'Инженерные системы', 'ООО «ЭнергоМонтаж»', 55],
        ['low-current', '5.3', 'Слаботочные системы', 'Инженерные системы', 'ООО «Системы связи и автоматизации»', 33],
        ['ventilation', '5.4', 'Вентиляция', 'Инженерные системы', 'ООО «ВентСтрой»', 47],
        ['heating', '5.5', 'Отопление', 'Инженерные системы', 'ООО «ТеплоСервис»', 61],
        ['water-supply', '5.6', 'Водоснабжение и канализация', 'Инженерные системы', 'ООО «АкваМонтаж»', 50],
        ['elevators', '6.1', 'Лифтовое оборудование', 'Оборудование', 'ООО «Лифтовые технологии»', 27],
        ['commissioning', '6.2', 'Пусконаладочные работы', 'Оборудование', 'ООО «Пусконаладочная группа»', 15],
        ['roofing', '7.1', 'Кровельные работы', 'Кровля', 'ООО «КровляСтрой»', 74],
        ['parapets', '7.2', 'Устройство парапетов', 'Кровля', 'ООО «Высотные строительные решения»', 69],
        ['windows', '8.1', 'Окна и витражи', 'Светопрозрачные конструкции', 'ООО «Светопрозрачные конструкции»', 58],
        ['doors', '8.2', 'Установка дверей', 'Заполнение проемов', 'ООО «ДвериСтрой»', 46],
        ['balcony-railings', '8.3', 'Ограждения балконов', 'Металлоконструкции', 'ООО «Металлические конструкции»', 38],
        ['landscaping', '9.1', 'Благоустройство территории', 'Благоустройство', 'ООО «Городская среда и благоустройство»', 22],
        ['external-utilities', '9.2', 'Наружные инженерные сети', 'Благоустройство', 'ООО «Инженерные сети и коммуникации»', 65],
        ['road-surfaces', '9.3', 'Дорожные покрытия', 'Благоустройство', 'ООО «Дорожные покрытия»', 31],
        ['planting', '9.4', 'Озеленение', 'Благоустройство', 'ООО «Зелёный город»', 12],
        ['entrance-groups', '10.1', 'Входные группы', 'Завершающие работы', 'ООО «ФасадКомплект»', 44],
        ['handover-cleaning', '10.2', 'Уборка и подготовка к сдаче', 'Завершающие работы', 'ООО «КлинингСтрой»', 7]
    ];

    const COMPLETE_WORK_DISTANCE_PATTERNS = Object.freeze({
        3: Object.freeze([[1, 2], [2, 1], [3, 1]]),
        4: Object.freeze([[1, 2, 1], [2, 1, 3], [1, 3, 1]]),
        5: Object.freeze([[1, 2, 1, 3], [2, 1, 3, 1], [1, 3, 1, 2]]),
        6: Object.freeze([[1, 2, 1, 3, 1], [2, 1, 3, 1, 2], [1, 3, 1, 2, 1]]),
        7: Object.freeze([[1, 2, 1, 3, 1, 2], [2, 1, 3, 1, 2, 1], [1, 3, 1, 2, 1, 3]])
    });

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

    function createCompleteWorkIndexes(totalWorkCount, completeWorkCount, seed) {
        const safeTotal = Math.max(0, Math.floor(totalWorkCount));
        const safeCount = Math.max(0, Math.min(safeTotal, Math.floor(completeWorkCount)));
        if (!safeCount) return [];
        if (safeCount === 1) return [Math.floor(randomUnit(seed, 41001) * safeTotal)];

        const patterns = COMPLETE_WORK_DISTANCE_PATTERNS[safeCount];
        if (!patterns) {
            const step = Math.max(1, Math.floor(safeTotal / safeCount));
            return Array.from({ length: safeCount }, (_, index) => Math.min(safeTotal - 1, index * step));
        }

        const pattern = patterns[seed % patterns.length];
        const span = pattern.reduce((sum, distance) => sum + distance, 0);
        const maxStart = Math.max(0, safeTotal - 1 - span);
        const start = Math.floor(randomUnit(seed, 41002) * (maxStart + 1));
        const indexes = [start];
        pattern.forEach((distance) => indexes.push(indexes[indexes.length - 1] + distance));
        return indexes;
    }

    function createWorkProfile(context, objectTemplate) {
        const objectId = objectTemplate.id;
        const selectionId = context?.treeNodeId || `${resolveProjectId(context)}:${objectId}`;
        const identity = `${selectionId}:${objectId}`;
        const completeWorkCount = 3 + (hash(`${identity}:complete`) % 5);
        const usesFixedSectionCount = context?.projectId === FIXED_SECTION_QUEUE.projectId
            && context?.id === FIXED_SECTION_QUEUE.queueId;
        const partCount = objectTemplate.type === 'residential'
            ? usesFixedSectionCount
                ? FIXED_SECTION_QUEUE.partCount
                : MIN_RESIDENTIAL_SECTION_COUNT
                    + (hash(`${identity}:sections`) % (MAX_RESIDENTIAL_SECTION_COUNT - MIN_RESIDENTIAL_SECTION_COUNT + 1))
            : objectTemplate.partCount;
        return {
            workCount: 12 + (hash(identity) % 12),
            completeWorkCount,
            partCount,
            structure: objectTemplate.type === 'residential'
                ? `${objectTemplate.floorCount} этажей · ${partCount} секций`
                : objectTemplate.structure,
            completeWorkIndexes: createCompleteWorkIndexes(
                WORK_CATALOG.length,
                completeWorkCount,
                hash(`${identity}:complete-layout`)
            )
        };
    }

    function createSectionGeometry(context, object) {
        const partCount = Math.max(0, Math.floor(Number(object.partCount) || 0));
        const floorCount = Math.max(1, Math.floor(Number(object.floorCount) || 1));
        const selectionId = context?.treeNodeId || `${resolveProjectId(context)}:${object.id}`;
        const anchor = partCount ? hash(`${selectionId}:${object.id}:section-height-anchor`) % partCount : 0;
        const tierStep = floorCount >= 36 ? 4 : floorCount >= 24 ? 3 : floorCount >= 12 ? 2 : 1;
        return Array.from({ length: partCount }, (_, index) => {
            const distanceFromAnchor = (index - anchor + partCount) % partCount;
            const tier = SECTION_HEIGHT_TIERS[distanceFromAnchor % SECTION_HEIGHT_TIERS.length];
            return {
                id: `part-${index + 1}`,
                name: `${object.partLabel} ${index + 1}`,
                floorCount: Math.max(1, floorCount - tier * tierStep)
            };
        });
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

    function createLastChange(seed, salt) {
        const user = DEMO_USERS[Math.floor(randomUnit(seed, salt) * DEMO_USERS.length) % DEMO_USERS.length];
        const day = 20 + Math.floor(randomUnit(seed, salt + 1) * 7);
        const hour = 8 + Math.floor(randomUnit(seed, salt + 2) * 11);
        const minute = Math.floor(randomUnit(seed, salt + 3) * 12) * 5;
        return {
            changedBy: { ...user },
            changedAt: `2026-08-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+03:00`
        };
    }

    function withLastChange(cell, seed, salt) {
        if (![STATUS.IN_PROGRESS, STATUS.COMPLETED, STATUS.DELAYED].includes(cell.status)) return cell;
        return { ...cell, lastChange: createLastChange(seed, salt) };
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
            return withLastChange(
                { actual: 100, plan: 100, applicable: true, status: STATUS.COMPLETED },
                workSeed,
                25000 + cellSalt
            );
        }

        const lagRoll = randomUnit(workSeed, 17000 + cellSalt);
        const nearFrontPenalty = distanceToFront < 2 ? 0.08 : 0;
        const isDelayed = lagRoll < 0.16 + nearFrontPenalty;
        const planGap = isDelayed
            ? randomRange(workSeed, 19000 + cellSalt, 12, 24)
            : randomRange(workSeed, 21000 + cellSalt, 2, 10);
        const plan = Math.max(actual, roundProgress(actual + planGap, workSeed, 23000 + cellSalt));
        return withLastChange(
            { actual, plan, applicable: true, status: resolveStatus(actual, plan, true) },
            workSeed,
            27000 + cellSalt
        );
    }

    function formatPlannedDate(index, isEnd) {
        const monthNumber = ((index * 2 + (isEnd ? 5 : 1)) % 12) + 1;
        const month = String(monthNumber).padStart(2, '0');
        const year = 2024 + Math.floor((index + (isEnd ? 8 : 0)) / 12);
        const dayNumber = isEnd
            ? new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
            : (index % 18) + 1;
        const day = String(dayNumber).padStart(2, '0');
        return `${day}.${month}.${year}`;
    }

    function parseDisplayDate(value) {
        const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(value));
        if (!match) return null;
        const [, dayValue, monthValue, yearValue] = match;
        const day = Number(dayValue);
        const month = Number(monthValue);
        const year = Number(yearValue);
        const timestamp = Date.UTC(year, month - 1, day);
        const parsed = new Date(timestamp);
        return parsed.getUTCFullYear() === year
            && parsed.getUTCMonth() === month - 1
            && parsed.getUTCDate() === day
            ? timestamp
            : null;
    }

    function createWork(tuple, object, periodIndex, projectSeed, objectIndex, workIndex) {
        const [id, code, name, group, contractor, baseCompletion] = tuple;
        const isComplete = object.completeWorkIndexes.includes(workIndex);
        const completion = isComplete
            ? 100
            : clamp(baseCompletion + objectIndex * 3 - periodIndex * 6 + (projectSeed % 5) - 2);
        const floors = Array.from({ length: object.floorCount }, (_, index) => index + 1);
        const sections = object.sections.map((section) => ({ ...section }));
        const cells = {};
        const workSeed = hash(`${projectSeed}:${object.id}:${id}`);
        floors.forEach((floor) => {
            sections.forEach((section, partIndex) => {
                const cell = floor > section.floorCount
                    ? { actual: null, plan: null, applicable: false, status: STATUS.NOT_APPLICABLE }
                    : createCell(workSeed, floor, partIndex, completion, object.floorCount);
                cells[`${floor}:${section.id}`] = isComplete && cell.applicable
                    ? withLastChange(
                        { actual: 100, plan: 100, applicable: true, status: STATUS.COMPLETED },
                        workSeed,
                        31000 + floor * 131 + partIndex * 977
                    )
                    : cell;
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

    function createProjectModel(projectId, context) {
        const projectSeed = hash(projectId);
        return {
            status: 'ready',
            projectId,
            objects: OBJECT_TEMPLATES.map((template, objectIndex) => {
                const objectWithoutSections = {
                    ...template,
                    ...createWorkProfile(context, template),
                    projectId
                };
                const object = {
                    ...objectWithoutSections,
                    sections: createSectionGeometry(context, objectWithoutSections)
                };
                return {
                    ...object,
                    periods: [createPeriod(object, projectSeed, objectIndex, 0), createPeriod(object, projectSeed, objectIndex, 1)]
                };
            })
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
        return createProjectModel(projectId, context);
    }

    function validate(model) {
        const errors = [];
        if (model.status !== 'ready') return errors;
        if (model.objects.length !== 5) errors.push('Ожидалось 5 объектов.');
        model.objects.forEach((object) => {
            if (object.type === 'residential'
                && (object.partCount < MIN_RESIDENTIAL_SECTION_COUNT || object.partCount > MAX_RESIDENTIAL_SECTION_COUNT)) {
                errors.push(`${object.id}: количество секций жилого дома должно находиться в диапазоне 4–15.`);
            }
            if (object.workCount < 12 || object.workCount > 23) {
                errors.push(`${object.id}: количество работ должно находиться в диапазоне 12–23.`);
            }
            if (object.completeWorkCount < 3 || object.completeWorkCount > 7) {
                errors.push(`${object.id}: количество завершённых работ должно находиться в диапазоне 3–7.`);
            }
            if (!Array.isArray(object.sections) || object.sections.length !== object.partCount) {
                errors.push(`${object.id}: геометрия секций не соответствует количеству частей объекта.`);
            } else {
                object.sections.forEach((section) => {
                    if (!Number.isInteger(section.floorCount) || section.floorCount < 1 || section.floorCount > object.floorCount) {
                        errors.push(`${object.id}/${section.id}: этажность секции должна быть целым числом от 1 до ${object.floorCount}.`);
                    }
                });
                if (Math.max(...object.sections.map(section => section.floorCount)) !== object.floorCount) {
                    errors.push(`${object.id}: максимальная этажность секций должна совпадать с этажностью объекта.`);
                }
            }
            object.periods.forEach((period) => {
                if (period.works.length !== 27) errors.push(`${object.id}/${period.id}: ожидалось 27 работ.`);
                const completeWorkCount = period.works.filter(work => work.completion === 100).length;
                if (completeWorkCount !== object.completeWorkCount) {
                    errors.push(`${object.id}/${period.id}: ожидалось ${object.completeWorkCount} завершённых работ, получено ${completeWorkCount}.`);
                }
                const completeWorkIndexes = period.works
                    .map((work, index) => (work.completion === 100 ? index : -1))
                    .filter(index => index >= 0);
                const incompleteGaps = completeWorkIndexes
                    .slice(1)
                    .map((index, offset) => index - completeWorkIndexes[offset] - 1);
                const hasPrefixCluster = completeWorkIndexes.every((index, position) => index === position);
                if (hasPrefixCluster) {
                    errors.push(`${object.id}/${period.id}: завершённые работы не должны образовывать непрерывный блок в начале списка.`);
                }
                if (!incompleteGaps.some(gap => gap === 1 || gap === 2)) {
                    errors.push(`${object.id}/${period.id}: между завершёнными работами ожидается хотя бы один промежуток из одной или двух незавершённых работ.`);
                }
                const maxCompleteRun = completeWorkIndexes.reduce((state, index) => ({
                    previous: index,
                    current: index === state.previous + 1 ? state.current + 1 : 1,
                    max: Math.max(state.max, index === state.previous + 1 ? state.current + 1 : 1)
                }), { previous: Number.NEGATIVE_INFINITY, current: 0, max: 0 }).max;
                if (maxCompleteRun > 2) {
                    errors.push(`${object.id}/${period.id}: подряд допускается не более двух завершённых работ.`);
                }
                const periodStatuses = new Set();
                period.works.forEach((work) => {
                    const plannedStart = parseDisplayDate(work.plannedStart);
                    const plannedEnd = parseDisplayDate(work.plannedEnd);
                    if (plannedStart === null || plannedEnd === null) {
                        errors.push(`${object.id}/${period.id}/${work.id}: плановый срок содержит календарно недопустимую дату.`);
                    } else if (plannedStart > plannedEnd) {
                        errors.push(`${object.id}/${period.id}/${work.id}: начало планового срока следует после окончания.`);
                    }
                    const workGeometry = work.sections.map(section => `${section.id}:${section.floorCount}`).join('|');
                    const objectGeometry = object.sections.map(section => `${section.id}:${section.floorCount}`).join('|');
                    if (workGeometry !== objectGeometry) {
                        errors.push(`${object.id}/${period.id}/${work.id}: геометрия секций отличается от геометрии объекта.`);
                    }
                    Object.values(work.cells).forEach((cell) => {
                        periodStatuses.add(cell.status);
                        if ([STATUS.IN_PROGRESS, STATUS.COMPLETED, STATUS.DELAYED].includes(cell.status)) {
                            if (!cell.lastChange?.changedBy?.displayName || !cell.lastChange?.changedBy?.login || !cell.lastChange?.changedAt) {
                                errors.push(`${object.id}/${period.id}/${work.id}: для рабочего статуса отсутствуют демонстрационные метаданные изменения.`);
                            } else if (cell.lastChange.changedBy.displayName.trim().split(/\s+/).length !== 3) {
                                errors.push(`${object.id}/${period.id}/${work.id}: автор последнего изменения должен быть указан в формате «Фамилия Имя Отчество».`);
                            }
                        }
                    });
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
