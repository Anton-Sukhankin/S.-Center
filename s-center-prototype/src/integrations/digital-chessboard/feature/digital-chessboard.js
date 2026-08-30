import {
  createAccordion,
  createButton,
  createCard,
  createChessboard,
  createChessboardCellKey,
  createDocumentPreviewIcon,
  createEmptyState,
  createIcon,
  createInput,
  createMenu,
  createModal,
  createParameterPair,
  createTag,
  createTable,
  createTabs,
  createTooltip,
} from '../../../../../component-library-transfer/src/index.js';
import { createGroupWorks, GROUP_DEFINITIONS } from '../data/digital-chessboard-groups.js';

const integrationName = 'Digital Chessboard';
const MIN_SECTION_COUNT = 4;
const MAX_SECTION_COUNT = 15;
const MATRIX_ROW_HEADER_WIDTH = 92;
const MATRIX_COLUMN_WIDTH = 72;
const MATRIX_STICKY_MIN_VISIBLE_FLOOR_COUNT = 8;
const MATRIX_SCROLL_BOTTOM_TOLERANCE = 1;
const WHEEL_DELTA_LINE_HEIGHT = 16;
const WHEEL_SCROLL_TIME_CONSTANT_MS = 65;
const WHEEL_SCROLL_SETTLE_DISTANCE = 4;
const WHEEL_SCROLL_MAX_FRAME_MS = 48;
const WHEEL_SCROLL_INITIAL_FRAME_MS = 16;
const WHEEL_SCROLL_EPSILON = 0.01;
const WHEEL_GESTURE_IDLE_MS = 180;
const SCROLL_DEBUG_VERSION = 'wheel-router-v6';
const CELL_HISTORY_TOOLTIP_DELAY_MS = 1000;
const WORK_FULLSCREEN_TRANSITION_MS = 220;
const DEMO_CURRENT_USER = Object.freeze({ displayName: 'Соколова Мария Андреевна', login: 'm.sokolova' });

const CELL_STATES = Object.freeze([
  { id: 'no-work', label: 'Работы не ведутся', tone: 'neutral', pattern: 'none' },
  { id: 'current-progress', label: 'В работе на текущей неделе', tone: 'success', pattern: 'diagonal' },
  { id: 'current-complete', label: 'Завершено на текущей неделе', tone: 'success', pattern: 'solid' },
  { id: 'previous-progress', label: 'Было в работе на предыдущей неделе', tone: 'info', pattern: 'diagonal' },
  { id: 'previous-complete', label: 'Завершено на предыдущей неделе', tone: 'info', pattern: 'solid' },
]);
const EDITABLE_CELL_STATES = Object.freeze(CELL_STATES.filter(state => state.id !== 'no-work'));

function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function icon(name, size = 18, className = '') {
  const spriteNames = {
    target: 'grid-2x2',
    'trending-down': 'arrow-down-a-z',
    'trending-up': 'redo-2',
    'clock-3': 'rotate-ccw',
    'layers-3': 'rows-3',
    'calendar-range': 'columns-3',
    'circle-check': 'check',
    users: 'files',
    'folder-open': 'files',
    search: 'search',
  };
  return spriteNames[name]
    ? createDocumentPreviewIcon(spriteNames[name], size, className)
    : createIcon({ name, size, className });
}

