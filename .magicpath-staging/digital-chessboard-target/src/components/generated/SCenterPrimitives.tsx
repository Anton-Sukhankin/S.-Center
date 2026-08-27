import { useEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
export const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');
export function Button({
  variant = 'outline',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
}) {
  return <button {...props} className={cx('sc-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[7px] border px-4 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-45', variant === 'primary' && 'border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700', variant === 'secondary' && 'border-slate-300 bg-white text-blue-600 hover:bg-slate-50', variant === 'outline' && 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50', variant === 'text' && 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900', className)}>{children}</button>;
}
export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
}) {
  return <button type="button" aria-label={label} {...props} className={cx('grid size-9 shrink-0 place-items-center rounded-md border border-transparent text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-200', className)}>{children}</button>;
}
export function TextInput({
  leading = <Search size={17} />,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  leading?: ReactNode;
}) {
  return <div className="relative w-full"><span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-slate-400">{leading}</span><input {...props} className={cx('h-10 w-full rounded-lg border border-slate-300 bg-white px-3 pl-9 text-[13px] text-slate-800 outline-none transition focus:border-blue-400 focus:ring-3 focus:ring-blue-100', className)} /></div>;
}
export function SegmentedControl({
  value,
  onChange
}: {
  value: 'planning' | 'fact';
  onChange: (value: 'planning' | 'fact') => void;
}) {
  return <div role="group" aria-label="Режим работы шахматки" className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-[3px]">{([['planning', 'План'], ['fact', 'Факт']] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)} className={cx('h-8 rounded-md px-4 text-xs font-semibold text-slate-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300', value === id && 'bg-white text-blue-700 shadow-sm')}>{label}</button>)}</div>;
}
export function Modal({
  id,
  title,
  description,
  children,
  onClose
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input,button')?.focus();
    return () => previous?.focus();
  }, []);
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('input:not(:disabled),button:not(:disabled),[tabindex]:not([tabindex="-1"])') ?? []);
    if (!items.length) return;
    if (event.shiftKey && document.activeElement === items[0]) {
      event.preventDefault();
      items.at(-1)?.focus();
    } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
      event.preventDefault();
      items[0].focus();
    }
  };
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 p-6 backdrop-blur-[1px]" onMouseDown={e => e.target === e.currentTarget && onClose()}><div ref={ref} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onKeyDown={onKeyDown} className="flex max-h-[calc(100vh-48px)] w-full max-w-[700px] flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl"><header className="flex min-h-[90px] items-start justify-between gap-6 border-b border-slate-200 px-6 py-5"><div><h2 id={`${id}-title`} className="m-0 text-xl font-semibold tracking-tight text-slate-900">{title}</h2><p id={`${id}-description`} className="mt-1.5 text-[13px] leading-5 text-slate-500">{description}</p></div><IconButton label="Закрыть" onClick={onClose}><X size={17} /></IconButton></header>{children}</div></div>;
}
export function EmptyState({
  onChoose,
  placeholder = false
}: {
  onChoose: () => void;
  placeholder?: boolean;
}) {
  return <div role="status" className="flex min-h-[300px] flex-1 flex-col items-center justify-center px-6 pb-10 text-center"><span className="grid size-[72px] place-items-center rounded-full bg-blue-50 text-blue-600">{placeholder ? '?' : '▦'}</span><h2 className="mt-5 text-lg font-semibold text-slate-900">{placeholder ? 'Раздел будет реализован на следующем этапе' : 'Вид работ не выбран'}</h2><p className="mt-1.5 max-w-md text-sm leading-6 text-slate-500">{placeholder ? 'Вернитесь к доступным настройкам видов и объектов строительства.' : 'Выберите работу, чтобы увидеть готовность по этажам и секциям.'}</p><Button variant="primary" onClick={onChoose} className="mt-5">{placeholder ? 'Перейти к видам ОС' : 'Выбрать работу'}</Button></div>;
}