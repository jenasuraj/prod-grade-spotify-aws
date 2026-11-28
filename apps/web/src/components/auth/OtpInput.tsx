const LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
}

// One real input stretched invisibly over six boxes, so typing, paste and autofill just work
export default function OtpInput({ value, onChange }: OtpInputProps) {
  return (
    <div className="relative">
      <input
        aria-label="Verification code"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        maxLength={LENGTH}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        className="peer absolute inset-0 z-10 cursor-text opacity-0"
      />
      <div aria-hidden="true" className="grid grid-cols-6 gap-2">
        {Array.from({ length: LENGTH }, (_, i) => (
          <span
            key={i}
            className={`grid h-14 place-items-center rounded-xl border bg-ink-900 font-display text-2xl font-semibold text-white transition ${value[i] ? 'border-white/20' : 'border-white/[0.07]'} ${i === Math.min(value.length, LENGTH - 1) ? 'peer-focus:border-lime-300/70 peer-focus:ring-4 peer-focus:ring-lime-300/10' : ''}`}
          >
            {value[i] ?? ''}
          </span>
        ))}
      </div>
    </div>
  );
}
