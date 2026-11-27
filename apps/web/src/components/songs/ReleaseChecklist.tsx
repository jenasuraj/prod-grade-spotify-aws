import { Check, X } from 'lucide-react';

export interface ChecklistItem {
  label: string;
  detail: string;
  state: 'todo' | 'active' | 'done' | 'failed';
}

const DOT = {
  todo: 'border border-white/15 text-transparent',
  active: 'border-2 border-lime-300 text-transparent',
  done: 'bg-lime-300 text-ink-950',
  failed: 'bg-rose-400 text-ink-950',
};

interface ReleaseChecklistProps {
  items: ChecklistItem[];
}

export default function ReleaseChecklist({ items }: ReleaseChecklistProps) {
  return (
    <ol className="space-y-0">
      {items.map(({ label, detail, state }, i) => (
        <li key={label} className="relative flex gap-4 pb-6 last:pb-0">
          {i < items.length - 1 && (
            <span
              aria-hidden="true"
              className={`absolute top-6 bottom-0 left-[9px] w-px ${state === 'done' ? 'bg-lime-300/40' : 'bg-white/10'}`}
            />
          )}
          <span
            className={`relative mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${DOT[state]}`}
          >
            {state === 'done' && <Check className="size-3" strokeWidth={3.5} />}
            {state === 'failed' && <X className="size-3" strokeWidth={3.5} />}
          </span>
          <div className="min-w-0">
            <p
              className={`text-sm font-medium ${state === 'todo' ? 'text-slate-500' : 'text-white'}`}
            >
              {label}
            </p>
            <p className="truncate text-xs text-slate-500">{detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