function formatUpdatedAt(date = new Date()) {
  return `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
}

function formatWorkCount(count) {
  const value = Math.max(0, Number(count) || 0);
  const remainder100 = value % 100;
  const remainder10 = value % 10;
  const suffix = remainder10 === 1 && remainder100 !== 11
    ? 'работа'
    : remainder10 >= 2 && remainder10 <= 4 && (remainder100 < 12 || remainder100 > 14)
      ? 'работы'
      : 'работ';
  return `${value} ${suffix}`;
}

function stableBucket(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function baselineState(cell, identity = '') {
  if (!cell?.applicable || cell?.status === 'not-applicable') return null;
  if (cell.status === 'no-data') return 'no-work';
  if (cell.status === 'completed') return stableBucket(identity) % 13 === 0 ? 'current-complete' : 'previous-complete';
  if (cell.status === 'delayed') return 'previous-progress';
  if (cell.status === 'in-progress') return 'current-progress';
  return 'no-work';
}

function stateMeta(id) {
  return CELL_STATES.find(item => item.id === id) || CELL_STATES[0];
}

function normalizeContext(context) {
  if (context?.type === 'queue' && context.projectId) return {
    type: 'queue',
    id: String(context.id),
    projectId: String(context.projectId),
    ...(context.objectId ? { objectId: String(context.objectId) } : {}),
    ...(context.treeNodeId ? { treeNodeId: String(context.treeNodeId) } : {}),
    ...(context.objectName ? { objectName: String(context.objectName) } : {}),
  };
  if (context?.type === 'project' && context.id) return { type: 'project', id: String(context.id) };
  throw new Error(`${integrationName}: ожидается контекст проекта или очереди.`);
}

function resolveModel(context) {
  const data = window.digitalChessboardData;
  if (!data || typeof data.getForContext !== 'function') throw new Error(`${integrationName}: data layer is not loaded.`);
  return data.getForContext(context);
}

export function createDigitalChessboardFeature(root, options = {}) {
  if (!(root instanceof HTMLElement)) throw new TypeError(`${integrationName}: root HTMLElement is required.`);

  let context = normalizeContext(options.context);
  let model = resolveModel(context);
  let object = null;
  let period = null;
  let activeGroupId = GROUP_DEFINITIONS[0].id;
  let activeTab = 'chessboard';
  let updatedAt = formatUpdatedAt();
  let cellStatusMenu = null;
  const cellHistoryTooltip = createTooltip({
    id: 'dch2-cell-history-tooltip',
    delay: CELL_HISTORY_TOOLTIP_DELAY_MS,
    placement: 'auto',
    className: 'dch2-cell-history-tooltip',
  });
  let operationStatus = null;
  let groupModal = null;
  let retainGroupChoiceHover = false;
  let destroyed = false;
  let workStickyScrollHost = null;
  let workStickyFrame = null;
  let workStickyResizeObserver = null;
  let wheelCaptureBound = false;
  let scrollDebugPanel = null;
  let scrollDebugMatrix = null;
  let scrollDebugFrame = null;
  let scrollDebugPendingStage = 'ready';
  let scrollDebugEventCount = 0;
  let scrollDebugLastEvent = null;
  let scrollDebugDecision = 'none';
  const scrollDebugDecisionCounts = new Map();
  let smoothWheelMotion = null;
  let wheelGestureOwner = null;
  let fullscreenSession = null;
  let fullscreenAnimation = null;
  const overrides = new Map();
  const boardApis = new Map();
  const workReadinessRefs = new Map();
  const workAccordionRefs = new Map();
  const matrixScrollKeys = new Map();
  const matrixScrollPositions = new Map();
  const summaryRefs = {};
  const pendingWheelReconciliations = new Map();
  const cellTooltipData = new WeakMap();

  cellHistoryTooltip.mount();

  function workStickyTop() {
    if (!workStickyScrollHost) return null;

    const shellHeader = workStickyScrollHost.querySelector('.s-center-main__header');
    const tabsList = root.querySelector('.dch2-tabs > .ds-tabs__list');
    const workList = root.querySelector('.dch2-work-list');
    if (!shellHeader || !tabsList || !workList) return null;

    const workListGap = Number.parseFloat(window.getComputedStyle(workList).rowGap) || 0;
    return Math.max(
      workStickyScrollHost.getBoundingClientRect().top,
      shellHeader.getBoundingClientRect().bottom,
      tabsList.getBoundingClientRect().bottom,
    ) + workListGap;
  }

  function syncWorkStickyLayers() {
    workStickyFrame = null;
    if (destroyed || !workStickyScrollHost) return;

    const stickyTop = workStickyTop();
    if (stickyTop === null) return;

    const updates = [...root.querySelectorAll('.dch2-work-accordion')].map(accordion => {
      const currentShift = Number.parseFloat(accordion.style.getPropertyValue('--dch2-work-sticky-shift')) || 0;
      const accordionHeader = accordion.querySelector('.ds-accordion__header');
      const matrixScroll = accordion.querySelector('.ds-chessboard__scroll');
      const matrixHeader = accordion.querySelector('.ds-chessboard__table thead');
      const firstFloorRow = accordion.querySelector('.ds-chessboard__table tbody tr');
      let nextShift = 0;

      if (!accordion.classList.contains('is-work-fullscreen')
        && accordion.classList.contains('is-expanded')
        && accordionHeader
        && matrixScroll
        && matrixHeader
        && firstFloorRow) {
        const floorRowHeight = firstFloorRow.getBoundingClientRect().height;
        const matrixHeaderHeight = matrixHeader.getBoundingClientRect().height;
        const visibleFloorViewportHeight = Math.max(0, matrixScroll.clientHeight - matrixHeaderHeight);
        const minimumVisibleFloorHeight = MATRIX_STICKY_MIN_VISIBLE_FLOOR_COUNT * floorRowHeight;
        const maxShift = Math.max(0, visibleFloorViewportHeight - minimumVisibleFloorHeight);
        const naturalHeaderTop = accordionHeader.getBoundingClientRect().top - currentShift;
        nextShift = Math.min(maxShift, Math.max(0, stickyTop - naturalHeaderTop));
      }

      const normalizedShift = Math.round(nextShift * 100) / 100;
      return { accordion, normalizedShift };
    });

    updates.forEach(({ accordion, normalizedShift }) => {
      accordion.style.setProperty('--dch2-work-sticky-shift', `${normalizedShift}px`);
      accordion.classList.toggle('is-work-sticky', normalizedShift > 0);
    });
  }

  function scheduleWorkStickyLayers() {
    if (destroyed || workStickyFrame !== null) return;
    workStickyFrame = window.requestAnimationFrame(syncWorkStickyLayers);
  }

  function flushWorkStickyLayers() {
    // Smooth outer scrolling already runs inside requestAnimationFrame. Waiting
    // for its scroll event would defer the sticky compensation by one frame.
    if (workStickyFrame !== null) window.cancelAnimationFrame(workStickyFrame);
    workStickyFrame = null;
    syncWorkStickyLayers();
  }

  function refreshWorkStickyGeometryObservers() {
    if (!workStickyResizeObserver) return;

    workStickyResizeObserver.disconnect();
    const geometryOwners = [
      workStickyScrollHost,
      workStickyScrollHost?.querySelector('.s-center-main__header'),
      root.querySelector('.dch2-tabs > .ds-tabs__list'),
      root.querySelector('.dch2-work-list'),
      ...root.querySelectorAll([
        '.dch2-work-accordion',
        '.dch2-work-accordion .ds-chessboard__scroll',
        '.dch2-work-accordion .ds-chessboard__table thead',
        '.dch2-work-accordion .ds-chessboard__table tbody tr:first-child',
      ].join(', ')),
    ];

    new Set(geometryOwners.filter(Boolean)).forEach(element => workStickyResizeObserver.observe(element));
  }

  function wheelComponentInPixels(value, deltaMode, pageSize) {
    if (deltaMode === 1) return value * WHEEL_DELTA_LINE_HEIGHT;
    if (deltaMode === 2) return value * pageSize;
    return value;
  }

  function wheelDeltaInPixels(event, pageHeight) {
    return wheelComponentInPixels(event.deltaY, event.deltaMode, pageHeight);
  }

  function wheelHorizontalDeltaInPixels(event, pageWidth) {
    return wheelComponentInPixels(event.deltaX, event.deltaMode, pageWidth);
  }

  function matrixScrollFromWheelEvent(event) {
    const pathMatch = event.composedPath().find(node => (
      node instanceof Element
      && node.classList.contains('ds-chessboard__scroll')
      && node.closest('.dch2-matrix')
    ));
    if (pathMatch && root.contains(pathMatch)) return pathMatch;

    if (Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
      const pointTarget = document.elementFromPoint(event.clientX, event.clientY);
      const pointMatrix = pointTarget?.closest?.('.ds-chessboard__scroll');
      if (pointMatrix?.closest('.dch2-matrix') && root.contains(pointMatrix)) return pointMatrix;
    }
    return null;
  }

  function scrollDebugEnabled() {
    return new URLSearchParams(window.location.search).get('scroll-debug') === '1';
  }

  function scrollDebugTargetLabel(target) {
    if (!(target instanceof Element)) return String(target?.nodeName || 'unknown');
    const className = typeof target.className === 'string'
      ? target.className.trim().split(/\s+/).slice(0, 3).join('.')
      : '';
    return `${target.tagName.toLowerCase()}${className ? `.${className}` : ''}`;
  }

  function renderScrollDebug(stage = 'ready') {
    if (!scrollDebugPanel) return;
    const matrixScroll = scrollDebugMatrix?.isConnected
      ? scrollDebugMatrix
      : root.querySelector('.dch2-work-accordion.is-expanded .ds-chessboard__scroll');
    const outerScroll = workStickyScrollHost || root.closest('.s-center-main');
    const matrixMaximum = matrixScroll
      ? Math.max(0, matrixScroll.scrollHeight - matrixScroll.clientHeight)
      : 0;
    const outerMaximum = outerScroll
      ? Math.max(0, outerScroll.scrollHeight - outerScroll.clientHeight)
      : 0;
    const documentScroll = document.scrollingElement;
    const documentMaximum = documentScroll
      ? Math.max(0, documentScroll.scrollHeight - documentScroll.clientHeight)
      : 0;
    const overscrollY = matrixScroll
      ? window.getComputedStyle(matrixScroll).overscrollBehaviorY
      : 'n/a';
    const event = scrollDebugLastEvent;
    scrollDebugPanel.textContent = [
      `S.Center scroll debug · ${SCROLL_DEBUG_VERSION}`,
      `stage=${stage} · wheel events=${scrollDebugEventCount}`,
      event
        ? `trusted=${event.trusted} · target=${event.target} · matrixPath=${event.matrixPath}`
        : 'trusted=n/a · target=n/a · matrixPath=n/a',
      event
        ? `deltaY=${event.deltaY} · deltaX=${event.deltaX} · mode=${event.deltaMode} · hasVertical=${event.hasVertical}`
        : 'deltaY=n/a · deltaX=n/a · mode=n/a · hasVertical=n/a',
      event
        ? `cancelable=${event.cancelable} · prevented=${event.prevented} · bubbled=${event.bubbled}`
        : 'cancelable=n/a · prevented=n/a · bubbled=n/a',
      event
        ? `shift=${event.shiftKey} · ctrl=${event.ctrlKey}`
        : 'shift=n/a · ctrl=n/a',
      `decision=${scrollDebugDecision} · counts=${[...scrollDebugDecisionCounts.entries()].map(([key, value]) => `${key}:${value}`).join(',') || 'none'}`,
      `inner=${matrixScroll ? matrixScroll.scrollTop.toFixed(1) : 'n/a'} / ${matrixMaximum.toFixed(1)}`,
      `outer=${outerScroll ? outerScroll.scrollTop.toFixed(1) : 'n/a'} / ${outerMaximum.toFixed(1)} · captureBound=${wheelCaptureBound}`,
      `document=${documentScroll ? documentScroll.scrollTop.toFixed(1) : 'n/a'} / ${documentMaximum.toFixed(1)}`,
      `viewport=${window.innerWidth} · visual=${window.visualViewport?.width?.toFixed(1) || 'n/a'} · media760=${window.matchMedia('(max-width: 760px)').matches}`,
      `overscroll-y=${overscrollY} · fullscreen=${Boolean(fullscreenSession)}`,
      'Сделайте скролл через границу и пришлите скриншот этого блока.',
    ].join('\n');
  }

  function recordScrollDebugDecision(decision) {
    if (!scrollDebugPanel) return;
    scrollDebugDecision = decision;
    scrollDebugDecisionCounts.set(decision, (scrollDebugDecisionCounts.get(decision) || 0) + 1);
    scheduleScrollDebug('after-route-frame');
  }

  function scheduleScrollDebug(stage) {
    if (!scrollDebugPanel) return;
    scrollDebugPendingStage = stage;
    if (scrollDebugFrame !== null) return;
    scrollDebugFrame = window.requestAnimationFrame(() => {
      scrollDebugFrame = null;
      renderScrollDebug(scrollDebugPendingStage);
    });
  }

  function captureScrollDebugWheel(event) {
    const matrixScroll = matrixScrollFromWheelEvent(event);
    scrollDebugMatrix = matrixScroll || scrollDebugMatrix;
    scrollDebugEventCount += 1;
    scrollDebugLastEvent = {
      bubbled: false,
      cancelable: event.cancelable,
      ctrlKey: event.ctrlKey,
      deltaMode: event.deltaMode,
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      matrixPath: Boolean(matrixScroll),
      prevented: event.defaultPrevented,
      shiftKey: event.shiftKey,
      target: scrollDebugTargetLabel(event.target),
      trusted: event.isTrusted,
      hasVertical: Math.abs(event.deltaY) > WHEEL_SCROLL_EPSILON,
    };
    scheduleScrollDebug('after-wheel-frame');
  }

  function bubbleScrollDebugWheel(event) {
    if (!scrollDebugLastEvent) return;
    scrollDebugLastEvent.bubbled = true;
    scrollDebugLastEvent.prevented = event.defaultPrevented;
    scheduleScrollDebug('after-wheel-frame');
  }

  function captureScrollDebugScroll() {
    scheduleScrollDebug('scroll');
  }

  function mountScrollDebug() {
    if (!scrollDebugEnabled() || scrollDebugPanel) return;
    scrollDebugPanel = document.createElement('pre');
    scrollDebugPanel.setAttribute('data-scroll-debug', SCROLL_DEBUG_VERSION);
    scrollDebugPanel.style.cssText = [
      'position:fixed',
      'z-index:2147483647',
      'top:88px',
      'right:12px',
      'width:min(460px,calc(100vw - 24px))',
      'margin:0',
      'padding:12px',
      'border:1px solid rgba(255,255,255,.35)',
      'border-radius:8px',
      'background:rgba(15,23,42,.94)',
      'color:#f8fafc',
      'font:12px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace',
      'white-space:pre-wrap',
      'pointer-events:none',
      'box-shadow:0 8px 28px rgba(15,23,42,.3)',
    ].join(';');
    document.body.append(scrollDebugPanel);
    window.addEventListener('wheel', captureScrollDebugWheel, { capture: true, passive: true });
    window.addEventListener('wheel', bubbleScrollDebugWheel, { passive: true });
    window.addEventListener('scroll', captureScrollDebugScroll, { capture: true, passive: true });
    renderScrollDebug();
  }

  function unmountScrollDebug() {
    window.removeEventListener('wheel', captureScrollDebugWheel, true);
    window.removeEventListener('wheel', bubbleScrollDebugWheel);
    window.removeEventListener('scroll', captureScrollDebugScroll, true);
    if (scrollDebugFrame !== null) window.cancelAnimationFrame(scrollDebugFrame);
    scrollDebugFrame = null;
    scrollDebugPendingStage = 'ready';
    scrollDebugPanel?.remove();
    scrollDebugPanel = null;
    scrollDebugMatrix = null;
    scrollDebugLastEvent = null;
    scrollDebugDecision = 'none';
    scrollDebugDecisionCounts.clear();
  }

  function wheelEventTimestamp(event) {
    return Number.isFinite(event.timeStamp) ? event.timeStamp : window.performance.now();
  }

  function wheelGestureOwnerIsActive(event) {
    if (!wheelGestureOwner) return false;
    const timestamp = wheelEventTimestamp(event);
    return timestamp >= wheelGestureOwner.lastTimestamp
      && timestamp - wheelGestureOwner.lastTimestamp <= WHEEL_GESTURE_IDLE_MS
      && (!wheelGestureOwner.matrixScroll || wheelGestureOwner.matrixScroll.isConnected);
  }

  function matrixScrollForWheelGesture(event, eventMatrix = matrixScrollFromWheelEvent(event)) {
    const timestamp = wheelEventTimestamp(event);
    const ownerExpired = !wheelGestureOwnerIsActive(event);

    if (ownerExpired) {
      wheelGestureOwner = { matrixScroll: eventMatrix, lastTimestamp: timestamp };
    } else {
      wheelGestureOwner.lastTimestamp = timestamp;
      // A sequence that starts in the outer content remains native even when
      // scrolling moves the matrix under a stationary pointer. A deliberate
      // move from one matrix to another, however, changes the inner owner.
      if (wheelGestureOwner.matrixScroll && eventMatrix && eventMatrix !== wheelGestureOwner.matrixScroll) {
        wheelGestureOwner = { matrixScroll: eventMatrix, lastTimestamp: timestamp };
      }
    }

    return wheelGestureOwner.matrixScroll;
  }

  function upwardWorkAlignmentDistance(matrixScroll, outerScroll) {
    const accordion = matrixScroll.closest('.dch2-work-accordion');
    const accordionHeader = accordion?.querySelector('.ds-accordion__header');
    const stickyTop = workStickyTop();
    if (!accordion?.classList.contains('is-expanded') || !accordionHeader || stickyTop === null) return 0;

    return Math.min(
      outerScroll.scrollTop,
      Math.max(0, stickyTop - accordionHeader.getBoundingClientRect().top),
    );
  }

  function workStickyShift(matrixScroll) {
    const accordion = matrixScroll.closest('.dch2-work-accordion');
    if (!accordion?.classList.contains('is-expanded')) return 0;
    return Math.max(
      0,
      Number.parseFloat(accordion.style.getPropertyValue('--dch2-work-sticky-shift')) || 0,
    );
  }

  function upwardExpansionTarget(matrixScroll, outerScroll, alignmentDistance = 0) {
    const alignedOuterPosition = Math.max(0, outerScroll.scrollTop - alignmentDistance);
    return Math.max(
      0,
      alignedOuterPosition - Math.min(workStickyShift(matrixScroll), alignedOuterPosition),
    );
  }

  function splitCoupledUpwardDelta(delta, matrixCapacity, expansionCapacity) {
    const safeMatrixCapacity = Math.max(0, matrixCapacity);
    const safeExpansionCapacity = Math.max(0, expansionCapacity);
    const coupledCapacity = safeMatrixCapacity + safeExpansionCapacity;
    if (delta >= 0 || safeMatrixCapacity <= 0 || safeExpansionCapacity <= 0 || coupledCapacity <= 0) {
      return {
        coupledDistance: 0,
        expansionDistance: 0,
        matrixDistance: 0,
        remainingDelta: delta,
      };
    }

    const coupledDistance = Math.min(-delta, coupledCapacity);
    const matrixDistance = coupledDistance * (safeMatrixCapacity / coupledCapacity);
    return {
      coupledDistance,
      expansionDistance: coupledDistance - matrixDistance,
      matrixDistance,
      remainingDelta: delta + coupledDistance,
    };
  }

  function applyMatrixVerticalDelta(matrixScroll, outerScroll, delta) {
    const outerStart = outerScroll.scrollTop;
    let remainingDelta = delta;
    if (remainingDelta < 0) {
      const alignmentDistance = upwardWorkAlignmentDistance(matrixScroll, outerScroll);
      const alignmentStep = Math.min(-remainingDelta, alignmentDistance);
      outerScroll.scrollTop -= alignmentStep;
      remainingDelta += alignmentStep;
    }

    const matrixMaximum = Math.max(0, matrixScroll.scrollHeight - matrixScroll.clientHeight);
    let matrixStart = Math.min(matrixMaximum, Math.max(0, matrixScroll.scrollTop));
    if (remainingDelta < 0 && matrixStart > 0) {
      const expansionCapacity = Math.min(workStickyShift(matrixScroll), outerScroll.scrollTop);
      const split = splitCoupledUpwardDelta(remainingDelta, matrixStart, expansionCapacity);
      if (split.coupledDistance > 0) {
        matrixScroll.scrollTop = Math.max(0, matrixStart - split.matrixDistance);
        outerScroll.scrollTop = Math.max(0, outerScroll.scrollTop - split.expansionDistance);
        remainingDelta = split.remainingDelta;
        matrixStart = Math.min(matrixMaximum, Math.max(0, matrixScroll.scrollTop));
      }
    }

    const matrixTarget = Math.min(matrixMaximum, Math.max(0, matrixStart + remainingDelta));
    matrixScroll.scrollTop = matrixTarget;

    const remainder = remainingDelta - (matrixTarget - matrixStart);
    if (Math.abs(remainder) > WHEEL_SCROLL_EPSILON) outerScroll.scrollTop += remainder;
    if (Math.abs(outerScroll.scrollTop - outerStart) > WHEEL_SCROLL_EPSILON) flushWorkStickyLayers();
  }

  function cancelSmoothWheelMotion() {
    if (smoothWheelMotion?.frame != null) window.cancelAnimationFrame(smoothWheelMotion.frame);
    smoothWheelMotion = null;
  }

  function moveScrollPosition(current, target, factor) {
    const distance = target - current;
    if (Math.abs(distance) <= WHEEL_SCROLL_SETTLE_DISTANCE) return target;
    return current + distance * factor;
  }

  function reconcileSmoothTargetsWithActualPositions(motion) {
    if (motion.direction > 0) {
      motion.matrixTarget = Math.max(motion.matrixTarget, motion.matrixScroll.scrollTop);
      motion.outerLeadTarget = Math.max(motion.outerLeadTarget, motion.outerScroll.scrollTop);
      motion.outerCoupledTarget = Math.max(motion.outerCoupledTarget, motion.outerScroll.scrollTop);
      motion.outerTarget = Math.max(motion.outerTarget, motion.outerScroll.scrollTop);
      return;
    }
    if (motion.direction < 0) {
      motion.matrixTarget = Math.min(motion.matrixTarget, motion.matrixScroll.scrollTop);
      motion.outerLeadTarget = Math.min(motion.outerLeadTarget, motion.outerScroll.scrollTop);
      motion.outerCoupledTarget = Math.min(motion.outerCoupledTarget, motion.outerScroll.scrollTop);
      motion.outerTarget = Math.min(motion.outerTarget, motion.outerScroll.scrollTop);
    }
  }

  function stepSmoothWheelMotion(timestamp) {
    const motion = smoothWheelMotion;
    if (!motion || destroyed || !motion.matrixScroll.isConnected || !motion.outerScroll.isConnected) {
      cancelSmoothWheelMotion();
      return;
    }

    const elapsed = motion.lastTimestamp === null
      ? WHEEL_SCROLL_INITIAL_FRAME_MS
      : Math.min(WHEEL_SCROLL_MAX_FRAME_MS, Math.max(1, timestamp - motion.lastTimestamp));
    const factor = 1 - Math.exp(-elapsed / WHEEL_SCROLL_TIME_CONSTANT_MS);
    motion.lastTimestamp = timestamp;
    reconcileSmoothTargetsWithActualPositions(motion);
    const outerStart = motion.outerScroll.scrollTop;

    if (!motion.outerLeadComplete) {
      motion.outerScroll.scrollTop = moveScrollPosition(
        motion.outerScroll.scrollTop,
        motion.outerLeadTarget,
        factor,
      );
      if (Math.abs(motion.outerLeadTarget - motion.outerScroll.scrollTop)
        <= WHEEL_SCROLL_SETTLE_DISTANCE) {
        motion.outerScroll.scrollTop = motion.outerLeadTarget;
        motion.outerLeadComplete = true;
      }
    }
    const outerLeadSettled = motion.outerLeadComplete;

    if (outerLeadSettled) {
      motion.matrixScroll.scrollTop = moveScrollPosition(
        motion.matrixScroll.scrollTop,
        motion.matrixTarget,
        factor,
      );
      motion.outerScroll.scrollTop = moveScrollPosition(
        motion.outerScroll.scrollTop,
        motion.outerCoupledTarget,
        factor,
      );
    }
    const matrixSettled = Math.abs(motion.matrixTarget - motion.matrixScroll.scrollTop)
      <= WHEEL_SCROLL_SETTLE_DISTANCE;
    if (outerLeadSettled && matrixSettled) motion.matrixScroll.scrollTop = motion.matrixTarget;
    const outerCoupledSettled = Math.abs(motion.outerCoupledTarget - motion.outerScroll.scrollTop)
      <= WHEEL_SCROLL_SETTLE_DISTANCE;
    if (outerLeadSettled && outerCoupledSettled) {
      motion.outerScroll.scrollTop = motion.outerCoupledTarget;
    }

    if (outerLeadSettled && matrixSettled && outerCoupledSettled) {
      motion.outerScroll.scrollTop = moveScrollPosition(
        motion.outerScroll.scrollTop,
        motion.outerTarget,
        factor,
      );
    }
    const outerSettled = Math.abs(motion.outerTarget - motion.outerScroll.scrollTop)
      <= WHEEL_SCROLL_SETTLE_DISTANCE;
    if (outerLeadSettled && matrixSettled && outerCoupledSettled && outerSettled) {
      motion.outerScroll.scrollTop = motion.outerTarget;
    }

    if (Math.abs(motion.outerScroll.scrollTop - outerStart) > WHEEL_SCROLL_EPSILON) {
      flushWorkStickyLayers();
    }

    if (outerLeadSettled && matrixSettled && outerCoupledSettled && outerSettled) {
      smoothWheelMotion = null;
      return;
    }
    motion.frame = window.requestAnimationFrame(stepSmoothWheelMotion);
  }

  function queueSmoothMatrixVerticalDelta(matrixScroll, outerScroll, delta) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      cancelSmoothWheelMotion();
      applyMatrixVerticalDelta(matrixScroll, outerScroll, delta);
      return;
    }

    const direction = Math.sign(delta);
    const changesOwner = smoothWheelMotion
      && (smoothWheelMotion.matrixScroll !== matrixScroll || smoothWheelMotion.outerScroll !== outerScroll);
    if (!smoothWheelMotion || changesOwner) {
      cancelSmoothWheelMotion();
      const alignmentDistance = direction < 0
        ? upwardWorkAlignmentDistance(matrixScroll, outerScroll)
        : 0;
      smoothWheelMotion = {
        direction,
        frame: null,
        lastTimestamp: null,
        matrixScroll,
        matrixTarget: matrixScroll.scrollTop,
        outerScroll,
        outerLeadComplete: false,
        outerLeadTarget: outerScroll.scrollTop,
        outerCoupledTarget: outerScroll.scrollTop,
        outerTarget: outerScroll.scrollTop,
        upwardAlignmentRemaining: alignmentDistance,
        upwardExpansionTarget: direction < 0
          ? upwardExpansionTarget(matrixScroll, outerScroll, alignmentDistance)
          : outerScroll.scrollTop,
      };
    } else if (smoothWheelMotion.direction !== direction) {
      const alignmentDistance = direction < 0
        ? upwardWorkAlignmentDistance(matrixScroll, outerScroll)
        : 0;
      smoothWheelMotion.direction = direction;
      smoothWheelMotion.lastTimestamp = null;
      smoothWheelMotion.matrixTarget = matrixScroll.scrollTop;
      smoothWheelMotion.outerLeadComplete = false;
      smoothWheelMotion.outerLeadTarget = outerScroll.scrollTop;
      smoothWheelMotion.outerCoupledTarget = outerScroll.scrollTop;
      smoothWheelMotion.outerTarget = outerScroll.scrollTop;
      smoothWheelMotion.upwardAlignmentRemaining = alignmentDistance;
      smoothWheelMotion.upwardExpansionTarget = direction < 0
        ? upwardExpansionTarget(matrixScroll, outerScroll, alignmentDistance)
        : outerScroll.scrollTop;
    }

    reconcileSmoothTargetsWithActualPositions(smoothWheelMotion);

    let remainingDelta = delta;
    if (remainingDelta < 0 && smoothWheelMotion.upwardAlignmentRemaining > 0) {
      const alignmentStep = Math.min(
        -remainingDelta,
        smoothWheelMotion.upwardAlignmentRemaining,
        smoothWheelMotion.outerLeadTarget,
      );
      smoothWheelMotion.outerLeadTarget -= alignmentStep;
      smoothWheelMotion.outerCoupledTarget -= alignmentStep;
      smoothWheelMotion.outerLeadComplete = false;
      smoothWheelMotion.outerTarget -= alignmentStep;
      smoothWheelMotion.upwardAlignmentRemaining -= alignmentStep;
      remainingDelta += alignmentStep;

      if (smoothWheelMotion.outerLeadTarget <= WHEEL_SCROLL_EPSILON) {
        smoothWheelMotion.upwardAlignmentRemaining = 0;
      }
    }

    const matrixMaximum = Math.max(0, matrixScroll.scrollHeight - matrixScroll.clientHeight);
    if (remainingDelta < 0 && smoothWheelMotion.matrixTarget > 0) {
      const matrixCapacity = smoothWheelMotion.matrixTarget;
      const expansionCapacity = Math.max(
        0,
        smoothWheelMotion.outerCoupledTarget - smoothWheelMotion.upwardExpansionTarget,
      );
      const split = splitCoupledUpwardDelta(remainingDelta, matrixCapacity, expansionCapacity);
      if (split.coupledDistance > 0) {
        smoothWheelMotion.matrixTarget = Math.max(0, matrixCapacity - split.matrixDistance);
        smoothWheelMotion.outerCoupledTarget = Math.max(
          smoothWheelMotion.upwardExpansionTarget,
          smoothWheelMotion.outerCoupledTarget - split.expansionDistance,
        );
        smoothWheelMotion.outerTarget = Math.min(
          smoothWheelMotion.outerTarget,
          smoothWheelMotion.outerCoupledTarget,
        );
        remainingDelta = split.remainingDelta;
      }
    }

    const matrixStart = Math.min(matrixMaximum, Math.max(0, smoothWheelMotion.matrixTarget));
    const matrixTarget = Math.min(matrixMaximum, Math.max(0, matrixStart + remainingDelta));
    smoothWheelMotion.matrixTarget = matrixTarget;

    const remainder = remainingDelta - (matrixTarget - matrixStart);
    const outerMaximum = Math.max(0, outerScroll.scrollHeight - outerScroll.clientHeight);
    smoothWheelMotion.outerTarget = Math.min(
      outerMaximum,
      Math.max(0, smoothWheelMotion.outerTarget + remainder),
    );

    if (smoothWheelMotion.frame === null) {
      smoothWheelMotion.frame = window.requestAnimationFrame(stepSmoothWheelMotion);
    }
  }

  function reconcileNativeMatrixWheel(matrixScroll, outerScroll, delta) {
    let pending = pendingWheelReconciliations.get(matrixScroll);
    if (!pending) {
      pending = {
        delta: 0,
        frame: null,
        matrixStart: matrixScroll.scrollTop,
        outerScroll,
        outerStart: outerScroll.scrollTop,
      };
      pendingWheelReconciliations.set(matrixScroll, pending);
    }
    pending.delta += delta;
    if (pending.frame !== null) return;

    pending.frame = window.requestAnimationFrame(() => {
      pendingWheelReconciliations.delete(matrixScroll);
      if (destroyed || !matrixScroll.isConnected || !pending.outerScroll.isConnected) return;

      const nativeDistance = (matrixScroll.scrollTop - pending.matrixStart)
        + (pending.outerScroll.scrollTop - pending.outerStart);
      const remainder = pending.delta - nativeDistance;
      if (Math.abs(remainder) > WHEEL_SCROLL_EPSILON && Math.sign(remainder) === Math.sign(pending.delta)) {
        queueSmoothMatrixVerticalDelta(matrixScroll, pending.outerScroll, remainder);
      }
    });
  }

  function cancelPendingWheelReconciliations() {
    pendingWheelReconciliations.forEach(pending => {
      if (pending.frame !== null) window.cancelAnimationFrame(pending.frame);
    });
    pendingWheelReconciliations.clear();
  }

  function routeMatrixVerticalWheel(event, eventMatrix = matrixScrollFromWheelEvent(event)) {
    if (event.ctrlKey || event.shiftKey) {
      recordScrollDebugDecision(event.ctrlKey
        ? 'excluded-ctrl'
        : 'excluded-shift');
      wheelGestureOwner = null;
      cancelSmoothWheelMotion();
      cancelPendingWheelReconciliations();
      return;
    }
    if (Math.abs(event.deltaY) <= WHEEL_SCROLL_EPSILON) {
      // A touchpad may emit an X-only frame inside an otherwise diagonal
      // sequence. It remains native and must not cancel the queued Y motion or
      // discard the matrix owner needed by later retargeted frames.
      recordScrollDebugDecision('excluded-no-vertical');
      return;
    }
    const matrixScroll = matrixScrollForWheelGesture(event, eventMatrix);
    if (!matrixScroll) {
      recordScrollDebugDecision('no-matrix-owner');
      cancelSmoothWheelMotion();
      cancelPendingWheelReconciliations();
      return;
    }

    // Fullscreen is a self-contained work surface. Its matrix keeps native
    // two-axis scrolling and must not hand the remaining delta to the hidden
    // outer work list.
    if (fullscreenSession) {
      recordScrollDebugDecision('fullscreen-native');
      cancelSmoothWheelMotion();
      cancelPendingWheelReconciliations();
      return;
    }

    const outerScroll = workStickyScrollHost;
    if (!outerScroll) {
      recordScrollDebugDecision('no-outer-host');
      return;
    }

    const delta = wheelDeltaInPixels(event, outerScroll.clientHeight);
    if (!delta) {
      recordScrollDebugDecision('zero-delta');
      return;
    }

    if (!event.cancelable) {
      recordScrollDebugDecision('noncancelable-reconcile');
      reconcileNativeMatrixWheel(matrixScroll, outerScroll, delta);
      return;
    }

    // One handler owns the whole vertical gesture: the matrix consumes the
    // available distance and the remainder reaches the page in the same event.
    // A single capture owner also preserves the matrix owner across browser
    // scroll-latching/retargeting without applying the vertical component twice.
    event.preventDefault();
    const horizontalDelta = wheelHorizontalDeltaInPixels(event, matrixScroll.clientWidth);
    if (Math.abs(horizontalDelta) > WHEEL_SCROLL_EPSILON) {
      matrixScroll.scrollLeft += horizontalDelta;
    }
    recordScrollDebugDecision('prevented-queued');
    queueSmoothMatrixVerticalDelta(matrixScroll, outerScroll, delta);
  }

  function routeWindowVerticalWheel(event) {
    const belongsToMain = event.composedPath().some(node => (
      node === workStickyScrollHost
      || (node instanceof Element && node.classList.contains('s-center-main'))
    ));
    const eventMatrix = matrixScrollFromWheelEvent(event);
    if (!belongsToMain && !eventMatrix && !wheelGestureOwnerIsActive(event)) return;
    routeMatrixVerticalWheel(event, eventMatrix);
  }

  function bindWorkStickyLayers() {
    workStickyScrollHost = root.closest('.s-center-main');
    mountScrollDebug();
    workStickyScrollHost?.addEventListener('scroll', scheduleWorkStickyLayers, { passive: true });
    window.addEventListener('wheel', routeWindowVerticalWheel, { capture: true, passive: false });
    wheelCaptureBound = true;
    window.addEventListener('resize', scheduleWorkStickyLayers);
    if ('ResizeObserver' in window) {
      workStickyResizeObserver = new ResizeObserver(scheduleWorkStickyLayers);
      refreshWorkStickyGeometryObservers();
    }
    document.fonts?.addEventListener?.('loadingdone', scheduleWorkStickyLayers);
    document.fonts?.ready?.then(() => {
      if (!destroyed) scheduleWorkStickyLayers();
    });
  }

  function unbindWorkStickyLayers() {
    workStickyScrollHost?.removeEventListener('scroll', scheduleWorkStickyLayers);
    window.removeEventListener('wheel', routeWindowVerticalWheel, true);
    wheelCaptureBound = false;
    unmountScrollDebug();
    window.removeEventListener('resize', scheduleWorkStickyLayers);
    document.fonts?.removeEventListener?.('loadingdone', scheduleWorkStickyLayers);
    workStickyResizeObserver?.disconnect();
    workStickyResizeObserver = null;
    wheelGestureOwner = null;
    cancelSmoothWheelMotion();
    cancelPendingWheelReconciliations();
    if (workStickyFrame !== null) window.cancelAnimationFrame(workStickyFrame);
    workStickyFrame = null;
    workStickyScrollHost = null;
  }

  function hydrateModel() {
    object = model?.status === 'ready' && context.objectId
      ? model.objects.find(item => item.id === context.objectId) || null
      : null;
    period = object?.periods?.[0] || null;
  }

  function groupModels() {
    if (!period) return [];
    const identity = context.treeNodeId || context.objectId;
    return GROUP_DEFINITIONS.map(definition => ({
      ...definition,
      works: createGroupWorks(definition, period.works, object?.workCount, identity),
    }));
  }

  function activeGroup() {
    const groups = groupModels();
    return groups.find(group => group.id === activeGroupId) || groups[0];
  }

  function selectGroup(groupId, { preserveChoiceHover = false } = {}) {
    if (!groupModels().some(group => group.id === groupId)) return;
    retainGroupChoiceHover = preserveChoiceHover;
    activeGroupId = groupId;
    activeTab = 'chessboard';
    render();
  }

  function displayGeometry() {
    const sourcePartCount = Number(object?.partCount) || 0;
    return {
      floorCount: Math.max(0, Number(object?.floorCount) || 0),
      partCount: Math.min(MAX_SECTION_COUNT, Math.max(MIN_SECTION_COUNT, sourcePartCount)),
    };
  }

  function displaySections(work) {
    const { partCount, floorCount } = displayGeometry();
    return Array.from({ length: partCount }, (_, index) => {
      const section = work.sections[index];
      if (!section) return {
        id: `display-part-${index + 1}`,
        name: `${object.partLabel} ${index + 1}`,
        floorCount: 0,
        isDisplayPlaceholder: true,
      };
      return {
        ...section,
        floorCount: Math.min(floorCount, Math.max(1, Number(section.floorCount) || floorCount)),
      };
    });
  }

  function matrixScrollKey(work) {
    return [
      context.projectId || model?.projectId || '',
      context.treeNodeId || context.objectId || object?.id || '',
      period?.id || '',
      work.id,
    ].join(':');
  }

  function matrixScrollMaximum(scroll) {
    return Math.max(0, scroll.scrollHeight - scroll.clientHeight);
  }

  function rememberMatrixScrollPosition(workId) {
    const scroll = boardApis.get(workId)?.scroll;
    const key = matrixScrollKeys.get(workId);
    if (!scroll || !key || scroll.clientHeight <= 0) return false;
    const maximum = matrixScrollMaximum(scroll);
    const scrollTop = Math.min(maximum, Math.max(0, scroll.scrollTop));
    matrixScrollPositions.set(key, {
      scrollTop,
      atBottom: maximum - scrollTop <= MATRIX_SCROLL_BOTTOM_TOLERANCE,
    });
    return true;
  }

  function restoreMatrixScrollPosition(workId) {
    const scroll = boardApis.get(workId)?.scroll;
    const key = matrixScrollKeys.get(workId);
    if (!scroll || !key || scroll.clientHeight <= 0) return false;
    const maximum = matrixScrollMaximum(scroll);
    const stored = matrixScrollPositions.get(key);
    const scrollTop = !stored || stored.atBottom
      ? maximum
      : Math.min(maximum, Math.max(0, stored.scrollTop));
    scroll.scrollTop = scrollTop;
    matrixScrollPositions.set(key, {
      scrollTop,
      atBottom: maximum - scrollTop <= MATRIX_SCROLL_BOTTOM_TOLERANCE,
    });
    return true;
  }

  function rememberAllMatrixScrollPositions() {
    boardApis.forEach((_boardApi, workId) => rememberMatrixScrollPosition(workId));
  }

  function restoreOpenMatrixScrollPositions() {
    workAccordionRefs.forEach(reference => {
      if (reference.accordion.isOpen()) restoreMatrixScrollPosition(reference.work.id);
    });
  }

  function overrideKey(workId, rowId, columnId) {
    return `${workId}:${createChessboardCellKey(rowId, columnId)}`;
  }

  function cellState(work, rowId, columnId) {
    const key = overrideKey(work.id, rowId, columnId);
    const override = overrides.get(key);
    return override?.stateId || baselineState(work.cells[`${rowId}:${columnId}`], key);
  }

  function cellLastChange(work, rowId, columnId) {
    const key = overrideKey(work.id, rowId, columnId);
    return overrides.get(key)?.lastChange || work.cells[`${rowId}:${columnId}`]?.lastChange || null;
  }

  function readinessForWork(work) {
    const geometry = displayGeometry();
    let applicable = 0;
    let completionDelta = 0;
    for (let floor = 1; floor <= geometry.floorCount; floor += 1) {
      for (let sectionIndex = 0; sectionIndex < geometry.partCount; sectionIndex += 1) {
        const section = work.sections[sectionIndex];
        if (!section) continue;
        const sectionFloorCount = Math.min(geometry.floorCount, Math.max(1, Number(section.floorCount) || geometry.floorCount));
        if (floor > sectionFloorCount) continue;
        const originalState = baselineState(work.cells[`${floor}:${section.id}`], overrideKey(work.id, floor, section.id));
        if (!originalState) continue;
        applicable += 1;
        const nextState = cellState(work, floor, section.id);
        const originalComplete = originalState === 'current-complete' || originalState === 'previous-complete';
        const nextComplete = nextState === 'current-complete' || nextState === 'previous-complete';
        completionDelta += Number(nextComplete) - Number(originalComplete);
      }
    }
    return Math.max(0, Math.min(100, Math.round(work.completion + (applicable ? (completionDelta / applicable) * 100 : 0))));
  }

  function groupReadiness(group) {
    const values = group.works.map(readinessForWork);
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  }

  function objectReadiness() {
    const works = [...new Map(groupModels().flatMap(group => group.works).map(work => [work.id, work])).values()];
    if (!works.length) return 0;
    const currentAverage = works.map(readinessForWork).reduce((sum, value) => sum + value, 0) / works.length;
    const baselineAverage = works.reduce((sum, work) => sum + work.completion, 0) / works.length;
    return Math.max(0, Math.min(100, Math.round((period?.summary?.actual ?? baselineAverage) + currentAverage - baselineAverage)));
  }

  function setCellVisual(selection, stateId) {
    const meta = stateMeta(stateId);
    boardApis.get(selection.workId)?.setCellState(selection.key, {
      state: meta.id,
      label: meta.label,
      tone: meta.tone,
      pattern: meta.pattern,
      text: '',
    });
  }

  function actionSwatch(state) {
    const swatch = el('span', 'dch2-state-swatch');
    swatch.dataset.tone = state.tone;
    swatch.dataset.pattern = state.pattern;
    swatch.setAttribute('aria-hidden', 'true');
    return swatch;
  }

  function formatCellChangeDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return { date: 'Не указана', time: 'Не указано' };
    return {
      date: new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Europe/Moscow',
      }).format(date),
      time: new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Moscow',
      }).format(date),
    };
  }

  function createCellHistoryTooltipContent({ work, row, column }) {
    const state = cellState(work, row.id, column.id);
    const change = state && state !== 'no-work' ? cellLastChange(work, row.id, column.id) : null;
    if (!change) return null;
    const meta = stateMeta(state);
    const changedAt = formatCellChangeDate(change.changedAt);
    const content = el('div', 'dch2-cell-history');
    const title = el('strong', 'dch2-cell-history__title', 'Последнее изменение');
    const contextLabel = el('span', 'dch2-cell-history__context', `${row.label}, ${column.label}`);
    const details = [
      ['Статус', meta.label],
      ['Изменил', change.changedBy?.displayName || 'Не указан'],
      ['Логин', change.changedBy?.login ? `@${change.changedBy.login}` : 'Не указан'],
      ['Дата', changedAt.date],
      ['Время', changedAt.time],
    ];
    const list = el('dl', 'dch2-cell-history__details');
    details.forEach(([label, value]) => {
      const rowElement = el('div', 'dch2-cell-history__row');
      const term = el('dt', '', label);
      const description = el('dd', 'dch2-cell-history__value');
      if (value instanceof Node) description.append(value);
      else description.textContent = value;
      rowElement.append(term, description);
      list.append(rowElement);
    });
    content.append(title, contextLabel, list);
    return content;
  }

  function tooltipCellFromTarget(target) {
    if (!(target instanceof Element)) return null;
    const cellButton = target.closest('.dch2-matrix .ds-chessboard__cell:not(:disabled)');
    return cellButton && root.contains(cellButton) ? cellButton : null;
  }

  function showCellHistoryTooltip(cellButton, { delayed = false } = {}) {
    const data = cellTooltipData.get(cellButton);
    const content = data ? createCellHistoryTooltipContent(data) : null;
    if (!content) {
      cellHistoryTooltip.close();
      return;
    }
    if (delayed) {
      cellHistoryTooltip.schedule(cellButton, {
        content,
        delay: CELL_HISTORY_TOOLTIP_DELAY_MS,
      });
    } else {
      cellHistoryTooltip.show(cellButton, { content });
    }
  }

  function handleCellTooltipPointerOver(event) {
    const cellButton = tooltipCellFromTarget(event.target);
    if (!cellButton || cellButton.contains(event.relatedTarget)) return;
    showCellHistoryTooltip(cellButton, { delayed: true });
  }

  function handleCellTooltipPointerOut(event) {
    const cellButton = tooltipCellFromTarget(event.target);
    if (!cellButton || cellButton.contains(event.relatedTarget)) return;
    cellHistoryTooltip.close();
  }

  function handleCellTooltipFocusIn(event) {
    const cellButton = tooltipCellFromTarget(event.target);
    if (cellButton?.matches(':focus-visible')) showCellHistoryTooltip(cellButton);
  }

  function handleCellTooltipFocusOut(event) {
    const cellButton = tooltipCellFromTarget(event.target);
    if (!cellButton || cellButton.contains(event.relatedTarget)) return;
    cellHistoryTooltip.close();
  }

  function bindCellHistoryTooltip() {
    root.addEventListener('pointerover', handleCellTooltipPointerOver);
    root.addEventListener('pointerout', handleCellTooltipPointerOut);
    root.addEventListener('focusin', handleCellTooltipFocusIn);
    root.addEventListener('focusout', handleCellTooltipFocusOut);
  }

  function unbindCellHistoryTooltip() {
    root.removeEventListener('pointerover', handleCellTooltipPointerOver);
    root.removeEventListener('pointerout', handleCellTooltipPointerOut);
    root.removeEventListener('focusin', handleCellTooltipFocusIn);
    root.removeEventListener('focusout', handleCellTooltipFocusOut);
    cellHistoryTooltip.destroy();
  }

  function closeCellStatusMenu({ returnFocus = false } = {}) {
    const active = cellStatusMenu;
    if (!active) return;
    cellStatusMenu = null;
    document.removeEventListener('pointerdown', active.handleOutside, true);
    document.removeEventListener('scroll', active.handleScroll, true);
    window.removeEventListener('resize', active.handleResize);
    active.cellButton.classList.remove('is-status-menu-open');
    active.cellButton.removeAttribute('aria-controls');
    active.cellButton.setAttribute('aria-expanded', 'false');
    active.menu.destroy();
    if (returnFocus && active.cellButton.isConnected) requestAnimationFrame(() => active.cellButton.focus());
  }

  function positionCellStatusMenu(active) {
    const rect = active.cellButton.getBoundingClientRect();
    active.menu.element.style.left = `${rect.left}px`;
    active.menu.element.style.top = `${rect.top}px`;
    active.menu.element.style.width = `${rect.width}px`;
    active.menu.element.style.height = `${rect.height}px`;
    const popoverRect = active.menu.menu.getBoundingClientRect();
    const availableBelow = window.innerHeight - rect.bottom;
    active.menu.element.classList.toggle('is-placement-top', availableBelow < popoverRect.height + 8 && rect.top > popoverRect.height + 8);
    active.menu.element.classList.toggle('is-align-left', rect.right < popoverRect.width + 8);
  }

  function applyCellState(selection, state) {
    overrides.set(overrideKey(selection.workId, selection.rowId, selection.columnId), {
      stateId: state.id,
      lastChange: {
        changedBy: { ...DEMO_CURRENT_USER },
        changedAt: new Date().toISOString(),
      },
    });
    setCellVisual(selection, state.id);
    updatedAt = formatUpdatedAt();
    updateSummary();
    operationStatus.textContent = `${selection.rowLabel}, ${selection.columnLabel}: установлен статус «${state.label}».`;
    closeCellStatusMenu({ returnFocus: true });
  }

  function openCellStatusMenu({ work, detail, cellButton }) {
    if (!(cellButton instanceof HTMLButtonElement) || cellButton.disabled) return;
    cellHistoryTooltip.close();
    if (cellStatusMenu?.cellButton === cellButton) {
      closeCellStatusMenu({ returnFocus: true });
      return;
    }
    closeCellStatusMenu();

    const anchor = el('button', 'dch2-cell-status-menu__anchor');
    anchor.type = 'button';
    anchor.tabIndex = -1;
    anchor.setAttribute('aria-hidden', 'true');
    const selection = {
      workId: work.id,
      key: detail.key,
      rowId: detail.row.id,
      columnId: detail.column.id,
      rowLabel: detail.row.label,
      columnLabel: detail.column.label,
    };
    const menu = createMenu({
      label: `Выбор статуса: ${detail.row.label}, ${detail.column.label}`,
      trigger: anchor,
      className: 'dch2-cell-status-menu',
      items: EDITABLE_CELL_STATES.map(state => ({
        id: state.id,
        label: state.label,
        icon: actionSwatch(state),
        onSelect: () => applyCellState(selection, state),
      })),
    });
    const active = {
      key: overrideKey(work.id, detail.row.id, detail.column.id),
      cellButton,
      menu,
      handleOutside: event => {
        if (!menu.element.contains(event.target) && event.target !== cellButton) closeCellStatusMenu();
      },
      handleScroll: () => closeCellStatusMenu(),
      handleResize: () => closeCellStatusMenu(),
    };
    cellStatusMenu = active;
    document.body.append(menu.element);
    cellButton.classList.add('is-status-menu-open');
    cellButton.setAttribute('aria-haspopup', 'menu');
    cellButton.setAttribute('aria-controls', menu.menu.id);
    cellButton.setAttribute('aria-expanded', 'true');
    menu.menu.addEventListener('keydown', event => {
      if (event.key === 'Escape') requestAnimationFrame(() => closeCellStatusMenu({ returnFocus: true }));
      else if (event.key === 'Tab') requestAnimationFrame(() => closeCellStatusMenu());
    });
    menu.setOpen(true);
    positionCellStatusMenu(active);
    document.addEventListener('pointerdown', active.handleOutside, true);
    window.addEventListener('resize', active.handleResize);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (cellStatusMenu === active) document.addEventListener('scroll', active.handleScroll, true);
    }));
  }

  function closeOverlays() {
    cellHistoryTooltip.close();
    closeCellStatusMenu();
    if (groupModal?.element?.open) groupModal.close();
  }

  function createMetricCard({ label, value, leading, valueClass = '', planned = false }) {
    const valueElement = el('strong', `dch2-summary-card__value ${valueClass}`.trim(), value);
    const indicator = planned
      ? createTag({
        label: 'Планируется',
        color: 'gray',
        tone: 'light',
        className: 'dch2-summary-card__planned-tag',
      }).element
      : null;
    const card = createCard({ title: label, content: valueElement, leading, indicator, className: 'dch2-summary-card' });
    return { element: card.element, valueElement };
  }

  function createSummary() {
    const readiness = objectReadiness();
    const plan = period?.summary?.plan ?? Math.min(100, readiness + 7);
    const deviation = readiness - plan;
    const section = el('section', 'dch2-summary');
    const heading = el('h2', 'dch2-section-title', 'Статистика по дому');
    heading.id = 'dch2-summary-title';
    section.setAttribute('aria-labelledby', heading.id);

    const readyCard = createMetricCard({
      label: 'Готовность',
      value: `${readiness}%`,
      leading: icon('building-2', 18, 'dch2-summary-card__icon'),
    });
    const planCard = createMetricCard({ label: 'План', value: `${plan}%`, leading: icon('target', 18, 'dch2-summary-card__icon'), planned: true });
    const deviationIcon = icon(deviation < 0 ? 'trending-down' : 'trending-up', 18, `dch2-summary-card__icon ${deviation < 0 ? 'is-danger' : 'is-success'}`);
    const deviationCard = createMetricCard({ label: 'Отклонение', value: `${deviation > 0 ? '+' : ''}${deviation} п.п.`, leading: deviationIcon, valueClass: deviation < 0 ? 'is-danger' : 'is-success', planned: true });
    const updatedCard = createMetricCard({ label: 'Обновлено', value: '', leading: icon('clock-3', 18, 'dch2-summary-card__icon is-cyan'), planned: true });
    const [updatedDate, updatedTime] = updatedAt.split(' ');
    const updatedValue = el('span', 'dch2-updated-value');
    updatedValue.append(updatedDate || '', el('small', '', updatedTime || ''));
    updatedCard.valueElement.replaceChildren(updatedValue);

    Object.assign(summaryRefs, { readiness: readyCard.valueElement, plan: planCard.valueElement, deviation: deviationCard.valueElement, updated: updatedCard.valueElement });
    section.append(heading, readyCard.element, planCard.element, deviationCard.element, updatedCard.element);
    return section;
  }

  function updateSummary() {
    const readiness = objectReadiness();
    const plan = period?.summary?.plan ?? Math.min(100, readiness + 7);
    const deviation = readiness - plan;
    if (summaryRefs.readiness) summaryRefs.readiness.textContent = `${readiness}%`;
    if (summaryRefs.plan) summaryRefs.plan.textContent = `${plan}%`;
    if (summaryRefs.deviation) {
      summaryRefs.deviation.textContent = `${deviation > 0 ? '+' : ''}${deviation} п.п.`;
      summaryRefs.deviation.classList.toggle('is-danger', deviation < 0);
      summaryRefs.deviation.classList.toggle('is-success', deviation >= 0);
    }
    if (summaryRefs.updated) {
      const [date, time] = updatedAt.split(' ');
      const wrapper = el('span', 'dch2-updated-value');
      wrapper.append(date || '', el('small', '', time || ''));
      summaryRefs.updated.replaceChildren(wrapper);
    }
    const group = activeGroup();
    const groupValue = root.querySelector('[data-group-readiness]');
    if (groupValue && group) groupValue.textContent = `${groupReadiness(group)}%`;
    workReadinessRefs.forEach((reference, workId) => {
      const work = period?.works?.find(item => item.id === workId);
      if (!work) return;
      const readiness = readinessForWork(work);
      reference.valueElement.textContent = `${readiness}%`;
      reference.valueElement.classList.toggle('is-complete', readiness === 100);
      reference.accordionElement.classList.toggle('is-work-complete', readiness === 100);
    });
  }

  function createGroupPicker(trigger) {
    const group = activeGroup();
    let pendingId = group.id;
    const content = el('div', 'dch2-group-modal');
    const list = el('div', 'dch2-group-modal__list');
    list.setAttribute('role', 'radiogroup');
    list.setAttribute('aria-label', 'Доступные группы работ');
    let search;

    const renderList = query => {
      const normalized = String(query || '').trim().toLocaleLowerCase('ru-RU');
      const groups = groupModels().filter(item => !normalized || `${item.name} ${item.description}`.toLocaleLowerCase('ru-RU').includes(normalized));
      list.replaceChildren();
      groups.forEach(item => {
        const label = el('label', `dch2-group-option${item.id === pendingId ? ' is-selected' : ''}`);
        const radio = el('input');
        radio.type = 'radio';
        radio.name = 'digital-chessboard-work-group';
        radio.value = item.id;
        radio.checked = item.id === pendingId;
        const metaphor = el('span', 'dch2-group-option__icon');
        metaphor.append(icon('folder', 18));
        const copy = el('span', 'dch2-group-option__copy');
        copy.append(el('strong', '', item.name), el('span', '', item.description), el('small', '', `${item.start}–${item.end} · ${formatWorkCount(item.works.length)} · Готовность ${groupReadiness(item)}%`));
        radio.addEventListener('change', () => {
          pendingId = item.id;
          renderList(search.input.value);
        });
        label.append(metaphor, copy, radio);
        list.append(label);
      });
      if (!groups.length) list.append(el('p', 'dch2-group-modal__empty', 'Группы не найдены. Измените поисковый запрос.'));
      hydrateAdapterIcons();
    };

    search = createInput({ placeholder: 'Найти группу работ', className: 'dch2-group-search', leadingIcon: icon('search', 17), attributes: { 'aria-label': 'Поиск группы работ', autocomplete: 'off' }, onInput: renderList });
    content.append(search.element, list);
    groupModal = createModal({
      id: 'digital-chessboard-group-picker',
      title: 'Выбор группы работ',
      content,
      closeIcon: createDocumentPreviewIcon('x', 18),
      actions: [
        { label: 'Отменить', variant: 'outlined', onClick: () => groupModal.close() },
        { label: 'Выбрать группу', variant: 'primary', onClick: () => { groupModal.close(); selectGroup(pendingId); } },
      ],
    });
    document.body.append(groupModal.element);
    renderList('');
    groupModal.open(trigger);
    requestAnimationFrame(() => search.input.focus());
  }

  function createGroupControl() {
    const group = activeGroup();
    const groups = groupModels();
    const groupIndex = groups.findIndex(item => item.id === group.id);
    const control = el('section', 'dch2-group-control');
    const heading = el('h2', 'dch2-section-title', 'Выбор группы');
    heading.id = 'dch2-group-title';
    control.setAttribute('aria-labelledby', heading.id);

    const choice = el('div', 'dch2-group-control__choice');
    const chooser = el('button', 'dch2-group-control__chooser');
    chooser.type = 'button';
    chooser.setAttribute('aria-haspopup', 'dialog');
    chooser.setAttribute('aria-label', `Изменить группу работ. Текущая группа: ${group.name}`);
    const metaphor = el('span', 'dch2-group-control__metaphor');
    metaphor.append(icon('folder', 20));
    const copy = el('span', 'dch2-group-control__copy');
    copy.append(el('strong', '', group.name), el('span', '', group.description));
    chooser.append(metaphor, copy);
    chooser.addEventListener('click', event => createGroupPicker(event.currentTarget));

    const navigation = el('div', 'dch2-group-control__navigation');
    navigation.setAttribute('aria-label', 'Переключение групп работ');
    if (groupIndex > 0) {
      const previous = groups[groupIndex - 1];
      navigation.append(createButton({
        icon: createDocumentPreviewIcon('chevron-left', 16),
        iconOnly: true,
        ariaLabel: `Предыдущая группа: ${previous.name}`,
        variant: 'outlined',
        size: 'small',
        className: 'dch2-group-control__navigation-button',
        attributes: { title: `Предыдущая группа: ${previous.name}` },
        onClick: event => selectGroup(previous.id, {
          preserveChoiceHover: Boolean(event.currentTarget.closest('.dch2-group-card--choice')?.matches(':hover')),
        }),
      }));
    }
    if (groupIndex < groups.length - 1) {
      const next = groups[groupIndex + 1];
      navigation.append(createButton({
        icon: createDocumentPreviewIcon('chevron-right', 16),
        iconOnly: true,
        ariaLabel: `Следующая группа: ${next.name}`,
        variant: 'outlined',
        size: 'small',
        className: 'dch2-group-control__navigation-button',
        attributes: { title: `Следующая группа: ${next.name}` },
        onClick: event => selectGroup(next.id, {
          preserveChoiceHover: Boolean(event.currentTarget.closest('.dch2-group-card--choice')?.matches(':hover')),
        }),
      }));
    }
    choice.append(chooser, navigation);
    const choiceCard = createCard({
      content: choice,
      ariaLabel: `Выбранная группа работ: ${group.name}`,
      className: 'dch2-group-card dch2-group-card--choice',
    }).element;
    if (retainGroupChoiceHover) {
      choiceCard.classList.add('is-hover-retained');
      const releaseRetainedHover = () => {
        retainGroupChoiceHover = false;
        choiceCard.classList.remove('is-hover-retained');
      };
      choiceCard.addEventListener('pointerleave', releaseRetainedHover, { once: true });
      window.setTimeout(() => {
        if (!choiceCard.matches(':hover')) releaseRetainedHover();
      }, 240);
    }

    const details = el('div', 'dch2-group-control__details');
    const readyBlock = el('div', 'dch2-group-control__item');
    const readyPair = createParameterPair({ label: 'Готовность', value: `${groupReadiness(group)}%`, truncate: true });
    const readyValue = readyPair.valueElement;
    readyValue.dataset.groupReadiness = '';
    readyBlock.append(readyPair.element);
    const periodBlock = el('div', 'dch2-group-control__item');
    const periodPair = createParameterPair({
      label: 'Период группы',
      value: `${group.start}–${group.end}`,
      truncate: true,
    });
    periodBlock.append(periodPair.element);
    details.append(readyBlock, periodBlock);
    const detailsCard = createCard({
      content: details,
      ariaLabel: 'Параметры выбранной группы работ',
      className: 'dch2-group-card dch2-group-card--details',
    }).element;
    control.append(heading, choiceCard, detailsCard);
    return control;
  }

  function createMatrix(work) {
    const geometry = displayGeometry();
    const rows = Array.from({ length: geometry.floorCount }, (_, index) => ({ id: String(geometry.floorCount - index), label: String(geometry.floorCount - index) }));
    const columns = displaySections(work).map(section => ({
      id: section.id,
      label: section.name,
      floorCount: section.floorCount,
      isDisplayPlaceholder: Boolean(section.isDisplayPlaceholder),
    }));
    const cells = {};
    rows.forEach(row => columns.forEach(column => {
      const state = cellState(work, row.id, column.id);
      const original = work.cells[`${row.id}:${column.id}`];
      const key = createChessboardCellKey(row.id, column.id);
      const isPhysicallyAbsent = !column.isDisplayPlaceholder && Number(row.id) > column.floorCount;
      if (column.isDisplayPlaceholder) cells[key] = {
        state: 'display-placeholder',
        label: 'Недоступно для объекта',
        tone: 'neutral',
        disabled: true,
      };
      else if (isPhysicallyAbsent || !state || original?.status === 'not-applicable') cells[key] = {
        state: '',
        label: 'Пересечение отсутствует',
        tone: 'neutral',
        appearance: 'absent',
        disabled: true,
      };
      else {
        const meta = stateMeta(state);
        cells[key] = { state, label: meta.label, tone: meta.tone, pattern: meta.pattern, text: '' };
      }
    }));

    const boardApi = createChessboard({
      label: `${work.code} ${work.name}`,
      rowHeaderLabel: object.rowLabel,
      rows,
      columns,
      cells,
      states: CELL_STATES,
      selectionMode: 'none',
      showLegend: false,
      showCellTitle: false,
      className: 'dch2-matrix',
      attributes: { style: `--ds-chessboard-min-width:${MATRIX_ROW_HEADER_WIDTH + columns.length * MATRIX_COLUMN_WIDTH}px` },
      onCellActivate: detail => openCellStatusMenu({ work, detail, cellButton: boardApi.getCellElement(detail.key) }),
    });
    matrixScrollKeys.set(work.id, matrixScrollKey(work));
    boardApi.scroll.addEventListener('scroll', () => rememberMatrixScrollPosition(work.id), { passive: true });
    boardApi.element.querySelectorAll('.ds-chessboard__cell:not(:disabled)').forEach(cellButton => {
      cellButton.setAttribute('aria-haspopup', 'menu');
      cellButton.setAttribute('aria-expanded', 'false');
      cellButton.addEventListener('keydown', event => {
        if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
          event.preventDefault();
          cellButton.click();
        }
      });
    });
    rows.forEach(row => columns.forEach(column => {
      const cellButton = boardApi.getCellElement(createChessboardCellKey(row.id, column.id));
      if (cellButton && !cellButton.disabled && !column.isDisplayPlaceholder) {
        cellTooltipData.set(cellButton, { work, row, column });
      }
    }));
    boardApis.set(work.id, boardApi);
    return boardApi.element;
  }

  function createAccordionLegend() {
    const legend = el('ul', 'dch2-accordion-legend');
    legend.setAttribute('aria-label', 'Легенда статусов ячеек');
    CELL_STATES.forEach(state => {
      const item = el('li', 'dch2-accordion-legend__item');
      item.append(actionSwatch(state), el('span', '', state.label));
      legend.append(item);
    });
    return legend;
  }

  function createWorkDescription(work, readiness, groupName) {
    const description = el('span', 'dch2-work-description');
    let readinessValue;
    [
      ['Готовность', `${readiness}%`, 'dch2-work-description__item--readiness'],
      ['Плановый срок', `${work.plannedStart}–${work.plannedEnd}`, 'dch2-work-description__item--period'],
      ['Подрядчик', work.contractor, 'dch2-work-description__item--contractor'],
      ['Группа работ', groupName, 'dch2-work-description__item--fullscreen'],
    ].forEach(([label, value, className = '']) => {
      const item = el('span', `dch2-work-description__item ${className}`.trim());
      const valueElement = el('span', 'dch2-work-description__value', value);
      if (label === 'Готовность') valueElement.classList.toggle('is-complete', readiness === 100);
      if (label === 'Подрядчик') valueElement.title = value;
      item.append(el('span', 'dch2-work-description__label', `${label}:`), valueElement);
      description.append(item);
      if (label === 'Готовность') readinessValue = valueElement;
    });
    return { element: description, readinessValue };
  }

  function prefersReducedMotion() {
    return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  }

  function cancelFullscreenAnimation() {
    const animation = fullscreenAnimation;
    fullscreenAnimation = null;
    animation?.cancel();
  }

  function workFullscreenIcon(active) {
    return createDocumentPreviewIcon(active ? 'minimize-2' : 'maximize-2', 18);
  }

  function syncWorkFullscreenToggle(reference, active) {
    const action = active ? 'Вернуть в список работ' : 'Открыть работу на весь экран';
    reference.fullscreenButton.replaceChildren(workFullscreenIcon(active));
    reference.fullscreenButton.setAttribute('aria-label', `${action}: ${reference.work.code} ${reference.work.name}`);
    reference.fullscreenButton.setAttribute('aria-pressed', String(active));
    reference.fullscreenButton.title = action;
  }

  function animateWorkFullscreen(reference, sourceRect, entering = true) {
    cancelFullscreenAnimation();
    if (prefersReducedMotion() || !sourceRect?.width || !sourceRect?.height) return Promise.resolve();

    const targetWidth = Math.max(1, window.innerWidth);
    const targetHeight = Math.max(1, window.innerHeight);
    const transform = `translate3d(${sourceRect.left}px, ${sourceRect.top}px, 0) scale(${sourceRect.width / targetWidth}, ${sourceRect.height / targetHeight})`;
    const keyframes = entering
      ? [
        { opacity: 0.82, transform, transformOrigin: 'top left' },
        { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)', transformOrigin: 'top left' },
      ]
      : [
        { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)', transformOrigin: 'top left' },
        { opacity: 0.82, transform, transformOrigin: 'top left' },
      ];
    const animation = reference.element.animate(keyframes, {
      duration: WORK_FULLSCREEN_TRANSITION_MS,
      easing: entering ? 'cubic-bezier(.2,.75,.25,1)' : 'cubic-bezier(.4,0,.6,1)',
      fill: 'both',
    });
    fullscreenAnimation = animation;
    return animation.finished.catch(() => {}).finally(() => {
      if (fullscreenAnimation === animation) fullscreenAnimation = null;
      // `fill: both` keeps the last keyframe active after `finished` resolves.
      // Release that effect before fullscreen classes are removed so the
      // accordion returns to its normal slot instead of retaining exit scale.
      animation.cancel();
    });
  }

  function fullscreenFocusableElements() {
    const reference = fullscreenSession && workAccordionRefs.get(fullscreenSession.workId);
    if (!reference) return [];
    const roots = [reference.element];
    if (cellStatusMenu?.element?.isConnected && !cellStatusMenu.element.hidden) roots.push(cellStatusMenu.element);
    return roots.flatMap(container => [...container.querySelectorAll(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    )]).filter(element => !element.hidden && element.getClientRects().length > 0);
  }

  function handleWorkFullscreenKeydown(event) {
    if (!fullscreenSession) return;
    if (event.key === 'Escape') {
      if (cellStatusMenu) return;
      event.preventDefault();
      exitWorkFullscreen();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = fullscreenFocusableElements();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function restoreWorkReference(reference, session = fullscreenSession) {
    if (!reference) return;
    rememberMatrixScrollPosition(reference.work.id);
    reference.element.classList.remove('is-work-fullscreen');
    reference.element.removeAttribute('role');
    reference.element.removeAttribute('aria-modal');
    reference.element.removeAttribute('aria-labelledby');
    reference.element.style.removeProperty('--dch2-work-sticky-shift');
    reference.slot.classList.remove('has-fullscreen-work');
    reference.slot.style.removeProperty('height');
    reference.accordion.trigger.removeAttribute('aria-disabled');
    reference.accordion.trigger.removeAttribute('tabindex');
    reference.accordion.setOpen(session?.originalOpenStates.get(reference.work.id) ?? reference.accordion.isOpen());
    if (reference.accordion.isOpen()) restoreMatrixScrollPosition(reference.work.id);
    syncWorkFullscreenToggle(reference, false);
  }

  function activateWorkFullscreenReference(reference, sourceRect, { animate = true, focus = true } = {}) {
    rememberMatrixScrollPosition(reference.work.id);
    reference.slot.style.height = `${Math.max(1, sourceRect.height)}px`;
    reference.slot.classList.add('has-fullscreen-work');
    reference.accordion.setOpen(true);
    reference.element.style.setProperty('--dch2-work-sticky-shift', '0px');
    reference.element.classList.remove('is-work-sticky');
    reference.element.classList.add('is-work-fullscreen');
    restoreMatrixScrollPosition(reference.work.id);
    reference.element.setAttribute('role', 'dialog');
    reference.element.setAttribute('aria-modal', 'true');
    reference.element.setAttribute('aria-labelledby', reference.accordion.titleElement.id);
    reference.accordion.trigger.setAttribute('aria-disabled', 'true');
    reference.accordion.trigger.tabIndex = -1;
    syncWorkFullscreenToggle(reference, true);
    fullscreenSession.workId = reference.work.id;
    fullscreenSession.originRect = sourceRect;
    operationStatus && (operationStatus.textContent = `Работа ${reference.work.code} ${reference.work.name} открыта на весь экран.`);
    if (focus) reference.fullscreenButton.focus({ preventScroll: true });
    if (animate) animateWorkFullscreen(reference, sourceRect, true);
  }

  function clearAbandonedWorkFullscreenState() {
    cancelFullscreenAnimation();
    workAccordionRefs.forEach(reference => {
      if (reference.element.classList.contains('is-work-fullscreen') || reference.slot.classList.contains('has-fullscreen-work')) {
        restoreWorkReference(reference, null);
      }
    });
    root.classList.remove('has-work-fullscreen');
    workStickyScrollHost?.classList.remove('is-dch2-work-fullscreen', 'is-dch2-work-fullscreen-restoring');
    document.removeEventListener('keydown', handleWorkFullscreenKeydown, true);
  }

  function enterWorkFullscreen(workId) {
    const reference = workAccordionRefs.get(workId);
    if (!reference || fullscreenSession) return;
    clearAbandonedWorkFullscreenState();
    closeOverlays();
    cancelSmoothWheelMotion();
    cancelPendingWheelReconciliations();
    const sourceRect = reference.element.getBoundingClientRect();
    fullscreenSession = {
      workId,
      originRect: sourceRect,
      outerScrollTop: workStickyScrollHost?.scrollTop ?? 0,
      returnFocus: document.activeElement instanceof HTMLElement ? document.activeElement : reference.fullscreenButton,
      originalOpenStates: new Map([...workAccordionRefs].map(([id, item]) => [id, item.accordion.isOpen()])),
    };
    root.classList.add('has-work-fullscreen');
    workStickyScrollHost?.classList.add('is-dch2-work-fullscreen');
    document.addEventListener('keydown', handleWorkFullscreenKeydown, true);
    activateWorkFullscreenReference(reference, sourceRect);
  }

  function switchFullscreenWork(nextIndex) {
    if (!fullscreenSession || fullscreenSession.closing || fullscreenSession.switching) return;
    const session = fullscreenSession;
    const references = [...workAccordionRefs.values()];
    const nextReference = references[nextIndex];
    const currentReference = workAccordionRefs.get(session.workId);
    if (!nextReference || nextReference === currentReference) return;

    session.switching = true;
    try {
      closeOverlays();
      cancelFullscreenAnimation();
      const sourceRect = nextReference.element.getBoundingClientRect();
      const outerScrollTop = workStickyScrollHost?.scrollTop;

      // Prepare the next fixed surface before releasing the current one so
      // the viewport never exposes the underlying accordion list between jobs.
      activateWorkFullscreenReference(nextReference, sourceRect, { animate: false, focus: false });
      restoreWorkReference(currentReference, session);
      if (workStickyScrollHost && Number.isFinite(outerScrollTop)) workStickyScrollHost.scrollTop = outerScrollTop;
      session.returnFocus = nextReference.fullscreenButton;
      nextReference.fullscreenButton.focus({ preventScroll: true });
    } finally {
      if (fullscreenSession === session) session.switching = false;
    }
  }

  async function exitWorkFullscreen({ immediate = false, restoreFocus = true } = {}) {
    if (!fullscreenSession) return;
    if (fullscreenSession.closing && !immediate) return;
    fullscreenSession.closing = true;
    const session = fullscreenSession;
    const reference = workAccordionRefs.get(session.workId);
    cancelSmoothWheelMotion();
    cancelPendingWheelReconciliations();
    closeOverlays();
    if (reference && !immediate) {
      if (workStickyScrollHost) workStickyScrollHost.scrollTop = session.outerScrollTop;
      await animateWorkFullscreen(reference, session.originRect, false);
    }
    if (fullscreenSession !== session) return;
    cancelFullscreenAnimation();
    workAccordionRefs.forEach(item => restoreWorkReference(item, session));
    root.classList.remove('has-work-fullscreen');
    workStickyScrollHost?.classList.remove('is-dch2-work-fullscreen');
    workStickyScrollHost?.classList.add('is-dch2-work-fullscreen-restoring');
    document.removeEventListener('keydown', handleWorkFullscreenKeydown, true);
    fullscreenSession = null;
    if (!restoreFocus && reference?.element.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    if (workStickyScrollHost) {
      workStickyScrollHost.scrollTop = session.outerScrollTop;
      if (restoreFocus && session.returnFocus?.isConnected) session.returnFocus.focus({ preventScroll: true });
      window.requestAnimationFrame(() => {
        if (!workStickyScrollHost) return;
        if (destroyed || fullscreenSession) {
          workStickyScrollHost.classList.remove('is-dch2-work-fullscreen-restoring');
          return;
        }
        workStickyScrollHost.scrollTop = session.outerScrollTop;
        window.requestAnimationFrame(() => {
          if (!workStickyScrollHost) return;
          if (destroyed || fullscreenSession) {
            workStickyScrollHost.classList.remove('is-dch2-work-fullscreen-restoring');
            return;
          }
          workStickyScrollHost.scrollTop = session.outerScrollTop;
          workStickyScrollHost.classList.remove('is-dch2-work-fullscreen-restoring');
          scheduleWorkStickyLayers();
        });
      });
    } else {
      scheduleWorkStickyLayers();
      if (restoreFocus && session.returnFocus?.isConnected) session.returnFocus.focus({ preventScroll: true });
    }
    operationStatus && (operationStatus.textContent = 'Полноэкранный режим работы закрыт.');
  }

  function createWorkFullscreenNavigation(work, index, total) {
    const navigation = el('nav', 'dch2-work-fullscreen-navigation');
    navigation.setAttribute('aria-label', 'Переключение между работами группы');
    const previous = createButton({
      icon: createDocumentPreviewIcon('chevron-left', 18),
      iconOnly: true,
      ariaLabel: 'Предыдущая работа',
      variant: 'outlined',
      size: 'small',
      disabled: index === 0,
      className: 'dch2-work-fullscreen-navigation__button',
      onClick: event => {
        event.stopPropagation();
        switchFullscreenWork(index - 1);
      },
    });
    const position = el('span', 'dch2-work-fullscreen-navigation__position', `${index + 1} из ${total}`);
    position.setAttribute('aria-label', `Работа ${index + 1} из ${total}`);
    const next = createButton({
      icon: createDocumentPreviewIcon('chevron-right', 18),
      iconOnly: true,
      ariaLabel: 'Следующая работа',
      variant: 'outlined',
      size: 'small',
      disabled: index === total - 1,
      className: 'dch2-work-fullscreen-navigation__button',
      onClick: event => {
        event.stopPropagation();
        switchFullscreenWork(index + 1);
      },
    });
    navigation.append(previous, position, next);
    return navigation;
  }

  function createWorkAccordion(work, index, group) {
    const readiness = readinessForWork(work);
    const description = createWorkDescription(work, readiness, group.name);
    const legendPanel = el('aside', 'dch2-work-legend');
    legendPanel.setAttribute('aria-label', `Обозначения статусов работы «${work.name}»`);
    legendPanel.append(createAccordionLegend());
    const layout = el('div', 'dch2-work-content');
    layout.append(legendPanel, createMatrix(work));
    const completionMark = el('span', 'dch2-work-complete-mark');
    const accordion = createAccordion({
      id: `dch2-work-${work.id}`,
      title: `${work.code} ${work.name}`,
      description: description.element,
      icon: completionMark,
      content: layout,
      open: index === 0,
      panelPadding: 'none',
      className: `dch2-work-accordion${readiness === 100 ? ' is-work-complete' : ''}`,
      headingLevel: 3,
      onToggle: open => {
        if (!open) closeCellStatusMenu();
        if (open) restoreMatrixScrollPosition(work.id);
        scheduleWorkStickyLayers();
      },
    });
    accordion.leading.querySelector('.ds-accordion__metaphor')?.append(
      icon('briefcase-business', 18, 'dch2-work-fullscreen-metaphor'),
    );
    const slot = el('div', 'dch2-work-slot');
    const fullscreenNavigation = createWorkFullscreenNavigation(work, index, group.works.length);
    const fullscreenButton = createButton({
      icon: workFullscreenIcon(false),
      iconOnly: true,
      ariaLabel: `Открыть работу на весь экран: ${work.code} ${work.name}`,
      variant: 'outlined',
      size: 'small',
      className: 'dch2-work-fullscreen-toggle',
      attributes: {
        'aria-pressed': 'false',
        title: 'Открыть работу на весь экран',
      },
      onClick: event => {
        event.stopPropagation();
        if (fullscreenSession?.closing || fullscreenSession?.switching) return;
        if (fullscreenSession?.workId === work.id) {
          exitWorkFullscreen({ restoreFocus: event.detail === 0 });
        }
        else if (!fullscreenSession) enterWorkFullscreen(work.id);
      },
    });
    accordion.trigger.addEventListener('click', event => {
      if (accordion.isOpen()) rememberMatrixScrollPosition(work.id);
      if (fullscreenSession?.workId !== work.id) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    accordion.header.append(fullscreenNavigation, fullscreenButton);
    slot.append(accordion.element);
    workAccordionRefs.set(work.id, {
      accordion,
      element: accordion.element,
      fullscreenButton,
      fullscreenNavigation,
      index,
      slot,
      work,
    });
    workReadinessRefs.set(work.id, {
      valueElement: description.readinessValue,
      accordionElement: accordion.element,
    });
    return slot;
  }

  function createChessboardPanel() {
    boardApis.clear();
    workReadinessRefs.clear();
    workAccordionRefs.clear();
    matrixScrollKeys.clear();
    const panel = el('div', 'dch2-chessboard-view');
    const group = activeGroup();
    panel.append(createSummary(), createGroupControl());
    const works = el('section', 'dch2-work-list');
    const worksHeading = el('h2', 'dch2-section-title', 'Работы');
    worksHeading.id = 'dch2-works-title';
    works.setAttribute('aria-labelledby', worksHeading.id);
    works.append(worksHeading);
    group.works.forEach((work, index) => works.append(createWorkAccordion(work, index, group)));
    panel.append(works);
    operationStatus = el('span', 'ds-visually-hidden');
    operationStatus.setAttribute('role', 'status');
    operationStatus.setAttribute('aria-live', 'polite');
    panel.append(operationStatus);
    return panel;
  }

  function createWorksPanel() {
    const rows = groupModels().flatMap(group => group.works.map(work => ({ code: work.code, name: work.name, group: group.name, contractor: work.contractor, period: `${work.plannedStart}–${work.plannedEnd}` })));
    const heading = el('header', 'dch2-secondary-heading');
    heading.append(el('h2', '', 'Работы объекта'), el('p', '', 'Состав работ и параметры выбранного объекта строительства.'));
    const table = createTable({
      caption: 'Работы объекта', captionHidden: true, scrollable: true, className: 'dch2-works-table',
      columns: [
        { key: 'code', header: 'Код', width: 72 }, { key: 'name', header: 'Работа', minWidth: 210 },
        { key: 'group', header: 'Группа', minWidth: 200 }, { key: 'contractor', header: 'Подрядчик', minWidth: 140 },
        { key: 'period', header: 'Плановый срок', minWidth: 190 },
      ], rows, rowSize: 'small',
    });
    const panel = el('section', 'dch2-secondary-panel');
    panel.append(heading, table.element);
    return panel;
  }

  function createInformationPanel() {
    const panel = el('section', 'dch2-information');
    const symbol = el('span', 'dch2-information__icon');
    symbol.append(icon('users', 28));
    panel.append(symbol, el('h2', '', 'Информация об объекте'), el('p', '', `Каркас вкладки предусмотрен для объекта «${object?.name || 'выбранный объект'}». Содержимое не входит в MVP встречи и не заполнено фиктивными данными.`));
    return panel;
  }

  function renderContextEmptyState() {
    const projectSelected = context.type === 'project';
    const title = projectSelected ? 'Выберите очередь и объект строительства' : 'Выберите объект строительства';
    const description = projectSelected
      ? 'Раскройте проект, затем очередь в дереве слева и выберите объект строительства, чтобы открыть шахматку.'
      : 'Раскройте выбранную очередь в дереве слева и выберите объект строительства, чтобы открыть шахматку.';
    const empty = createEmptyState({
      id: 'digital-chessboard-context-empty',
      icon: icon('building-2', 32),
      title,
      description,
      size: 'large',
      surface: 'plain',
      role: 'status',
      live: 'polite',
      className: 'dch2-context-empty',
    });
    root.replaceChildren(empty.element);
    hydrateAdapterIcons();
  }

  function hydrateAdapterIcons() {
    window.lucide?.createIcons?.({
      attrs: {
        'stroke-width': '2',
      },
    });
  }

  function render() {
    if (destroyed) return;
    rememberAllMatrixScrollPositions();
    if (fullscreenSession) exitWorkFullscreen({ immediate: true, restoreFocus: false });
    cancelSmoothWheelMotion();
    cancelPendingWheelReconciliations();
    closeOverlays();
    groupModal?.element?.remove();
    groupModal = null;
    if (!object || !period) {
      renderContextEmptyState();
      return;
    }
    const tabs = createTabs({
      id: 'digital-chessboard-tabs', label: 'Разделы объекта строительства', value: activeTab, className: 'dch2-tabs',
      items: [
        { value: 'information', label: 'Информация', content: createInformationPanel() },
        { value: 'works', label: 'Работы', content: createWorksPanel() },
        { value: 'chessboard', label: 'Шахматка', content: createChessboardPanel() },
      ],
      onChange: value => {
        activeTab = value;
        if (value !== 'chessboard') {
          if (fullscreenSession) exitWorkFullscreen({ immediate: true, restoreFocus: false });
          closeOverlays();
        } else {
          restoreOpenMatrixScrollPositions();
        }
        scheduleWorkStickyLayers();
      },
    });
    root.replaceChildren(tabs.element);
    if (activeTab === 'chessboard') restoreOpenMatrixScrollPositions();
    hydrateAdapterIcons();
    refreshWorkStickyGeometryObservers();
    scheduleWorkStickyLayers();
  }

  hydrateModel();
  bindWorkStickyLayers();
  bindCellHistoryTooltip();
  render();

  return Object.freeze({
    setContext(nextContext) {
      context = normalizeContext(nextContext);
      model = resolveModel(context);
      overrides.clear();
      activeGroupId = GROUP_DEFINITIONS[0].id;
      updatedAt = formatUpdatedAt();
      hydrateModel();
      render();
    },
    getContext: () => ({ ...context }),
    closeOverlays,
    destroy() {
      if (destroyed) return;
      if (fullscreenSession) exitWorkFullscreen({ immediate: true, restoreFocus: false });
      closeOverlays();
      groupModal?.element?.remove();
      unbindWorkStickyLayers();
      unbindCellHistoryTooltip();
      root.replaceChildren();
      destroyed = true;
    },
  });
}
