import { Check } from 'lucide-react';

interface GenrePickerProps {
  options: string[];
  selected: string[];
  disabled?: boolean;
  onChange: (genres: string[]) => void;
}

export default function GenrePicker({ options, selected, disabled, onChange }: GenrePickerProps) {
  const toggle = (genre: string) =>
    onChange(selected.includes(genre) ? selected.filter((g) => g !== genre) : [...selected, genre]);

  return (
    <div role="group" aria-label="Genres" className="flex flex-wrap gap-2">
      {options.map((genre) => {
        const on = selected.includes(genre);
        return (
          <button
            key={genre}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => toggle(genre)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition duration-150 active:scale-95 disabled:pointer-events-none motion-reduce:transition-none ${on ? 'border-lime-300 bg-lime-300 text-ink-950' : 'border-white/10 text-slate-300 hover:border-white/25 hover:text-white'} ${disabled && !on ? 'opacity-40' : ''}`}
          >
            {on && <Check className="size-3.5" strokeWidth={3} />}
            {genre}
          </button>
        );
      })}
    </div>
  );
}
