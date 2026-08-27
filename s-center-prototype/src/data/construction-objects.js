export const projects = [
  { value: 'alkhimovo', label: 'АЛХИМОВО' },
  { value: 'kommunarka', label: 'АДЦ КОММУНАРКА' },
  { value: 'andreevskiy-2', label: 'АНДРЕЕВСКИЙ ЛЕС - 2' },
  { value: 'andreevskiy-3', label: 'АНДРЕЕВСКИЙ ЛЕС - 3' },
];

const object = (id, name, queue, kind = 'Корпус', type = 'МКД') => ({
  id,
  name,
  queue,
  kind,
  type,
  selected: true,
});

export const constructionObjectsByProject = {
  alkhimovo: [
    object('alkh-1-1', 'АЛХ_1 оч_1 ж.д.', '1 очередь'),
    object('alkh-1-2', 'АЛХ_1 оч_2 ж.д.', '1 очередь'),
    object('alkh-dou', 'Алхимово МКД', '1 очередь', 'ДОУ'),
    object('alkh-2-1-4', 'АЛХ_2 оч_1 эт_4 ж.д.', '2 очередь / 1 этап'),
    object('alkh-2-1-5', 'АЛХ_2 оч_1 эт_5 ж.д.', '2 очередь / 1 этап'),
    object('alkh-2-1-6', 'АЛХ_2 оч_1 эт_6 ж.д.', '2 очередь / 1 этап'),
    object('alkh-2-2-31', 'АЛХ_2 оч_2 эт_3.1 ж.д.', '2 очередь / 2 этап'),
    object('alkh-2-2-32', 'АЛХ_2 оч_2 эт_3.2 ж.д.', '2 очередь / 2 этап'),
    object('alkh-3-7', 'АЛХ_3 оч_7 ж.д.', '3 очередь'),
    object('alkh-3-8', 'АЛХ_3 оч_8 ж.д.', '3 очередь'),
    object('alkh-4-9', 'АЛХ_4 оч_9 ж.д.', '4 очередь / 1 этап'),
    object('alkh-4-10', 'АЛХ_4 оч_10 ж.д.', '4 очередь / 1 этап'),
    object('alkh-4-11', 'АЛХ_4 оч_11 ж.д.', '4 очередь / 2 этап'),
    object('alkh-4-12', 'АЛХ_4 оч_12 ж.д.', '4 очередь / 2 этап'),
    object('alkh-5-13', 'АЛХ_5 оч_13 ж.д.', '5 очередь'),
    object('alkh-5-14', 'АЛХ_5 оч_14 ж.д.', '5 очередь'),
    object('alkh-dou-1', 'ДОУ 1', 'ДОУ 1', 'ДОУ'),
    object('alkh-dou-2', 'ДОУ 2', 'ДОУ 2', 'ДОУ'),
    object('alkh-kos', 'КОС Алхимово', 'Инфраструктура', 'КОС'),
    object('alkh-bok', 'БОК Алхимово', 'Инфраструктура', 'БОК'),
  ],
  kommunarka: [
    object('kommunarka-1', 'АДЦ Коммунарка, корпус 1', '1 очередь'),
    object('kommunarka-2', 'АДЦ Коммунарка, корпус 2', '1 очередь'),
    object('kommunarka-dou', 'АДЦ Коммунарка, ДОУ', '2 очередь', 'ДОУ'),
  ],
  'andreevskiy-2': [
    object('andreevskiy-2-1', 'АНДР_2 корпус 1', '1 очередь'),
    object('andreevskiy-2-2', 'АНДР_2 корпус 2', '1 очередь'),
  ],
  'andreevskiy-3': [
    object('andreevskiy-3-1', 'АНДР_3 корпус 1', '1 очередь'),
    object('andreevskiy-3-2', 'АНДР_3 корпус 2', '2 очередь'),
  ],
};
