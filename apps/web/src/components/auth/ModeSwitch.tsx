import type { AuthMode } from '../../types/auth';

const labels: Record<AuthMode, string> = {
  login: 'Log in',
  register: 'Register',
};

interface ModeSwitchProps {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
}

export default function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <div
      className="mb-10 flex gap-7 border-b border-white/[0.06]"
      role="group"
      aria-label="Choose login or register"
    >
      {(['login', 'register'] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          aria-pressed={mode === tab}
          onClick={() => onChange(tab)}
          className={`relative pb-3 text-sm font-medium transition-colors ${mode === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {labels[tab]}
          <span
            className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-lime-300 transition-opacity ${mode === tab ? 'opacity-100' : 'opacity-0'}`}
          />
        </button>
      ))}
    </div>
  );
}
