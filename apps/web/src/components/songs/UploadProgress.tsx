import { CircleCheck, CircleX, LoaderCircle } from 'lucide-react';
import type { UploadStatus } from '../../types/song';
import { formatBytes } from '../../utils/helpers';

interface UploadProgressProps {
  status: UploadStatus;
  percent: number;
  size: number;
}

const TONE = {
  uploading: {
    bar: 'bg-green-500',
    text: 'text-green-400',
    label: 'Uploading…',
    Icon: LoaderCircle,
  },
  done: { bar: 'bg-green-500', text: 'text-green-400', label: 'Uploaded', Icon: CircleCheck },
  failed: { bar: 'bg-rose-500', text: 'text-rose-400', label: 'Upload failed', Icon: CircleX },
};

export default function UploadProgress({ status, percent, size }: UploadProgressProps) {
  if (status === 'idle') return null;
  const { bar, text, label, Icon } = TONE[status];
  return (
    <div className="space-y-2" role="status" aria-label={`${label} ${percent}%`}>
      <div className="flex items-center justify-between text-sm">
        <span className={`flex items-center gap-2 font-medium ${text}`}>
          <Icon className={`size-4 ${status === 'uploading' ? 'animate-spin' : ''}`} /> {label}
        </span>
        <span className="font-semibold text-white tabular-nums">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          style={{ width: `${percent}%` }}
          className={`h-full rounded-full transition-[width] duration-300 ease-out ${bar}`}
        />
      </div>
      <p className="text-xs text-slate-500 tabular-nums">
        {formatBytes((size * percent) / 100)} of {formatBytes(size)}
      </p>
    </div>
  );
}
