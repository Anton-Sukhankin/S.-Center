import { useEffect, useState } from 'react';
import { CalendarRange, Check, CheckCircle2, ChevronDown, ChevronRight, ChevronsUpDown, Clock3, Layers3, Target, TrendingDown, Users, X } from 'lucide-react';
import { stateOptions, workGroups, type CellState, type Work, type WorkGroup } from './SCenterData';
import { Button, cx, Modal, TextInput } from './SCenterPrimitives';
import type { TreeSelection } from './SCenterTree';
type Overrides = Record<string, CellState>;
type ActiveCell = {
  workId: string;
  floor: number;
  section: number;
} | null;
const completedStates: CellState[] = ['current-complete', 'previous-complete'];
const cellKey = (objectId: string, workId: string, floor: number, section: number) => `${objectId}:${workId}:${floor}:${section}`;
const isUnavailable = (work: Work, floor: number, section: number) => (floor + section * 3 + work.seed) % 19 === 0;
const defaultState = (work: Work, floor: number, section: number): CellState => {
  if (work.id === 'foundation') return 'previous-complete';
  const value = (floor * 5 + section * 7 + work.seed) % 12;
  if (value < 3) return 'previous-complete';
  if (value < 5) return 'current-complete';
  if (value < 8) return 'previous-progress';
  return 'current-progress';
};
const formatUpdatedAt = (date: Date) => `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU', {
  hour: '2-digit',
  minute: '2-digit'
})}`;
function readinessFor(selection: TreeSelection, work: Work, overrides: Overrides) {
  let applicable = 0;
  let completed = 0;
  for (let floor = 1; floor <= selection.floors; floor += 1) {
    for (let section = 1; section <= selection.sections; section += 1) {
      if (isUnavailable(work, floor, section)) continue;
      applicable += 1;
      const state = overrides[cellKey(selection.id, work.id, floor, section)] ?? defaultState(work, floor, section);
      if (completedStates.includes(state)) completed += 1;
    }
  }
  return applicable ? Math.round(completed / applicable * 100) : 0;
}
function Matrix({
  selection,
  work,
  overrides,
  activeCell,
  onCell
}: {
  selection: TreeSelection;
  work: Work;
  overrides: Overrides;
  activeCell: ActiveCell;
  onCell: (cell: ActiveCell) => void;
}) {
  const floors = Array.from({
    length: selection.floors
  }, (_, index) => selection.floors - index);
  const sections = Array.from({
    length: selection.sections
  }, (_, index) => index + 1);
  return <div className="min-w-0 bg-white">
      <div className="sc-work-matrix-scroll overflow-x-auto">
        <table className="sc-work-matrix" style={{
        width: `${88 + selection.sections * 72}px`
      }}>
          <thead>
            <tr>
              <th scope="col">{selection.kind === 'parking' ? 'Уровень' : 'Этаж'}</th>
              {sections.map(section => <th key={section} scope="col">{selection.kind === 'parking' ? 'Зона' : selection.kind === 'school' ? 'Корпус' : 'Секция'} {section}</th>)}
            </tr>
          </thead>
          <tbody>
            {floors.map(floor => <tr key={floor}>
              <th scope="row">{floor}</th>
              {sections.map(section => {
              const unavailable = isUnavailable(work, floor, section);
              const state = overrides[cellKey(selection.id, work.id, floor, section)] ?? defaultState(work, floor, section);
              return <td key={section}>{unavailable ? <span className="sc-status-cell is-unavailable" title="Недоступно для этой работы" aria-label={`Этаж ${floor}, секция ${section}: недоступно`} /> : <button type="button" className={cx('sc-status-cell', `is-${state}`, activeCell?.workId === work.id && activeCell.floor === floor && activeCell.section === section && 'is-active')} aria-label={`Этаж ${floor}, секция ${section}: ${stateOptions.find(option => option.id === state)?.label}`} onClick={() => onCell({
                  workId: work.id,
                  floor,
                  section
                })}><span className="sr-only">Изменить состояние</span></button>}</td>;
            })}
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
}
function WorkAccordion({
  selection,
  work,
  overrides,
  open,
  activeCell,
  onToggle,
  onCell
}: {
  selection: TreeSelection;
  work: Work;
  overrides: Overrides;
  open: boolean;
  activeCell: ActiveCell;
  onToggle: () => void;
  onCell: (cell: ActiveCell) => void;
}) {
  const readiness = readinessFor(selection, work, overrides);
  const complete = readiness === 100;
  return <article className={cx('overflow-hidden rounded-lg border bg-white', complete ? 'border-emerald-200' : 'border-slate-200')}>
      <button type="button" className="sc-work-header grid w-full grid-cols-[28px_minmax(0,1fr)_32px] items-center gap-4 px-4 py-3 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400" aria-expanded={open} onClick={onToggle}>
        {open ? <ChevronDown size={17} className="text-slate-500" /> : <ChevronRight size={17} className="text-slate-500" />}
        <span className="flex min-w-0 items-baseline gap-2"><span className="shrink-0 text-[11px] font-semibold text-blue-600">{work.code}</span><strong className="truncate text-[13px] font-semibold text-slate-900">{work.name}</strong></span>
        <span className={cx('grid place-items-center', complete ? 'text-emerald-500' : 'text-slate-300')} title={complete ? 'Работа завершена' : 'Работа не завершена'} aria-label={complete ? 'Работа завершена' : 'Работа не завершена'}><CheckCircle2 size={18} /></span>
      </button>
      {open && <div className="grid border-t border-slate-200 bg-white lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="grid grid-cols-3 gap-4 border-b border-slate-200 px-4 py-4 lg:grid-cols-1 lg:content-start lg:gap-6 lg:border-b-0 lg:border-r lg:pl-[60px] lg:pr-8 lg:py-5" aria-label={`Параметры работы «${work.name}»`}>
          <div><small className="block text-[10px] text-slate-400">Плановый срок</small><span className="mt-1 block whitespace-nowrap text-[11px] font-medium text-slate-700">{work.plannedStart}–{work.plannedEnd}</span></div>
          <div><small className="block text-[10px] text-slate-400">Подрядчик</small><span className="mt-1 block truncate text-[12px] font-medium text-slate-700">{work.contractor}</span></div>
          <div><small className="block text-[10px] text-slate-400">Готовность</small><strong className={cx('mt-1 block text-[14px] font-semibold', complete ? 'text-emerald-600' : 'text-slate-800')}>{readiness}%</strong></div>
        </aside>
        <Matrix selection={selection} work={work} overrides={overrides} activeCell={activeCell} onCell={onCell} />
      </div>}
    </article>;
}
function ObjectSummary({
  readiness,
  plan,
  deviation,
  updatedAt
}: {
  readiness: number;
  plan: number;
  deviation: number;
  updatedAt: string;
}) {
  const [updatedDate, updatedTime] = updatedAt.split(' ');
  const deviationLabel = `${deviation > 0 ? '+' : ''}${deviation} п.п.`;
  const cardClass = 'flex min-h-[84px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm';
  const iconClass = 'grid size-12 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50';
  return <section aria-label="Сводка выбранного объекта" className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <article className={cardClass}>
        <span className="relative grid size-12 shrink-0 place-items-center rounded-full" style={{
        background: `conic-gradient(#337aeb ${readiness * 3.6}deg, #e5edf8 0)`
      }} aria-label={`Готовность дома ${readiness}%`}><span className="absolute inset-[5px] rounded-full bg-white" /><strong className="relative text-[11px] font-semibold text-blue-700">{readiness}%</strong></span>
        <div><small className="text-[10px] font-medium uppercase tracking-[.08em] text-slate-400">Готовность</small><strong className="mt-1 block text-xl font-semibold text-slate-900">{readiness}%</strong></div>
      </article>
      <article className={cardClass}>
        <span className={cx(iconClass, 'text-indigo-600')}><Target size={20} /></span>
        <div><small className="text-[10px] font-medium uppercase tracking-[.08em] text-slate-400">План</small><strong className="mt-1 block text-xl font-semibold text-slate-900">{plan}%</strong></div>
      </article>
      <article className={cardClass}>
        <span className={cx(iconClass, deviation < 0 ? 'text-rose-600' : 'text-emerald-600')}><TrendingDown size={20} /></span>
        <div><small className="text-[10px] font-medium uppercase tracking-[.08em] text-slate-400">Отклонение</small><strong className={cx('mt-1 block text-xl font-semibold', deviation < 0 ? 'text-rose-600' : 'text-emerald-600')}>{deviationLabel}</strong></div>
      </article>
      <article className={cardClass}>
        <span className={cx(iconClass, 'text-cyan-600')}><Clock3 size={20} /></span>
        <div><small className="text-[10px] font-medium uppercase tracking-[.08em] text-slate-400">Обновлено</small><strong className="mt-1 block whitespace-nowrap text-[14px] font-semibold text-slate-900">{updatedDate}<span className="ml-2 text-[11px] font-medium text-slate-500">{updatedTime}</span></strong></div>
      </article>
    </section>;
}
export function ChessboardView({
  selection
}: {
  selection: TreeSelection;
}) {
  const [groupId, setGroupId] = useState(workGroups[0].id);
  const [openWorks, setOpenWorks] = useState(new Set([workGroups[0].works[0].id, workGroups[0].works[1].id]));
  const [overrides, setOverrides] = useState<Overrides>({});
  const [activeCell, setActiveCell] = useState<ActiveCell>(null);
  const [updatedAt, setUpdatedAt] = useState(() => formatUpdatedAt(new Date()));
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');
  const [pendingGroupId, setPendingGroupId] = useState(workGroups[0].id);
  const group = workGroups.find(item => item.id === groupId) ?? workGroups[0];
  const readinessForGroup = (candidate: WorkGroup) => {
    const values = candidate.works.map(work => readinessFor(selection, work, overrides));
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  };
  const groupReadiness = readinessForGroup(group);
  const allWorks = workGroups.flatMap(item => item.works);
  const objectReadiness = Math.round(allWorks.reduce((sum, work) => sum + readinessFor(selection, work, overrides), 0) / allWorks.length);
  const [objectPlan] = useState(() => Math.min(100, objectReadiness + 7));
  const objectDeviation = objectReadiness - objectPlan;
  const activeWork = activeCell ? workGroups.flatMap(item => item.works).find(work => work.id === activeCell.workId) : undefined;
  const activeState = activeCell && activeWork ? overrides[cellKey(selection.id, activeCell.workId, activeCell.floor, activeCell.section)] ?? defaultState(activeWork, activeCell.floor, activeCell.section) : null;
  useEffect(() => {
    if (!activeCell) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setActiveCell(null);
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('.sc-floating-cell-panel') || target.closest('.sc-status-cell')) return;
      setActiveCell(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOutside);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOutside);
    };
  }, [activeCell]);
  const chooseState = (state: CellState) => {
    if (!activeCell) return;
    setOverrides(current => ({
      ...current,
      [cellKey(selection.id, activeCell.workId, activeCell.floor, activeCell.section)]: state
    }));
    setUpdatedAt(formatUpdatedAt(new Date()));
  };
  const toggleCell = (nextCell: ActiveCell) => setActiveCell(current => current && nextCell && current.workId === nextCell.workId && current.floor === nextCell.floor && current.section === nextCell.section ? null : nextCell);
  const chooseGroup = (nextId: string) => {
    const next = workGroups.find(item => item.id === nextId) ?? workGroups[0];
    setGroupId(next.id);
    setOpenWorks(new Set([next.works[0].id]));
    setActiveCell(null);
  };
  const openGroupPicker = () => {
    setPendingGroupId(group.id);
    setGroupSearch('');
    setGroupPickerOpen(true);
  };
  const closeGroupPicker = () => setGroupPickerOpen(false);
  const applyGroup = () => {
    chooseGroup(pendingGroupId);
    setGroupPickerOpen(false);
  };
  const normalizedSearch = groupSearch.trim().toLocaleLowerCase('ru-RU');
  const filteredGroups = workGroups.filter(item => !normalizedSearch || `${item.name} ${item.description}`.toLocaleLowerCase('ru-RU').includes(normalizedSearch));
  const pendingGroup = workGroups.find(item => item.id === pendingGroupId) ?? group;
  return <div className={cx('space-y-3', activeCell && 'pb-24')}>
      <ObjectSummary readiness={objectReadiness} plan={objectPlan} deviation={objectDeviation} updatedAt={updatedAt} />
      <section className="grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid-cols-4" aria-label="Выбранная группа работ">
        <button type="button" aria-label={`Изменить группу работ. Текущая группа: ${group.name}`} aria-haspopup="dialog" aria-expanded={groupPickerOpen} onClick={openGroupPicker} className="group flex min-w-0 items-center gap-3 border-b border-slate-200 px-3 py-3 text-left transition hover:bg-blue-50/50 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-blue-200 lg:border-b-0 lg:border-r">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-600 text-white shadow-sm"><Layers3 size={20} /></span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-[13px] font-semibold text-slate-900">{group.name}</strong>
            <span className="mt-1 block truncate text-[10px] leading-4 text-slate-500">{group.description}</span>
          </span>
          <span className="grid size-6 shrink-0 place-items-center text-slate-400 transition-colors group-hover:text-blue-600" title="Выбрать другую группу" aria-hidden="true"><ChevronsUpDown size={17} /></span>
        </button>
        <div className="flex min-w-0 items-center border-b border-slate-200 px-4 py-3 lg:border-b-0 lg:border-r">
          <span className="min-w-0"><small className="flex items-center gap-1.5 text-[10px] text-slate-400"><CalendarRange size={12} className="text-blue-600" />Период группы</small><span className="mt-0.5 block whitespace-nowrap text-[11px] font-medium text-slate-700">{group.start}–{group.end}</span></span>
        </div>
        <div className="flex items-center border-b border-slate-200 px-4 py-3 lg:border-b-0 lg:border-r">
          <span><small className="block text-[10px] text-slate-400">Готовность</small><strong className="text-[13px] text-slate-900">{groupReadiness}%</strong></span>
        </div>
        <div className="flex items-center border-b border-slate-200 px-4 py-3 lg:border-b-0">
          <span><small className="block text-[10px] text-slate-400">Последовательность</small><strong className="text-[12px] text-slate-800">{group.works.length} работы</strong></span>
        </div>
      </section>
      <section className="space-y-2" aria-label="Работы выбранной группы">
        {group.works.map(work => <WorkAccordion key={work.id} selection={selection} work={work} overrides={overrides} open={openWorks.has(work.id)} activeCell={activeCell} onToggle={() => setOpenWorks(current => {
        const next = new Set(current);
        next.has(work.id) ? next.delete(work.id) : next.add(work.id);
        return next;
      })} onCell={toggleCell} />)}
      </section>
      <section aria-label="Легенда состояний" className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-600">
        <strong className="text-slate-800">Статусы ячеек:</strong>
        {stateOptions.map(option => <span key={option.id} className="flex items-center gap-2"><span className={cx('sc-legend-dot', `is-${option.id}`)} />{option.label}</span>)}
        <span className="flex items-center gap-2"><span className="sc-legend-dot is-unavailable" />Недоступно</span>
      </section>
      {activeCell && <div className="sc-floating-cell-panel fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-[920px] flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-2xl" role="dialog" aria-label={`Состояние ячейки: этаж ${activeCell.floor}, секция ${activeCell.section}`}>
        <strong className="mr-2 text-[12px] text-slate-800">Этаж {activeCell.floor} · секция {activeCell.section}</strong>
        {stateOptions.map(option => <button key={option.id} type="button" aria-pressed={activeState === option.id} className={cx('sc-state-option', `is-${option.id}`, activeState === option.id && 'is-selected')} onClick={() => chooseState(option.id)}><span />{option.short}</button>)}
        <button type="button" className="ml-auto grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="Закрыть панель статусов" onClick={() => setActiveCell(null)}><X size={16} /></button>
      </div>}
      {groupPickerOpen && <Modal id="work-group-picker" title="Выбор группы работ" description="Выберите одну группу. После применения ниже отобразятся четыре работы в установленной последовательности." onClose={closeGroupPicker}>
        <div className="border-b border-slate-200 px-6 py-4">
          <TextInput value={groupSearch} onChange={event => setGroupSearch(event.target.value)} placeholder="Найти группу работ" aria-label="Поиск группы работ" />
          <p className="mt-2 text-[11px] text-slate-500" role="status">Найдено: {filteredGroups.length} из {workGroups.length}</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-3" role="radiogroup" aria-label="Доступные группы работ">
          {filteredGroups.length ? <div className="space-y-2">{filteredGroups.map(item => {
            const selected = pendingGroupId === item.id;
            return <label key={item.id} className={cx('flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition', selected ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50')}>
                <input type="radio" name="work-group" value={item.id} checked={selected} onChange={() => setPendingGroupId(item.id)} className="sr-only" />
                <span className={cx('mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg', selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500')}><Layers3 size={18} /></span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-[13px] font-semibold text-slate-900">{item.name}</strong>
                  <span className="mt-1 block text-[11px] leading-4 text-slate-500">{item.description}</span>
                  <span className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-slate-500"><span>{item.start}–{item.end}</span><span>{item.works.length} работы</span><span>Готовность {readinessForGroup(item)}%</span></span>
                </span>
                <span className={cx('mt-1 grid size-5 shrink-0 place-items-center rounded-full border', selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white')} aria-hidden="true">{selected && <Check size={13} strokeWidth={3} />}</span>
              </label>;
          })}</div> : <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center"><div><strong className="text-[13px] text-slate-700">Группы не найдены</strong><p className="mt-1 text-[11px] text-slate-500">Измените поисковый запрос.</p></div></div>}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="min-w-0 text-[11px] text-slate-500">Выбрано: <strong className="text-slate-700">{pendingGroup.name}</strong></p>
          <div className="flex gap-2"><Button onClick={closeGroupPicker}>Отменить</Button><Button variant="primary" onClick={applyGroup}>Выбрать группу</Button></div>
        </footer>
      </Modal>}
    </div>;
}
export function ObjectWorksTable() {
  return <section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="border-b border-slate-200 px-4 py-3"><h2 className="text-sm font-semibold text-slate-900">Работы объекта</h2><p className="text-[11px] text-slate-500">Отдельная область редактирования; детализация не входит в текущую итерацию.</p></div><table className="w-full border-collapse text-left text-[12px]"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-3">Код</th><th>Работа</th><th>Группа</th><th>Подрядчик</th><th>Плановый срок</th></tr></thead><tbody>{workGroups.flatMap(group => group.works.map(work => <tr key={work.id} className="border-t border-slate-100"><td className="px-4 py-3 text-blue-600">{work.code}</td><td className="font-medium text-slate-800">{work.name}</td><td>{group.name}</td><td>{work.contractor}</td><td>{work.plannedStart}–{work.plannedEnd}</td></tr>))}</tbody></table></section>;
}
export function ObjectInformation({
  selection
}: {
  selection: TreeSelection;
}) {
  return <section className="grid min-h-[320px] place-items-center rounded-lg border border-dashed border-slate-300 bg-white text-center"><div className="max-w-md p-8"><Users size={28} className="mx-auto text-blue-500" /><h2 className="mt-4 text-base font-semibold text-slate-900">Информация об объекте</h2><p className="mt-2 text-sm leading-6 text-slate-500">Каркас вкладки предусмотрен для объекта «{selection.label}». Содержимое не входит в MVP встречи и не заполнено фиктивными данными.</p><Button className="mt-5" disabled><Check size={15} />Будет реализовано отдельно</Button></div></section>;
}