import { useEffect, useMemo, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';
import { constructionTypes, projects } from './SCenterData';
import { Button, cx, IconButton, TextInput } from './SCenterPrimitives';
export function SettingsDrawer({
  onClose
}: {
  onClose: () => void;
}) {
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const initialTypes = useMemo(() => new Set(['Благоустройство', 'ДОУ', 'Корпус', 'КОС', 'МКД', 'Паркинг']), []);
  const allObjectIds = useMemo(() => projects.flatMap(project => project.queues.flatMap(queue => queue.items.map(item => item.id))), []);
  const [savedTypes, setSavedTypes] = useState(initialTypes);
  const [draftTypes, setDraftTypes] = useState(initialTypes);
  const [savedObjects, setSavedObjects] = useState(new Set(allObjectIds));
  const [draftObjects, setDraftObjects] = useState(new Set(allObjectIds));
  const dialogRef = useRef<HTMLElement>(null);
  const visibleTypes = constructionTypes.filter(type => type.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru')));
  const alkhimovo = projects.find(project => project.id === 'alkhimovo') ?? projects[0];
  const objectRows = alkhimovo.queues.flatMap(queue => queue.items.map(item => ({
    ...item,
    queue: queue.label
  })));
  const dirty = draftTypes.size !== savedTypes.size || [...draftTypes].some(type => !savedTypes.has(type)) || draftObjects.size !== savedObjects.size || [...draftObjects].some(id => !savedObjects.has(id));
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>('button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [onClose]);
  const toggle = (source: Set<string>, value: string, setter: (next: Set<string>) => void) => {
    const next = new Set(source);
    next.has(value) ? next.delete(value) : next.add(value);
    setter(next);
  };
  const cancel = () => {
    setDraftTypes(new Set(savedTypes));
    setDraftObjects(new Set(savedObjects));
  };
  const save = () => {
    setSavedTypes(new Set(draftTypes));
    setSavedObjects(new Set(draftObjects));
  };
  return <div className="fixed inset-0 z-[90] bg-slate-950/40" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="settings-title" className="ml-auto flex h-full w-[min(70vw,1120px)] min-w-[760px] flex-col bg-white shadow-2xl">
        <header className="flex min-h-16 items-center justify-between px-6"><h2 id="settings-title" className="text-2xl font-semibold">Настройки</h2><IconButton label="Закрыть настройки" onClick={onClose}><X size={19} /></IconButton></header>
        <div role="tablist" aria-label="Разделы настроек" className="flex border-b border-slate-200 px-6">{['Виды ОС', 'Выбор ОС', 'Шаблон работ для ОС', 'Источники плана'].map((label, index) => <button key={label} type="button" role="tab" aria-selected={tab === index} onClick={() => setTab(index)} className={cx('h-12 border-b-2 px-4 text-sm', tab === index ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-600')}>{label}</button>)}</div>
        <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto p-6">
          {tab < 2 ? <>
            {tab === 1 && <label className="mb-4 block max-w-[430px] text-xs text-slate-500">Проект<select className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"><option>АЛХИМОВО</option></select></label>}
            <div role="status" className="flex gap-3 rounded-xl bg-slate-50 p-5 text-[13px] leading-5 text-slate-600"><Info size={20} className="shrink-0 text-blue-500" /><p>{tab === 0 ? 'Выберите виды объектов строительства, которые участвуют в цифровой шахматке.' : 'Выберите конкретные объекты проекта, доступные в дереве и шахматке.'}<br /><strong className="text-slate-800">Важно:</strong> drawer управляет настройками и не является шагом перехода к матрице.</p></div>
            {tab === 0 ? <>
              <div className="my-4 max-w-[430px]"><TextInput aria-label="Поиск по видам объектов строительства" value={query} onChange={event => setQuery(event.target.value)} placeholder="Поиск по видам объектов строительства" /></div>
              <div className="overflow-hidden rounded-lg border border-slate-200"><table className="w-full border-collapse text-sm"><thead className="bg-slate-50 text-left"><tr><th className="px-4 py-3">Вид объекта строительства</th><th className="w-[270px] px-4 py-3">Использовать в шахматке</th></tr></thead><tbody>{visibleTypes.map((type, index) => <tr key={type} className={cx('border-t border-slate-100', index % 2 === 1 && 'bg-slate-50/70')}><td className="px-4 py-3">{type}</td><td className="px-4 py-3"><input type="checkbox" checked={draftTypes.has(type)} onChange={() => toggle(draftTypes, type, setDraftTypes)} className="size-[18px] accent-blue-600" aria-label={`Использовать ${type}`} /></td></tr>)}</tbody></table></div>
            </> : <div className="mt-4 overflow-hidden rounded-lg border border-slate-200"><table className="w-full border-collapse text-sm"><thead className="bg-slate-50 text-left"><tr><th className="px-4 py-3">Наименование объекта</th><th>Очередь</th><th>Вид ОС</th><th>Тип ОС</th><th>Отображать</th></tr></thead><tbody>{objectRows.map(item => <tr key={item.id} className="border-t border-slate-100"><td className="px-4 py-3">{item.label}</td><td>{item.queue}</td><td>{item.kind === 'house' ? 'Корпус' : item.kind === 'parking' ? 'Паркинг' : 'ДОУ'}</td><td>{item.kind === 'house' ? 'МКД' : '—'}</td><td><input type="checkbox" checked={draftObjects.has(item.id)} onChange={() => toggle(draftObjects, item.id, setDraftObjects)} className="size-[18px] accent-blue-600" aria-label={`Отображать ${item.label}`} /></td></tr>)}</tbody></table></div>}
          </> : <div className="grid min-h-[340px] place-items-center text-center"><div className="max-w-md"><Info size={30} className="mx-auto text-blue-500" /><h3 className="mt-4 text-lg font-semibold text-slate-900">{tab === 2 ? 'Шаблон работ для вида объекта' : 'Источник плана по проекту'}</h3><p className="mt-2 text-sm leading-6 text-slate-500">Раздел зарезервирован. Логика не моделируется до появления отдельного продуктового контракта{tab === 3 ? ' для Project, Gantt и Sarex' : ''}.</p></div></div>}
        </div>
        <footer className="flex min-h-[70px] items-center justify-end gap-2.5 border-t border-slate-200 px-6"><Button variant="secondary" disabled={!dirty} onClick={cancel}>Отменить</Button><Button variant="primary" disabled={!dirty} onClick={save}>Сохранить</Button></footer>
      </section>
    </div>;
}