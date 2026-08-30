const DATE_RANGES = Object.freeze([
  ['01.02.2026', '30.09.2026'],
  ['15.03.2026', '31.10.2026'],
  ['01.05.2026', '20.12.2026'],
  ['15.06.2026', '28.02.2027'],
  ['01.09.2026', '30.04.2027'],
]);

const WORK_PHASE_LABELS = Object.freeze([
  'Подготовка рабочей документации',
  'Подготовка фронта работ',
  'Входной контроль материалов',
  'Организация рабочей зоны',
  ...Array.from({ length: 15 }, (_, index) => `Этап выполнения ${String(index + 1).padStart(2, '0')}`),
  'Операционный контроль качества',
  'Устранение замечаний',
  'Исполнительная документация',
  'Приёмка выполненных работ',
]);

const GROUP_CATALOG = Object.freeze([
  ['structure', 'Конструктив здания', 'Фундамент, несущий каркас, перекрытия и наружные стены здания.'],
  ['engineering', 'Внутренние инженерные системы', 'Монтаж основных инженерных систем внутри объекта строительства.'],
  ['finishing', 'Отделочные работы', 'Подготовка и финишная отделка помещений и мест общего пользования.'],
  ['earthworks', 'Земляные работы', 'Разработка котлована, вывоз грунта и подготовка основания.'],
  ['foundations', 'Фундаменты', 'Свайное поле, ростверки, фундаментные плиты и гидроизоляция.'],
  ['monolith', 'Монолитный каркас', 'Вертикальные конструкции, перекрытия и лестничные марши.'],
  ['external-walls', 'Наружные стены', 'Кладка наружных стен и устройство ограждающих конструкций.'],
  ['roofing', 'Кровля', 'Пароизоляция, утепление, покрытие и водоотведение кровли.'],
  ['facades', 'Фасады', 'Подсистема, утепление и облицовка фасадов здания.'],
  ['glazing', 'Светопрозрачные конструкции', 'Окна, витражи, входные группы и наружное остекление.'],
  ['partitions', 'Внутренние перегородки', 'Кладка и монтаж внутренних стен и перегородок.'],
  ['rough-finish', 'Черновая отделка', 'Штукатурка, стяжка и подготовка поверхностей помещений.'],
  ['fine-finish', 'Чистовая отделка', 'Финишная отделка квартир и технических помещений.'],
  ['common-areas', 'Места общего пользования', 'Отделка холлов, коридоров, лестниц и входных зон.'],
  ['water-supply', 'Внутреннее водоснабжение', 'Магистрали, стояки и внутренние системы водоснабжения.'],
  ['sewerage', 'Канализация', 'Внутренние сети хозяйственно-бытовой и ливневой канализации.'],
  ['heating', 'Отопление', 'Тепловые пункты, магистрали и отопительные приборы.'],
  ['ventilation', 'Вентиляция', 'Воздуховоды, оборудование и системы дымоудаления.'],
  ['cooling', 'Холодоснабжение', 'Холодильные контуры и оборудование систем кондиционирования.'],
  ['electrical', 'Электроснабжение', 'Силовые сети, щитовое оборудование и освещение.'],
  ['low-current', 'Слаботочные системы', 'Связь, диспетчеризация, видеонаблюдение и контроль доступа.'],
  ['automation', 'Автоматизация', 'Автоматизация инженерного оборудования и диспетчеризация.'],
  ['fire-safety', 'Пожарная безопасность', 'Пожарная сигнализация, оповещение и внутренний водопровод.'],
  ['elevators', 'Лифтовое оборудование', 'Монтаж, отделка и пусконаладка лифтового оборудования.'],
  ['external-utilities', 'Наружные сети', 'Внешние сети водоснабжения, канализации и электроснабжения.'],
  ['landscaping', 'Благоустройство', 'Озеленение, малые формы и наружное освещение территории.'],
  ['roads', 'Дорожные работы', 'Проезды, тротуары, парковочные места и бортовой камень.'],
  ['parking', 'Паркинг', 'Конструкции, инженерные системы и разметка паркинга.'],
  ['commissioning', 'Пусконаладочные работы', 'Комплексная проверка и настройка инженерных систем.'],
  ['as-built-docs', 'Исполнительная документация', 'Комплектация схем, актов и исполнительных комплектов.'],
  ['handover', 'Передача помещений', 'Осмотры, устранение замечаний и передача помещений.'],
  ['completion', 'Завершение строительства', 'Итоговые проверки, благоустройство и подготовка объекта к вводу.'],
]);

function stableBucket(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function completionBridgeIndexes(completedIndexes, capacity) {
  if (capacity <= 0) return [];
  const gaps = completedIndexes.slice(1).map((index, offset) => ({
    start: completedIndexes[offset] + 1,
    end: index - 1,
  })).filter(gap => gap.start <= gap.end);
  const bridges = [];

  gaps.forEach((gap) => {
    if (bridges.length < capacity) bridges.push(gap.start);
  });
  for (let depth = 1; bridges.length < capacity; depth += 1) {
    let added = false;
    gaps.forEach((gap) => {
      const index = gap.start + depth;
      if (bridges.length < capacity && index <= gap.end) {
        bridges.push(index);
        added = true;
      }
    });
    if (!added) break;
  }
  return bridges;
}

function createWorkItems(groupId, groupName, groupIndex) {
  return Object.freeze(WORK_PHASE_LABELS.map((phase, phaseIndex) => Object.freeze({
    id: `${groupId}-work-${String(phaseIndex + 1).padStart(2, '0')}`,
    code: `${groupIndex + 1}.${phaseIndex + 1}`,
    name: `${groupName} — ${phase.toLocaleLowerCase('ru-RU')}`,
  })));
}

export const GROUP_DEFINITIONS = Object.freeze(GROUP_CATALOG.map((group, index) => {
  const [id, name, description] = group;
  const [start, end] = DATE_RANGES[index % DATE_RANGES.length];
  return Object.freeze({
    id,
    name,
    description,
    start,
    end,
    workItems: createWorkItems(id, name, index),
  });
}));

export function createGroupWorks(definition, sourceWorks, requestedWorkCount, identity) {
  if (!definition || !Array.isArray(sourceWorks) || !sourceWorks.length) return [];
  const workCount = Math.min(
    definition.workItems.length,
    sourceWorks.length,
    Math.max(0, Number(requestedWorkCount) || 0),
  );
  const completedIndexes = sourceWorks
    .map((work, index) => (work.completion === 100 ? index : -1))
    .filter(index => index >= 0);
  const bridgeCapacity = Math.max(0, workCount - completedIndexes.length - 2);
  const selectedIndexes = new Set([
    ...completedIndexes,
    ...completionBridgeIndexes(completedIndexes, bridgeCapacity),
  ]);
  const startIndex = stableBucket(`${identity}:${definition.id}`) % sourceWorks.length;
  for (let offset = 0; selectedIndexes.size < workCount && offset < sourceWorks.length; offset += 1) {
    selectedIndexes.add((startIndex + offset) % sourceWorks.length);
  }
  const fixtureWorks = sourceWorks
    .filter((_work, index) => selectedIndexes.has(index))
    .slice(0, workCount);

  return definition.workItems.slice(0, workCount).map((workItem, index) => ({
    ...fixtureWorks[index],
    ...workItem,
    group: definition.name,
  }));
}
