import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Bell, Grid3X3, Menu, Settings } from 'lucide-react';
import { projects } from './SCenterData';
import { ChessboardView, ObjectInformation, ObjectWorksTable } from './SCenterChessboard';
import { Button, cx, IconButton } from './SCenterPrimitives';
import { ProjectTree, type TreeSelection } from './SCenterTree';
import { SettingsDrawer } from './SCenterSettings';
type ObjectTab = 'information' | 'works' | 'chessboard';
const firstObject = projects.find(project => project.id === 'alkhimovo')!.queues[0].items[0];
const initialSelection: TreeSelection = {
  ...firstObject,
  projectId: 'alkhimovo',
  projectLabel: 'АЛХИМОВО',
  queueId: 'alkh-1',
  queueLabel: '1 очередь'
};
export const SCenterDigitalChessboardComponentPlan = () => {
  const [sidebar, setSidebar] = useState(310);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selection, setSelection] = useState<TreeSelection>(initialSelection);
  const [tab, setTab] = useState<ObjectTab>('chessboard');
  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    const origin = event.clientX;
    const initial = sidebar;
    const move = (next: PointerEvent) => setSidebar(Math.max(250, Math.min(440, initial + next.clientX - origin)));
    const stop = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', stop);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', stop);
  };
  const selectObject = (next: TreeSelection) => {
    setSelection(next);
    setTab('chessboard');
  };
  return <div className="flex min-h-screen w-full items-center justify-center bg-white font-sans text-slate-900">
      <div className="sc-app flex h-screen min-h-[640px] w-full flex-col overflow-hidden bg-white">
        <header className="h-20 shrink-0 bg-[#337aeb] text-white">
          <div className="flex h-11 items-center justify-between px-5">
            <div className="flex items-center gap-2.5"><Menu size={20} /><Grid3X3 size={20} /><strong className="text-[15px]">S.Center</strong><span className="rounded-full bg-emerald-400/85 px-2 py-0.5 text-xs text-emerald-50">STAGE</span></div>
            <nav aria-label="Служебная навигация" className="flex items-center gap-6 text-xs text-white/90"><a href="#analytics">Аналитика</a><a href="#help">Помощь</a><IconButton label="Уведомления" className="text-white hover:bg-white/15 hover:text-white"><Bell size={18} /></IconButton><span role="img" aria-label="Профиль пользователя" className="sc-avatar" /></nav>
          </div>
          <nav aria-label="Разделы S.Center" className="flex h-9 items-center gap-6 overflow-x-auto px-5 text-sm text-white/85">{['Проекты', 'Закрытые периоды', 'Обновления', 'Мобильное приложение', 'Заявки НСИ', 'Отчёты', 'Цифровая шахматка'].map(item => <a key={item} href={`#${item}`} aria-current={item === 'Цифровая шахматка' ? 'page' : undefined} className={cx('flex h-full shrink-0 items-center border-b-2 border-transparent', item === 'Цифровая шахматка' && 'border-white text-white')}>{item}</a>)}</nav>
        </header>

        <div className="sc-workspace grid min-h-0 flex-1" style={{
        gridTemplateColumns: `${sidebar}px 8px minmax(0,1fr)`
      }}>
          <ProjectTree selected={selection} onSelect={selectObject} />
          <div role="separator" aria-orientation="vertical" aria-label="Изменить ширину списка проектов" aria-valuemin={250} aria-valuemax={440} aria-valuenow={sidebar} tabIndex={0} onPointerDown={startResize} onKeyDown={event => {
          if (event.key === 'ArrowLeft') setSidebar(value => Math.max(250, value - 10));
          if (event.key === 'ArrowRight') setSidebar(value => Math.min(440, value + 10));
        }} className="sc-resizer cursor-col-resize bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400" />
          <main className="min-h-0 min-w-0 overflow-y-auto bg-[#f6f8fb]">
            <header className="sticky top-0 z-50 flex h-[68px] items-center justify-between border-b border-slate-200 bg-white px-4">
              <div className="min-w-0"><h1 className="truncate text-2xl font-medium tracking-[-.2px] text-[#282828]">Цифровая шахматка</h1><p className="truncate text-[11px] text-slate-500">{selection.projectLabel} · {selection.queueLabel} · <strong className="font-medium text-slate-700">{selection.label}</strong></p></div>
              <Button onClick={() => setSettingsOpen(true)} aria-haspopup="dialog" aria-expanded={settingsOpen}><Settings size={17} />Настройки</Button>
            </header>
            <div className="p-4">
              <nav aria-label="Разделы объекта" className="mb-3 flex h-10 items-end gap-6 border-b border-slate-200 bg-white px-4">{([['information', 'Информация'], ['works', 'Работы'], ['chessboard', 'Цифровая шахматка']] as const).map(([id, label]) => <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)} className={cx('h-10 border-b-2 px-1 text-[13px] font-medium', tab === id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800')}>{label}</button>)}</nav>
              {tab === 'information' && <ObjectInformation selection={selection} />}
              {tab === 'works' && <ObjectWorksTable />}
              {tab === 'chessboard' && <ChessboardView key={selection.id} selection={selection} />}
            </div>
          </main>
        </div>
        {settingsOpen && <SettingsDrawer onClose={() => setSettingsOpen(false)} />}
      </div>
    </div>;
};