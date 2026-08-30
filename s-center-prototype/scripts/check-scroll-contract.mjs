import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const contractRoot = join(projectRoot, 'docs', 'digital-chessboard', 'scroll-contract');
const featureRoot = join(projectRoot, 'src', 'integrations', 'digital-chessboard', 'feature');
const requirementGroups = ['SCROLL', 'SMOOTH', 'STICKY', 'WEB', 'LIFE'];
const acceptanceGroups = ['AC-SCROLL', 'AC-STICKY', 'AC-LIFE'];

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  values.forEach(value => (seen.has(value) ? repeated.add(value) : seen.add(value)));
  return [...repeated].sort();
}

function expandRanges(text, prefixes, digits) {
  const ids = new Set();
  const prefixPattern = prefixes.join('|');
  const rangePattern = new RegExp(
    '`(' + prefixPattern + ')-(\\d{' + digits + '})`[–-]`(?:\\1-)?(\\d{' + digits + '})`',
    'g',
  );
  const singlePattern = new RegExp(
    '`(' + prefixPattern + ')-(\\d{' + digits + '})`',
    'g',
  );

  for (const match of text.matchAll(rangePattern)) {
    const [, prefix, startText, endText] = match;
    const start = Number(startText);
    const end = Number(endText);
    for (let value = start; value <= end; value += 1) {
      ids.add(`${prefix}-${String(value).padStart(digits, '0')}`);
    }
  }
  for (const match of text.matchAll(singlePattern)) ids.add(`${match[1]}-${match[2]}`);
  return ids;
}

