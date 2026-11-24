import type { ServiceStatus } from '../../types/health';

interface StatusBadgeProps {
  label: string;
  status: ServiceStatus;
}

export default function StatusBadge({ label, status }: StatusBadgeProps) {
  const up = status === 'up';
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-900 px-4 py-3">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <span className={`text-sm font-semibold ${up ? 'text-green-400' : 'text-red-400'}`}>
        {up ? 'Up' : 'Down'}
      </span>
    </div>
  );
}
