export type CellState = 'current-progress' | 'current-complete' | 'previous-progress' | 'previous-complete';

export type ConstructionItem = {
  id: string;
  label: string;
  floors: number;
  sections: number;
  kind: 'house' | 'parking' | 'school';
};

export type Queue = { id: string; label: string; items: ConstructionItem[] };
export type Project = { id: string; label: string; queues: Queue[] };

export type Work = {
  id: string;
  code: string;
  name: string;
  contractor: string;
  plannedStart: string;
  plannedEnd: string;
  seed: number;
};

export type WorkGroup = {
  id: string;
  name: string;
  description: string;
  start: string;
  end: string;
  works: Work[];
};

export const stateOptions: Array<{ id: CellState; label: string; short: string }> = [
  { id: 'current-progress', label: 'В работе на текущей неделе', short: 'Текущая · в работе' },
  { id: 'current-complete', label: 'Завершено на текущей неделе', short: 'Текущая · завершено' },
  { id: 'previous-progress', label: 'Было в работе на предыдущей неделе', short: 'Предыдущая · в работе' },
  { id: 'previous-complete', label: 'Завершено на предыдущей неделе', short: 'Предыдущая · завершено' },
];

const item = (id: string, label: string, floors = 12, sections = 6, kind: ConstructionItem['kind'] = 'house'): ConstructionItem => ({ id, label, floors, sections, kind });
const q = (id: string, label: string, items: ConstructionItem[]): Queue => ({ id, label, items });

export const projects: Project[] = [
  { id: 'adc', label: 'АДЦ КОММУНАРКА', queues: [
    q('adc-1', '1 очередь', [item('adc-1-1', 'АДЦ_1 оч_1 ж.д.', 18, 4), item('adc-1-2', 'АДЦ_1 оч_2 ж.д.', 18, 5), item('adc-1-3', 'АДЦ_1 оч_3 ж.д.', 22, 6), item('adc-1-dou', 'АДЦ ДОУ', 3, 3, 'school')]),
    q('adc-2', '2 очередь', [item('adc-2-1', 'АДЦ_2 оч_1 ж.д.', 24, 7), item('adc-2-2', 'АДЦ_2 оч_2 ж.д.', 16, 4), item('adc-2-3', 'АДЦ_2 оч_3 ж.д.', 16, 4), item('adc-2-p', 'АДЦ паркинг', 5, 3, 'parking')]),
  ] },
  { id: 'alkhimovo', label: 'АЛХИМОВО', queues: [
    q('alkh-1', '1 очередь', [item('alkh-1-1', 'АЛХ_1 оч_1 ж.д.', 16, 6), item('alkh-1-2', 'АЛХ_1 оч_2 ж.д.', 18, 7), item('alkh-1-3', 'Алхимово МКД', 12, 5)]),
    q('alkh-21', '2.1 очередь', [item('alkh-21-1', 'АЛХ_2 оч_1 эт_1 ж.д.', 14, 4), item('alkh-21-2', 'АЛХ_2 оч_1 эт_2 ж.д.', 14, 4), item('alkh-21-3', 'АЛХ_2 оч_1 эт_3 ж.д.', 20, 6), item('alkh-21-4', 'АЛХ_2 оч_1 эт_4 ж.д.', 20, 6), item('alkh-21-p', 'АЛХ_2 паркинг', 4, 4, 'parking'), item('alkh-21-d', 'АЛХ_2 ДОУ', 3, 2, 'school')]),
    q('alkh-22', '2.2 очередь', [item('alkh-22-1', 'АЛХ_2 оч_2 эт_1 ж.д.', 17, 5), item('alkh-22-2', 'АЛХ_2 оч_2 эт_2 ж.д.', 17, 5), item('alkh-22-3', 'АЛХ_2 оч_2 эт_3 ж.д.', 17, 5), item('alkh-22-4', 'АЛХ_2 оч_2 эт_4 ж.д.', 17, 5)]),
    q('alkh-3', '3 очередь', [item('alkh-3-7', 'АЛХ_3 оч_7 ж.д.', 24, 8), item('alkh-3-8', 'АЛХ_3 оч_8 ж.д.', 24, 8), item('alkh-3-9', 'АЛХ_3 оч_9 ж.д.', 18, 5), item('alkh-3-10', 'АЛХ_3 оч_10 ж.д.', 18, 5), item('alkh-3-p', 'АЛХ_3 паркинг', 5, 4, 'parking')]),
    q('alkh-4', '4 очередь', [item('alkh-4-9', 'АЛХ_4 оч_9 ж.д.', 20, 6), item('alkh-4-10', 'АЛХ_4 оч_10 ж.д.', 20, 6), item('alkh-4-11', 'АЛХ_4 оч_11 ж.д.', 20, 7)]),
  ] },
  { id: 'andreevsky', label: 'АНДРЕЕВСКИЙ ЛЕС - 2', queues: [q('an-1', '1 очередь', [item('an-1-1', 'АНДР_2_1 ж.д.', 15, 4), item('an-1-2', 'АНДР_2_2 ж.д.', 15, 4), item('an-1-3', 'АНДР_2_3 ж.д.', 18, 6), item('an-1-4', 'АНДР_2_4 ж.д.', 18, 6), item('an-1-p', 'АНДР_2 паркинг', 4, 3, 'parking')])] },
  { id: 'bogdanovsky', label: 'БОГДАНОВСКИЙ ЛЕС', queues: [q('bg-1', '1 очередь', [item('bg-1', 'БГД_1 ж.д.', 12, 3), item('bg-2', 'БГД_2 ж.д.', 18, 5), item('bg-3', 'БГД_3 ж.д.', 18, 5)])] },
];

