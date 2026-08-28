import { readFile } from 'node:fs/promises';
import { createContext, runInContext } from 'node:vm';
import { projectNodes } from '../src/data/project-tree.js';
import { GROUP_DEFINITIONS } from '../src/integrations/digital-chessboard/data/digital-chessboard-groups.js';

const FIXED_SECTION_QUEUE = Object.freeze({
  projectId: 'alkhimovo',
  queueId: 'queue-1',
  partCount: 15,
});

function stableBucket(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function objectContexts(nodes) {
  const contexts = [];
  function visit(node) {
    if (node.context?.objectId) contexts.push(node.context);
    (node.children || []).forEach(visit);
  }
  nodes.forEach(visit);
  return contexts;
}

function displayedWorks(period, context, definition, workCount, completedIndexes) {
  const bridgeCapacity = Math.max(0, workCount - completedIndexes.length - 2);
  const gaps = completedIndexes.slice(1).map((index, offset) => ({
    start: completedIndexes[offset] + 1,
    end: index - 1,
  })).filter(gap => gap.start <= gap.end);
  const bridgeIndexes = [];
  gaps.forEach((gap) => {
    if (bridgeIndexes.length < bridgeCapacity) bridgeIndexes.push(gap.start);
  });
  for (let depth = 1; bridgeIndexes.length < bridgeCapacity; depth += 1) {
    let added = false;
    gaps.forEach((gap) => {
      const index = gap.start + depth;
      if (bridgeIndexes.length < bridgeCapacity && index <= gap.end) {
        bridgeIndexes.push(index);
        added = true;
      }
    });
    if (!added) break;
  }
  const selectedIndexes = new Set([...completedIndexes, ...bridgeIndexes]);
  definition.workIndexes.forEach((index) => {
    if (selectedIndexes.size < workCount) selectedIndexes.add(index);
  });
  const startIndex = stableBucket(`${context.treeNodeId || context.objectId}:${definition.id}`) % period.works.length;
  for (let offset = 0; selectedIndexes.size < workCount && offset < period.works.length; offset += 1) {
    selectedIndexes.add((startIndex + offset) % period.works.length);
  }
  return period.works.filter((_work, index) => selectedIndexes.has(index)).slice(0, workCount);
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
  const residentialSectionCounts = [];
  const contractorNames = new Set();

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
    sandbox.window.digitalChessboardData.validate(model).forEach((error) => {
      errors.push(`${context.treeNodeId}: ${error}`);
    });
    model.objects.forEach((object) => {
      objectProfileCount += 1;
      if (object.type === 'residential') residentialSectionCounts.push(object.partCount);
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
      const workCount = Math.min(period.works.length, Math.max(0, Number(object.workCount) || 0));
      const completedIndexes = period.works
        .map((work, index) => (work.completion === 100 ? index : -1))
        .filter(index => index >= 0);

      GROUP_DEFINITIONS.forEach((definition) => {
        const works = displayedWorks(period, context, definition, workCount, completedIndexes);
        const metrics = completionMetrics(works);
        const owner = `${context.treeNodeId}/${object.id}/${definition.id}`;
        groupCount += 1;
        if (metrics.gaps.includes(0)) adjacentGroupCount += 1;
        if (works.length !== workCount) errors.push(`${owner}: ожидается ${workCount} работ, получено ${works.length}.`);
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
  console.log(`Распределение завершённых работ: ${contexts.length} контекста, ${objectProfileCount} профилей объектов, ${groupCount} групп, ${adjacentGroupCount} групп с допустимой соседней парой; ${contractorNames.size} подрядчиков ООО длиной ${shortestContractor}–${longestContractor} символов; первая очередь Алхимово: 15 секций в ${fixedSectionContexts.length} домах; остальные проверенные профили: ${uniqueResidentialSectionCounts.join(', ')} секций.`);
}
