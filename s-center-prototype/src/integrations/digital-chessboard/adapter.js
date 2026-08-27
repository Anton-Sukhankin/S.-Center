import { createDigitalChessboardFeature } from './feature/digital-chessboard.js';

const integrationName = 'Digital Chessboard';

function normalizeContext(context) {
  if (context?.type === 'queue' && context.projectId) {
    return {
      type: 'queue',
      id: String(context.id),
      projectId: String(context.projectId),
      ...(context.objectId ? { objectId: String(context.objectId) } : {}),
      ...(context.treeNodeId ? { treeNodeId: String(context.treeNodeId) } : {}),
      ...(context.objectName ? { objectName: String(context.objectName) } : {}),
    };
  }
  if (context?.type === 'project' && context.id) {
    return { type: 'project', id: String(context.id) };
  }
  throw new Error(`${integrationName}: ожидается контекст проекта или очереди.`);
}

export function mountDigitalChessboard(root, options = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new TypeError(`${integrationName}: корневой HTMLElement обязателен.`);
  }

  let destroyed = false;
  let context = normalizeContext(options.context);
  const feature = createDigitalChessboardFeature(root, { context });

  return Object.freeze({
    setContext(nextContext) {
      if (destroyed) return;
      context = normalizeContext(nextContext);
      feature.setContext(context);
    },
    getContext() {
      return { ...context };
    },
    closeOverlays() {
      if (!destroyed) feature.closeOverlays();
    },
    destroy() {
      if (destroyed) return;
      feature.destroy();
      destroyed = true;
    },
  });
}