function assertContiguous(ids, prefix, digits, issues, separator = '-') {
  const marker = `${prefix}${separator}`;
  const numbers = ids
    .filter(id => id.startsWith(marker))
    .map(id => Number(id.slice(marker.length)))
    .sort((a, b) => a - b);
  if (!numbers.length) {
    issues.push(`не найдены идентификаторы ${prefix}`);
    return;
  }
  for (let value = 1; value <= numbers.at(-1); value += 1) {
    if (!numbers.includes(value)) issues.push(`пропущен идентификатор ${marker}${String(value).padStart(digits, '0')}`);
  }
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function sourceNumericConstant(source, name) {
  const match = source.match(new RegExp(`const ${name} = (-?\\d+(?:\\.\\d+)?);`));
  return match ? Number(match[1]) : Number.NaN;
}

function sourceCssPixels(source, name) {
  const match = source.match(new RegExp(`${name}:\\s*(-?\\d+(?:\\.\\d+)?)px`));
  return match ? Number(match[1]) : Number.NaN;
}

function executeKinematicsVector(vector, constants) {
  const input = vector.input;
  switch (vector.operation) {
    case 'normalizeWheelDelta':
      return {
        deltaPx: input.deltaMode === 1
          ? input.deltaY * constants.wheelLinePixels
          : input.deltaMode === 2
            ? input.deltaY * input.pageHeightPx
            : input.deltaY,
      };
    case 'routeBasicDelta': {
      const innerStart = clamp(input.innerStartPx, 0, input.innerMaximumPx);
      const innerTarget = clamp(innerStart + input.deltaPx, 0, input.innerMaximumPx);
      const outerRemainder = input.deltaPx - (innerTarget - innerStart);
      const outerTarget = clamp(
        input.outerStartPx + outerRemainder,
        0,
        input.outerMaximumPx,
      );
      return {
        innerTargetPx: innerTarget,
        outerTargetPx: outerTarget,
        unappliedDeltaPx: outerRemainder - (outerTarget - input.outerStartPx),
      };
    }
    case 'splitCoupledUpwardDelta': {
      const matrixCapacity = Math.max(0, input.matrixCapacityPx);
      const expansionCapacity = Math.max(0, input.expansionCapacityPx);
      const coupledCapacity = matrixCapacity + expansionCapacity;
      if (input.deltaPx >= 0 || matrixCapacity <= 0 || expansionCapacity <= 0 || coupledCapacity <= 0) {
        return {
          coupledDistancePx: 0,
          matrixDistancePx: 0,
          expansionDistancePx: 0,
          remainingDeltaPx: input.deltaPx,
        };
      }
      const coupledDistance = Math.min(-input.deltaPx, coupledCapacity);
      const matrixDistance = coupledDistance * (matrixCapacity / coupledCapacity);
      return {
        coupledDistancePx: coupledDistance,
        matrixDistancePx: matrixDistance,
        expansionDistancePx: coupledDistance - matrixDistance,
        remainingDeltaPx: input.deltaPx + coupledDistance,
      };
    }
    case 'frameFactor': {
      const elapsed = clamp(input.elapsedMs, 1, constants.maxFrameElapsedMs);
      return { factor: 1 - Math.exp(-elapsed / constants.smoothTimeConstantMs) };
    }
    case 'moveScrollPosition': {
      const elapsed = clamp(input.elapsedMs, 1, constants.maxFrameElapsedMs);
      const factor = 1 - Math.exp(-elapsed / constants.smoothTimeConstantMs);
      const distance = input.targetPx - input.currentPx;
      return {
        nextPx: Math.abs(distance) <= constants.settleDistancePx
          ? input.targetPx
          : input.currentPx + distance * factor,
      };
    }
    case 'maxStickyShift':
      return {
        maxStickyShiftPx: Math.max(
          0,
          input.matrixViewportHeightPx
            - input.matrixHeaderHeightPx
            - constants.minimumVisibleFloorRows * input.floorRowHeightPx,
        ),
      };
    case 'gestureOwnerExpired':
      return {
        expired: input.currentTimestampMs < input.lastTimestampMs
          || input.currentTimestampMs - input.lastTimestampMs > constants.gestureIdleMs
          || !input.ownerConnected,
      };
    case 'restoreScrollPosition':
      return {
        scrollTopPx: !input.stored || input.stored.atBottom
          ? input.maximumPx
          : clamp(input.stored.scrollTopPx, 0, input.maximumPx),
      };
    default:
      throw new Error(`неизвестная операция ${vector.operation}`);
  }
}

function validateKinematicsVectors(vectorsDocument, implementation, styles, issues) {
  if (vectorsDocument.schemaVersion !== 1) issues.push('prototype-kinematics-vectors.json: неподдерживаемая schemaVersion');
  if (vectorsDocument.status !== 'current-prototype-reference-nonnormative') {
    issues.push('prototype-kinematics-vectors.json: не зафиксирован ненормативный current-статус');
  }

  const constants = vectorsDocument.constants ?? {};
  const sourceBindings = [
    ['wheelLinePixels', sourceNumericConstant(implementation, 'WHEEL_DELTA_LINE_HEIGHT')],
    ['smoothTimeConstantMs', sourceNumericConstant(implementation, 'WHEEL_SCROLL_TIME_CONSTANT_MS')],
    ['settleDistancePx', sourceNumericConstant(implementation, 'WHEEL_SCROLL_SETTLE_DISTANCE')],
    ['maxFrameElapsedMs', sourceNumericConstant(implementation, 'WHEEL_SCROLL_MAX_FRAME_MS')],
    ['initialFrameElapsedMs', sourceNumericConstant(implementation, 'WHEEL_SCROLL_INITIAL_FRAME_MS')],
    ['gestureIdleMs', sourceNumericConstant(implementation, 'WHEEL_GESTURE_IDLE_MS')],
    ['negligibleDistancePx', sourceNumericConstant(implementation, 'WHEEL_SCROLL_EPSILON')],
    ['bottomTolerancePx', sourceNumericConstant(implementation, 'MATRIX_SCROLL_BOTTOM_TOLERANCE')],
    ['minimumVisibleFloorRows', sourceNumericConstant(implementation, 'MATRIX_STICKY_MIN_VISIBLE_FLOOR_COUNT')],
    ['prototypeFloorRowHeightPx', sourceCssPixels(styles, '--dch2-matrix-floor-row-height')],
    ['prototypeMatrixHeaderHeightPx', sourceCssPixels(styles, '--dch2-matrix-table-header-height')],
    ['prototypeVisibleFloorRowsHeightPx', sourceCssPixels(styles, '--dch2-matrix-visible-floor-rows-height')],
    ['prototypeWorkListGapPx', sourceCssPixels(styles, '--dch2-work-list-gap')],
  ];
  sourceBindings.forEach(([name, sourceValue]) => {
    if (!Number.isFinite(sourceValue)) issues.push(`исходники: не найден параметр ${name}`);
    else if (constants[name] !== sourceValue) {
      issues.push(`prototype-kinematics-vectors.json: ${name}=${constants[name]} расходится с исходниками (${sourceValue})`);
    }
  });

  const derivedVisibleRows = constants.prototypeVisibleFloorRowsHeightPx
    / constants.prototypeFloorRowHeightPx;
  if (constants.maximumVisibleFloorRows !== derivedVisibleRows) {
    issues.push(
      `prototype-kinematics-vectors.json: maximumVisibleFloorRows=${constants.maximumVisibleFloorRows} `
      + `расходится с CSS-геометрией (${derivedVisibleRows})`,
    );
  }

  const vectors = Array.isArray(vectorsDocument.vectors) ? vectorsDocument.vectors : [];
  if (!vectors.length) issues.push('prototype-kinematics-vectors.json: отсутствуют test vectors');
  const vectorIds = vectors.map(vector => vector.id);
  const repeatedVectorIds = duplicates(vectorIds);
  if (repeatedVectorIds.length) issues.push(`повторяются kinematics vectors: ${repeatedVectorIds.join(', ')}`);

  vectors.forEach(vector => {
    let actual;
    try {
      actual = executeKinematicsVector(vector, constants);
    } catch (error) {
      issues.push(`${vector.id ?? 'vector без id'}: ${error.message}`);
      return;
    }
    const tolerance = vector.tolerance ?? 1e-9;
    Object.entries(vector.expected ?? {}).forEach(([field, expected]) => {
      const received = actual[field];
      const matches = typeof expected === 'number'
        ? Number.isFinite(received) && Math.abs(received - expected) <= tolerance
        : received === expected;
      if (!matches) {
        issues.push(`${vector.id}: ${field} ожидалось ${expected}, получено ${received}`);
      }
    });
  });

  return vectors.length;
}

export async function checkScrollContract() {
  const [
    readme,
    roles,
    behavior,
    acceptance,
    agentTask,
    verification,
    kinematicsReference,
    vectorsText,
    implementation,
    styles,
  ] = await Promise.all([
    'README.md',
    'interface-roles-and-relations.md',
    'behavior-and-algorithm.md',
    'acceptance-scenarios.md',
    'agent-task.md',
    'prototype-verification.md',
    'prototype-kinematics-reference.md',
  ].map(name => readFile(join(contractRoot, name), 'utf8')).concat([
    readFile(join(contractRoot, 'prototype-kinematics-vectors.json'), 'utf8'),
    readFile(join(featureRoot, 'digital-chessboard.js'), 'utf8'),
    readFile(join(featureRoot, 'digital-chessboard.css'), 'utf8'),
  ]));
  const issues = [];
  let vectorsDocument = {};
  try {
    vectorsDocument = JSON.parse(vectorsText);
  } catch (error) {
    issues.push(`prototype-kinematics-vectors.json: некорректный JSON (${error.message})`);
  }

  const requirementDefinitions = [...behavior.matchAll(
    /^- \*\*((?:SCROLL|SMOOTH|STICKY|WEB|LIFE)-\d{3}) ·/gm,
  )].map(match => match[1]);
  const repeatedRequirements = duplicates(requirementDefinitions);
  if (repeatedRequirements.length) issues.push(`повторяются требования: ${repeatedRequirements.join(', ')}`);
  requirementGroups.forEach(group => assertContiguous(requirementDefinitions, group, 3, issues));

  const acceptanceHeadings = [...acceptance.matchAll(/^### (AC-(?:SCROLL|STICKY|LIFE)-\d{2}) ·/gm)];
  const acceptanceIds = acceptanceHeadings.map(match => match[1]);
  const repeatedAcceptance = duplicates(acceptanceIds);
  if (repeatedAcceptance.length) issues.push(`повторяются сценарии: ${repeatedAcceptance.join(', ')}`);
  acceptanceGroups.forEach(group => assertContiguous(acceptanceIds, group, 2, issues));

  const knownRequirements = new Set(requirementDefinitions);
  const coveredRequirements = new Set();
  acceptanceHeadings.forEach((heading, index) => {
    const start = heading.index + heading[0].length;
    const end = acceptanceHeadings[index + 1]?.index ?? acceptance.indexOf('\n## 5. Матрица трассировки');
    const block = acceptance.slice(start, end < 0 ? acceptance.length : end);
    const verifies = block.match(/^\*\*Проверяет:\*\*([^\n]+)/m)?.[1];
    if (!verifies) {
      issues.push(`${heading[1]}: отсутствует строка «Проверяет»`);
      return;
    }
    expandRanges(verifies, requirementGroups, 3).forEach(id => {
      if (!knownRequirements.has(id)) issues.push(`${heading[1]}: ссылка на отсутствующее требование ${id}`);
      else coveredRequirements.add(id);
    });
  });

  requirementDefinitions.forEach(id => {
    if (!coveredRequirements.has(id)) issues.push(`${id}: отсутствует явный сценарий приёмки`);
  });

  const traceabilityHeading = '## 5. Матрица трассировки';
  const traceabilityStart = acceptance.indexOf(traceabilityHeading);
  if (traceabilityStart < 0) {
    issues.push('acceptance-scenarios.md: отсутствует матрица трассировки');
  } else {
    const traceability = acceptance.slice(traceabilityStart);
    const tracedAcceptance = expandRanges(traceability, acceptanceGroups, 2);
    acceptanceIds.forEach(id => {
      if (!tracedAcceptance.has(id)) issues.push(`${id}: отсутствует в итоговой матрице трассировки`);
    });
    requirementGroups.forEach(group => {
      const groupIds = requirementDefinitions.filter(id => id.startsWith(`${group}-`));
      const expected = `\`${group}-001\`–\`${group}-${groupIds.at(-1).slice(-3)}\``;
      if (!traceability.includes(expected)) issues.push(`матрица трассировки не содержит актуальный диапазон ${expected}`);
    });
  }

  const roleDefinitions = [...roles.matchAll(/`(UI-R\d{2}) [A-Z_]+`/g)].map(match => match[1]);
  const repeatedRoles = duplicates(roleDefinitions);
  if (repeatedRoles.length) issues.push(`повторяются роли: ${repeatedRoles.join(', ')}`);
  assertContiguous(roleDefinitions, 'UI-R', 2, issues, '');

  const requiredPackageLinks = [
    'interface-roles-and-relations.md',
    'behavior-and-algorithm.md',
    'acceptance-scenarios.md',
    'agent-task.md',
    'prototype-verification.md',
    'prototype-kinematics-reference.md',
    'prototype-kinematics-vectors.json',
  ];
  requiredPackageLinks.forEach(name => {
    if (!readme.includes(`./${name}`)) issues.push(`README.md: отсутствует маршрут к ${name}`);
  });
  if (!agentTask.includes('prototype-verification.md')) {
    issues.push('agent-task.md: не объяснена роль prototype-verification.md');
  }
  if (!agentTask.includes('prototype-kinematics-reference.md')) {
    issues.push('agent-task.md: отсутствует маршрут режима точного воспроизведения');
  }
  if (!verification.includes('npm.cmd run test:scroll-contract')) {
    issues.push('prototype-verification.md: отсутствует воспроизводимая browser-команда');
  }
  if (!verification.includes('prototype-kinematics-vectors.json')) {
    issues.push('prototype-verification.md: не зарегистрированы kinematics vectors');
  }
  if (!kinematicsReference.includes('prototype-kinematics-vectors.json')) {
    issues.push('prototype-kinematics-reference.md: отсутствует ссылка на машиночитаемые векторы');
  }

  const profileUnits = {
    wheelLinePixels: 'px',
    smoothTimeConstantMs: 'ms',
    settleDistancePx: 'px',
    maxFrameElapsedMs: 'ms',
    initialFrameElapsedMs: 'ms',
    gestureIdleMs: 'ms',
    negligibleDistancePx: 'px',
    bottomTolerancePx: 'px',
    minimumVisibleFloorRows: '',
    maximumVisibleFloorRows: '',
    prototypeFloorRowHeightPx: 'px',
    prototypeMatrixHeaderHeightPx: 'px',
    prototypeVisibleFloorRowsHeightPx: 'px',
    prototypeWorkListGapPx: 'px',
  };
  Object.entries(profileUnits).forEach(([name, unit]) => {
    const value = vectorsDocument.constants?.[name];
    const rendered = `${value}${unit ? ` ${unit}` : ''}`;
    if (!kinematicsReference.includes(`| \`${name}\` | \`${rendered}\` |`)) {
      issues.push(`prototype-kinematics-reference.md: ${name} не синхронизирован со значением ${rendered}`);
    }
  });

  const vectorCount = validateKinematicsVectors(vectorsDocument, implementation, styles, issues);

  if (issues.length) {
    throw new Error(`Ошибки scroll-контракта:\n- ${issues.join('\n- ')}`);
  }

  console.log(
    `Scroll contract: ${roleDefinitions.length} ролей, ${requirementDefinitions.length} требований, `
      + `${acceptanceIds.length} сценариев, ${vectorCount} reference-вектора; `
      + 'идентификаторы, трассировка и профиль кинематики корректны.',
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkScrollContract().catch(error => {
    console.error(error.message);
    process.exit(1);
  });
}