const work = (id: string, code: string, name: string, contractor: string, plannedStart: string, plannedEnd: string, seed: number): Work => ({ id, code, name, contractor, plannedStart, plannedEnd, seed });

export const workGroups: WorkGroup[] = [
  { id: 'structure', name: 'Конструктив здания', description: 'Фундамент, несущий каркас, перекрытия и наружные стены здания.', start: '01.02.2026', end: '30.09.2026', works: [
    work('foundation', '1.1', 'Устройство фундамента', 'СМУ-1', '01.02.2026', '20.03.2026', 2),
    work('frame', '1.2', 'Монолитный каркас', 'СМУ-1', '15.03.2026', '31.07.2026', 4),
    work('slabs', '1.3', 'Устройство перекрытий', 'СМУ-2', '01.04.2026', '31.08.2026', 7),
    work('masonry', '1.4', 'Кладка наружных стен', 'КладкаСтрой', '15.05.2026', '30.09.2026', 9),
  ] },
  { id: 'engineering', name: 'Внутренние инженерные системы', description: 'Монтаж основных инженерных систем внутри объекта строительства.', start: '15.06.2026', end: '20.12.2026', works: [
    work('ventilation', '5.1', 'Вентиляция и дымоудаление', 'ВентСтрой', '15.06.2026', '15.11.2026', 3),
    work('heating', '5.2', 'Отопление', 'ТеплоСервис', '01.07.2026', '30.11.2026', 5),
    work('water', '5.3', 'Водоснабжение и канализация', 'АкваМонтаж', '15.07.2026', '20.12.2026', 8),
    work('electrical', '5.4', 'Электромонтажные работы', 'ЭнергоМонтаж', '01.08.2026', '20.12.2026', 11),
  ] },
  { id: 'finishing', name: 'Отделочные работы', description: 'Последовательная подготовка и финишная отделка помещений и мест общего пользования.', start: '01.09.2026', end: '30.04.2027', works: [
    work('rough', '7.1', 'Черновая отделка', 'ОтделкаПрофи', '01.09.2026', '28.02.2027', 4),
    work('fine', '7.2', 'Чистовая отделка', 'МастерФиниш', '01.11.2026', '30.04.2027', 7),
    work('doors', '7.3', 'Установка дверей', 'ДвериСтрой', '01.12.2026', '31.03.2027', 10),
    work('common-areas', '7.4', 'Отделка мест общего пользования', 'МОП-Строй', '15.11.2026', '30.04.2027', 12),
  ] },
];

export const constructionTypes = ['Благоустройство', 'Больница', 'БЦ', 'ВЗУ', 'ВнПл. сети', 'ВОК', 'ВРУ', 'ГРП', 'Доп. благоустройство', 'ДОУ', 'КНС', 'Корпус', 'КОС', 'Котельная', 'МКД', 'Офис', 'Паркинг', 'Поликлиника', 'РТП', 'ТП', 'Школа'];
