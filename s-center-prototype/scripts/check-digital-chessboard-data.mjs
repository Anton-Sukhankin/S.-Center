import { readFile } from 'node:fs/promises';
import { createContext, runInContext } from 'node:vm';
import { projectNodes } from '../src/data/project-tree.js';
import {
  createGroupWorks,
  GROUP_DEFINITIONS,
} from '../src/integrations/digital-chessboard/data/digital-chessboard-groups.js';

const FIXED_SECTION_QUEUE = Object.freeze({
  projectId: 'alkhimovo',
  queueId: 'queue-1',
  partCount: 15,
});

function objectContexts(nodes) {
  const contexts = [];
  function visit(node) {
    if (node.context?.objectId) contexts.push(node.context);
    (node.children || []).forEach(visit);
  }
  nodes.forEach(visit);
  return contexts;
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

function completionMetrics(works) {
  const positions = works
    .map((work, index) => (work.completion === 100 ? index : -1))
    .filter(index => index >= 0);
  const gaps = positions.slice(1).map((index, offset) => index - positions[offset] - 1);
  let run = 0;
  let maxRun = 0;
  works.forEach((work) => {
    run = work.completion === 100 ? run + 1 : 0;
    maxRun = Math.max(maxRun, run);
  });
  return {
    positions,
    gaps,
    maxRun,
    isPrefixCluster: positions.every((index, position) => index === position),
  };
}

function geometrySignature(object) {
  return (object.sections || []).map(section => `${section.id}:${section.floorCount}`).join('|');
}

export async function checkDigitalChessboardData() {
  const sandbox = createContext({ window: {} });
  const constructionObjectsSource = await readFile(
    new URL('../src/integrations/digital-chessboard/data/construction-objects-data.js', import.meta.url),
    'utf8',
  );
  const chessboardDataSource = await readFile(
    new URL('../src/integrations/digital-chessboard/data/digital-chessboard-data.js', import.meta.url),
    'utf8',
  );
  runInContext(constructionObjectsSource, sandbox, { filename: 'construction-objects-data.js' });
  runInContext(chessboardDataSource, sandbox, { filename: 'digital-chessboard-data.js' });

  const allContexts = objectContexts(projectNodes);
  const sampleIndexes = [
    0,
    Math.floor(allContexts.length / 3),
    Math.floor((allContexts.length * 2) / 3),
    allContexts.length - 1,
  ];
  const contexts = [...new Set(sampleIndexes)].map(index => allContexts[index]).filter(Boolean);
  const errors = [];
  const fixedSectionContexts = allContexts.filter(context => (
    context.projectId === FIXED_SECTION_QUEUE.projectId
    && context.id === FIXED_SECTION_QUEUE.queueId
  ));
  let groupCount = 0;
  let adjacentGroupCount = 0;
  let objectProfileCount = 0;
  let variableHeightResidentialCount = 0;
  const residentialSectionCounts = [];
  const contractorNames = new Set();

  GROUP_DEFINITIONS.forEach((definition) => {
    const start = parseDisplayDate(definition.start);
    const end = parseDisplayDate(definition.end);
    if (start === null || end === null) {
      errors.push(`${definition.id}: период группы содержит календарно недопустимую дату.`);
    } else if (start > end) {
      errors.push(`${definition.id}: начало периода группы следует после окончания.`);
    }
    if (definition.workItems.length < 23) {
      errors.push(`${definition.id}: определение группы должно владеть минимум 23 демонстрационными работами.`);
    }
    if (new Set(definition.workItems.map(work => work.id)).size !== definition.workItems.length) {
      errors.push(`${definition.id}: идентификаторы работ группы должны быть уникальны.`);
    }
  });

  if (fixedSectionContexts.length !== 3) {
    errors.push(`В первой очереди Алхимово ожидалось 3 дома, найдено ${fixedSectionContexts.length}.`);
  }
  fixedSectionContexts.forEach((context) => {
    const model = sandbox.window.digitalChessboardData.getForContext(context);
    const selectedObject = model.objects.find(object => object.id === context.objectId);
    if (!selectedObject) {
      errors.push(`${context.treeNodeId}: выбранный дом отсутствует в модели шахматки.`);
    } else if (selectedObject.partCount !== FIXED_SECTION_QUEUE.partCount) {
      errors.push(`${context.treeNodeId}: в первой очереди ожидается 15 секций, получено ${selectedObject.partCount}.`);
    }
  });

  contexts.forEach((context) => {
    const model = sandbox.window.digitalChessboardData.getForContext(context);
    const repeatedModel = sandbox.window.digitalChessboardData.getForContext(context);
    const { STATUS } = sandbox.window.digitalChessboardData;
    sandbox.window.digitalChessboardData.validate(model).forEach((error) => {
      errors.push(`${context.treeNodeId}: ${error}`);
    });
    model.objects.forEach((object) => {
      objectProfileCount += 1;
      if (object.type === 'residential') residentialSectionCounts.push(object.partCount);
      const owner = `${context.treeNodeId}/${object.id}`;
      const repeatedObject = repeatedModel.objects.find(item => item.id === object.id);
      const objectGeometry = geometrySignature(object);
      if (!repeatedObject || geometrySignature(repeatedObject) !== objectGeometry) {
        errors.push(`${owner}: геометрия секций нестабильна при повторной загрузке объекта.`);
      }
      if (!Array.isArray(object.sections) || object.sections.length !== object.partCount) {
        errors.push(`${owner}: у каждой реальной секции должна быть объектная геометрия.`);
      }
      const sectionHeights = (object.sections || []).map(section => section.floorCount);
      if (sectionHeights.some(height => !Number.isInteger(height) || height < 1 || height > object.floorCount)) {
        errors.push(`${owner}: этажность секции выходит за диапазон 1–${object.floorCount}.`);
      }
      if (sectionHeights.length && Math.max(...sectionHeights) !== object.floorCount) {
        errors.push(`${owner}: общий набор строк не достигает максимальной этажности объекта.`);
      }
      if (object.type === 'residential' && new Set(sectionHeights).size > 1) {
        variableHeightResidentialCount += 1;
      }
      const expectedExistingCellCount = sectionHeights.reduce((sum, height) => sum + height, 0);
      const period = object?.periods?.[0];
      if (!period) {
        errors.push(`${context.treeNodeId}/${object.id}: отсутствует текущий период.`);
        return;
      }
      period.works.forEach((work) => {
        contractorNames.add(work.contractor);
        if (!/^ООО «[^»]+»$/.test(work.contractor)) {
          errors.push(`${context.treeNodeId}/${object.id}/${work.id}: подрядчик «${work.contractor}» не содержит юридическую форму ООО.`);
        }
      });
      object.periods.forEach((objectPeriod) => {
        objectPeriod.works.forEach((work) => {
          const workOwner = `${owner}/${objectPeriod.id}/${work.id}`;
          if (geometrySignature(work) !== objectGeometry) {
            errors.push(`${workOwner}: геометрия секций отличается от геометрии объекта.`);
          }
          let readinessCellCount = 0;
          (object.sections || []).forEach((section) => {
            for (let floor = 1; floor <= object.floorCount; floor += 1) {
              const cell = work.cells[`${floor}:${section.id}`];
              if (!cell) {
                errors.push(`${workOwner}/${floor}:${section.id}: ячейка отсутствует в data-layer.`);
                continue;
              }
              if (floor > section.floorCount) {
                if (cell.applicable || cell.status !== STATUS.NOT_APPLICABLE || cell.lastChange) {
                  errors.push(`${workOwner}/${floor}:${section.id}: этаж выше секции должен быть физически отсутствующим и нередактируемым.`);
                }
              } else {
                readinessCellCount += 1;
                if (!cell.applicable || cell.status === STATUS.NOT_APPLICABLE) {
                  errors.push(`${workOwner}/${floor}:${section.id}: существующее пересечение не должно выглядеть физически отсутствующим.`);
                }
                if (work.completion === 100 && cell.status !== STATUS.COMPLETED) {
                  errors.push(`${workOwner}/${floor}:${section.id}: применимая ячейка завершённой работы должна иметь статус completed.`);
                }
              }
            }
          });
          if (readinessCellCount !== expectedExistingCellCount) {
            errors.push(`${workOwner}: в готовности ожидается ${expectedExistingCellCount} существующих пересечений, получено ${readinessCellCount}.`);
          }
        });
      });
      const workCount = Math.min(period.works.length, Math.max(0, Number(object.workCount) || 0));

      GROUP_DEFINITIONS.forEach((definition) => {
        const works = createGroupWorks(
          definition,
          period.works,
          workCount,
          context.treeNodeId || context.objectId,
        );
        const metrics = completionMetrics(works);
        const owner = `${context.treeNodeId}/${object.id}/${definition.id}`;
        const ownedWorkIds = new Set(definition.workItems.map(work => work.id));
        groupCount += 1;
        if (metrics.gaps.includes(0)) adjacentGroupCount += 1;
        if (works.length !== workCount) errors.push(`${owner}: ожидается ${workCount} работ, получено ${works.length}.`);
        if (new Set(works.map(work => work.id)).size !== works.length) {
          errors.push(`${owner}: отображаемые работы группы должны иметь уникальные идентификаторы.`);
        }
        works.forEach((work) => {
          if (!ownedWorkIds.has(work.id)) {
            errors.push(`${owner}/${work.id}: работа не принадлежит определению выбранной группы.`);
          }
          if (work.group !== definition.name || !work.name.startsWith(`${definition.name} — `)) {
            errors.push(`${owner}/${work.id}: название или группа работы не соответствуют выбранной группе.`);
          }
          const plannedStart = parseDisplayDate(work.plannedStart);
          const plannedEnd = parseDisplayDate(work.plannedEnd);
          if (plannedStart === null || plannedEnd === null) {
            errors.push(`${owner}/${work.id}: плановый срок содержит календарно недопустимую дату.`);
          } else if (plannedStart > plannedEnd) {
            errors.push(`${owner}/${work.id}: начало планового срока следует после окончания.`);
          }
        });
        if (metrics.positions.length !== object.completeWorkCount) {
          errors.push(`${owner}: ожидается ${object.completeWorkCount} завершённых работ, получено ${metrics.positions.length}.`);
        }
        if (metrics.isPrefixCluster) errors.push(`${owner}: завершённые работы образуют блок в начале списка.`);
        if (metrics.maxRun > 2) errors.push(`${owner}: подряд отображается более двух завершённых работ.`);
        if (!metrics.gaps.some(gap => gap === 1 || gap === 2)) {
          errors.push(`${owner}: нет промежутка из одной или двух незавершённых работ.`);
        }
      });
    });
  });

  if (!adjacentGroupCount) errors.push('Ни в одной группе нет допустимой пары соседних завершённых работ.');
  const uniqueResidentialSectionCounts = [...new Set(residentialSectionCounts)].sort((left, right) => left - right);
  if (residentialSectionCounts.some(count => count < 4 || count > 15)) {
    errors.push('Количество секций жилого дома выходит за диапазон 4–15.');
  }
  if (uniqueResidentialSectionCounts.length < 4) {
    errors.push(`Недостаточное разнообразие секций жилых домов: ${uniqueResidentialSectionCounts.join(', ')}.`);
  }
  if (!variableHeightResidentialCount) {
    errors.push('Ни один демонстрационный жилой объект не содержит секции различной этажности.');
  }
  const contractorLengths = [...contractorNames].map(name => name.length);
  const uniqueContractorLengths = new Set(contractorLengths);
  const shortestContractor = Math.min(...contractorLengths);
  const longestContractor = Math.max(...contractorLengths);
  if (contractorNames.size < 20 || uniqueContractorLengths.size < 10) {
    errors.push(`Недостаточное разнообразие подрядчиков: ${contractorNames.size} названий, ${uniqueContractorLengths.size} вариантов длины.`);
  }
  if (shortestContractor > 14 || longestContractor < 36) {
    errors.push(`Диапазон длины подрядчиков не включает короткие и длинные значения: ${shortestContractor}–${longestContractor} символов.`);
  }
  if (errors.length) throw new Error(`Проверка распределения завершённых работ:\n${errors.join('\n')}`);
  console.log(`Данные шахматки: ${contexts.length} контекста, ${objectProfileCount} профилей объектов, ${variableHeightResidentialCount} жилых профилей с переменной этажностью, ${groupCount} групп с явной принадлежностью и допустимыми календарными сроками, ${adjacentGroupCount} групп с допустимой соседней парой завершённых работ; ${contractorNames.size} подрядчиков ООО длиной ${shortestContractor}–${longestContractor} символов; первая очередь Алхимово: 15 секций в ${fixedSectionContexts.length} домах; остальные проверенные профили: ${uniqueResidentialSectionCounts.join(', ')} секций.`);
}
