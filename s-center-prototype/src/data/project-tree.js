function createQueue(id, label, itemPrefix, count, projectId, labels = []) {
  const context = { type: 'queue', id, projectId };
  const objectIds = ['house-1', 'house-2', 'house-3', 'parking', 'kindergarten'];
  return {
    id,
    label,
    context,
    children: Array.from({ length: count }, (_, index) => {
      const nodeId = `${id}-item-${index + 1}`;
      const objectName = labels[index] || `${itemPrefix}_${index + 1} ж.д.`;
      return {
        id: nodeId,
        label: objectName,
        context: {
          ...context,
          objectId: objectIds[index % objectIds.length],
          treeNodeId: nodeId,
          objectName,
        },
        children: [],
      };
    }),
  };
}

function createProject(id, label, code, queues) {
  return {
    id,
    label,
    context: { type: 'project', id },
    children: queues.map((queue, index) => createQueue(
      `${id}-${queue.id || `queue-${index + 1}`}`,
      queue.label,
      queue.itemPrefix || `${code}_${index + 1} оч`,
      queue.count,
      id,
      queue.labels,
    )),
  };
}

const alkhimovo = {
  id: 'alkhimovo',
  label: 'АЛХИМОВО',
  context: { type: 'project', id: 'alkhimovo' },
  children: [
    createQueue('queue-1', '1 очередь', 'АЛХ_1 оч', 3, 'alkhimovo', [
      'АЛХ_1 оч_1 ж.д.',
      'АЛХ_1 оч_2 ж.д.',
      'Алхимово МКД',
    ]),
    createQueue('queue-2-1', '2.1 очередь', 'АЛХ_2 оч_1', 6, 'alkhimovo'),
    createQueue('queue-2-2', '2.2 очередь', 'АЛХ_2 оч_2', 4, 'alkhimovo'),
    createQueue('queue-3', '3 очередь', 'АЛХ_3 оч', 5, 'alkhimovo'),
    createQueue('queue-4-1', '4.1 очередь', 'АЛХ_4 оч_1', 4, 'alkhimovo'),
    createQueue('queue-4-2', '4.2 очередь', 'АЛХ_4 оч_2', 7, 'alkhimovo'),
    createQueue('queue-5', '5 очередь', 'АЛХ_5 оч', 5, 'alkhimovo'),
    createQueue('dou-1', 'ДОУ 1', 'АЛХ ДОУ_1', 3, 'alkhimovo'),
    createQueue('dou-2', 'ДОУ 2', 'АЛХ ДОУ_2', 4, 'alkhimovo'),
  ],
};

export const initialProjectTreeContext = {
  selectedId: 'queue-1-item-1',
  context: {
    type: 'queue',
    id: 'queue-1',
    projectId: 'alkhimovo',
    objectId: 'house-1',
    treeNodeId: 'queue-1-item-1',
    objectName: 'АЛХ_1 оч_1 ж.д.',
  },
};

export const projectNodes = [
  createProject('adc-kommunarka', 'АДЦ КОММУНАРКА', 'АДЦ', [
    { label: '1 очередь', count: 4 },
    { label: '2 очередь', count: 6 },
    { label: '3 очередь', count: 3 },
    { label: 'ДОУ', count: 4 },
  ]),
  alkhimovo,
  createProject('andreevskiy-2', 'АНДРЕЕВСКИЙ ЛЕС - 2', 'АНДР_2', [
    { label: '1 очередь', count: 5 },
    { label: '2 очередь', count: 4 },
    { label: '3 очередь', count: 7 },
    { label: '4 очередь', count: 3 },
    { label: 'Инфраструктура', count: 4 },
  ]),
  createProject('andreevskiy-3', 'АНДРЕЕВСКИЙ ЛЕС - 3', 'АНДР_3', [
    { label: '1 очередь', count: 3 },
    { label: '2 очередь', count: 5 },
    { label: '3 очередь', count: 4 },
  ]),
  createProject('bogdanovskiy', 'БОГДАНОВСКИЙ ЛЕС', 'БГД', [
    { label: '1 очередь', count: 6 },
    { label: '2 очередь', count: 5 },
    { label: '3 очередь', count: 4 },
    { label: '4 очередь', count: 7 },
    { label: 'ДОУ', count: 3 },
    { label: 'Инфраструктура', count: 4 },
  ]),
  createProject('bolshoe-putilkovo', 'БОЛЬШОЕ ПУТИЛКОВО', 'БПТ', [
    { label: '1 очередь', count: 4 },
    { label: '2 очередь', count: 3 },
    { label: '3 очередь', count: 6 },
    { label: '4 очередь', count: 5 },
  ]),
  createProject('vereyskaya-41', 'ВЕРЕЙСКАЯ 41', 'ВЕР_41', [
    { label: '1 очередь', count: 3 },
    { label: '2 очередь', count: 4 },
    { label: '3 очередь', count: 5 },
    { label: '4 очередь', count: 6 },
    { label: '5 очередь', count: 7 },
    { label: 'ДОУ', count: 3 },
    { label: 'Инфраструктура', count: 4 },
  ]),
  createProject('veresk', 'ВЕРЕСК', 'ВРС', [
    { label: '1 очередь', count: 5 },
    { label: '2 очередь', count: 4 },
    { label: '3 очередь', count: 3 },
  ]),
  createProject('vesna', 'ВЕСНА В ЗАРЕЧЬЕ', 'ВЗР', [
    { label: '1 очередь', count: 7 },
    { label: '2 очередь', count: 5 },
    { label: '3 очередь', count: 4 },
    { label: '4 очередь', count: 3 },
    { label: 'ДОУ', count: 4 },
  ]),
  createProject('vladivostok-sabaneeva', 'ВЛАДИВОСТОК, САБАНЕЕВА 125', 'ВЛД', [
    { label: '1 очередь', count: 4 },
    { label: '2 очередь', count: 6 },
    { label: '3 очередь', count: 5 },
    { label: '4 очередь', count: 3 },
    { label: '5 очередь', count: 7 },
    { label: 'Инфраструктура', count: 4 },
  ]),
];
