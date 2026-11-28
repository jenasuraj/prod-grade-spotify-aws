import type { ReactNode } from 'react';
import { GUTTER } from '../../utils/helpers';

interface SectionTabsProps {
  ids: string[]; // section element ids, also the tab labels
  active: string;
  onSelect: (id: string) => void;
  children?: ReactNode; // small text on the right
}

// Sticky tab bar under the navbar; the page decides what selecting a tab does
export default function SectionTabs({ ids, active, onSelect, children }: SectionTabsProps) {
  return (
    <div className="sticky top-16 z-30 border-b border-white/[0.06] bg-ink-950/85 backdrop-blur-md">
      <nav className={`flex h-12 items-center gap-7 ${GUTTER}`}>
        {ids.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-current={active === id ? 'true' : undefined}
            className={`relative h-full text-sm font-medium capitalize transition-colors ${active === id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {id}
            <span
              className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-lime-300 transition-opacity duration-200 ${active === id ? 'opacity-100' : 'opacity-0'}`}
            />
          </button>
        ))}
        {children && (
          <span className="ml-auto text-xs text-slate-500 tabular-nums">{children}</span>
        )}
      </nav>
    </div>
  );
}
