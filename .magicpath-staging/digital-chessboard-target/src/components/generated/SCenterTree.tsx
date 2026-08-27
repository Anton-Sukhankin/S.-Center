import { useState } from 'react';
import { Building2, FolderMinus, FolderPlus } from 'lucide-react';
import { projects, type ConstructionItem } from './SCenterData';
import { cx, TextInput } from './SCenterPrimitives';
export type TreeSelection = ConstructionItem & {
  projectId: string;
  projectLabel: string;
  queueId: string;
  queueLabel: string;
};
export function ProjectTree({
  selected,
  onSelect
}: {
  selected: TreeSelection;
  onSelect: (item: TreeSelection) => void;
}) {
  const [query, setQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState(new Set(['alkhimovo']));
  const [expandedQueues, setExpandedQueues] = useState(new Set(['alkh-1']));
  const normalized = query.trim().toLocaleLowerCase('ru');
  const toggle = (source: Set<string>, id: string, setter: (next: Set<string>) => void) => {
    const next = new Set(source);
    next.has(id) ? next.delete(id) : next.add(id);
    setter(next);
  };
  return <aside aria-label="Все проекты" className="flex h-full min-h-0 flex-col bg-white">
      <div className="px-[13px] pb-2 pt-4">
        <div className="mb-2.5 flex items-center justify-between text-sm">
          <h2 className="font-normal text-slate-600">Все проекты</h2>
          <span className="text-slate-400">104</span>
        </div>
        <TextInput aria-label="Поиск по проектам" value={query} onChange={event => setQuery(event.target.value)} className="h-[34px]" />
      </div>
      <div role="tree" aria-label="Проекты и объекты строительства" className="sc-tree min-h-0 flex-1 overflow-y-auto px-3 pb-5 text-[13px] text-slate-600">
        {projects.map(project => {
        const projectMatches = project.label.toLocaleLowerCase('ru').includes(normalized);
        const filteredQueues = project.queues.filter(queue => projectMatches || queue.label.toLocaleLowerCase('ru').includes(normalized) || queue.items.some(item => item.label.toLocaleLowerCase('ru').includes(normalized)));
        if (normalized && !filteredQueues.length) return null;
        const projectOpen = normalized ? true : expandedProjects.has(project.id);
        return <div key={project.id}>
              <div role="treeitem" aria-expanded={projectOpen} aria-level={1} className="sc-tree-row">
                <button type="button" className="sc-disclosure" aria-label={`${projectOpen ? 'Свернуть' : 'Развернуть'} «${project.label}»`} onClick={() => toggle(expandedProjects, project.id, setExpandedProjects)}>
                  {projectOpen ? <FolderMinus size={17} /> : <FolderPlus size={17} />}
                </button>
                <span className="truncate">{project.label}</span>
              </div>
              {projectOpen && <div role="group">{filteredQueues.map(queue => {
              const queueMatches = queue.label.toLocaleLowerCase('ru').includes(normalized);
              const visibleItems = queue.items.filter(item => !normalized || projectMatches || queueMatches || item.label.toLocaleLowerCase('ru').includes(normalized));
              const queueOpen = normalized ? true : expandedQueues.has(queue.id);
              return <div key={queue.id}>
                    <div role="treeitem" aria-expanded={queueOpen} aria-level={2} className="sc-tree-row sc-tree-guide pl-7">
                      <button type="button" className="sc-disclosure" aria-label={`${queueOpen ? 'Свернуть' : 'Развернуть'} «${queue.label}»`} onClick={() => toggle(expandedQueues, queue.id, setExpandedQueues)}>
                        {queueOpen ? <FolderMinus size={17} /> : <FolderPlus size={17} />}
                      </button>
                      <span>{queue.label}</span>
                    </div>
                    {queueOpen && <div role="group">{visibleItems.map((item, index) => {
                    const isSelected = selected.id === item.id;
                    return <button key={item.id} type="button" role="treeitem" aria-level={3} aria-selected={isSelected} onClick={() => onSelect({
                      ...item,
                      projectId: project.id,
                      projectLabel: project.label,
                      queueId: queue.id,
                      queueLabel: queue.label
                    })} className={cx('sc-tree-row sc-tree-guide w-full pl-[62px] text-left', isSelected && 'is-selected')}>
                          <Building2 size={15} className="shrink-0 text-slate-400" />
                          <span className="truncate">{item.label}</span>
                          {project.id === 'alkhimovo' && queue.id === 'alkh-1' && index === 2 && <span className="ml-auto size-2 shrink-0 rounded-full bg-rose-500" />}
                        </button>;
                  })}</div>}
                  </div>;
            })}</div>}
            </div>;
      })}
      </div>
    </aside>;
}