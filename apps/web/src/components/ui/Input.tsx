import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type ComponentProps } from 'react';

interface InputProps extends ComponentProps<'input'> {
  label: string;
}

// Password fields get a show/hide toggle
export default function Input({ label, id, type, className = '', ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [shown, setShown] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="text-left">
      <label
        htmlFor={inputId}
        className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase"
      >
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={inputId}
          type={isPassword && shown ? 'text' : type}
          className={`h-12 w-full rounded-xl border border-white/[0.07] bg-ink-900 px-4 text-sm text-slate-100 transition placeholder:text-slate-600 hover:border-white/15 focus:border-lime-300/50 focus:ring-4 focus:ring-lime-300/10 focus:outline-none ${isPassword ? 'pr-12' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown(!shown)}
            aria-label={shown ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500 transition hover:text-white"
          >
            {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
