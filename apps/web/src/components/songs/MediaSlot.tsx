import { Check, CircleAlert, Plus, type LucideIcon } from 'lucide-react';
import { useState, type ChangeEvent, type DragEvent } from 'react';
import type { FileUpload } from '../../types/song';
import { formatBytes } from '../../utils/helpers';

interface MediaSlotProps {
  label: string;
  hint: string;
  accept: string;
  icon: LucideIcon;
  upload: FileUpload;
  file?: File;
  previewUrl?: string | null;
  disabled?: boolean;
  onSelect: (file: File) => void;
}

const Status = ({ upload, file, hint }: Pick<MediaSlotProps, 'upload' | 'file' | 'hint'>) => {
  if (upload.status === 'uploading')
    return <span className="text-lime-300 tabular-nums">Uploading · {upload.percent}%</span>;
  if (upload.status === 'done')
    return (
      <span className="flex items-center gap-1 text-lime-300">
        <Check className="size-3.5" strokeWidth={3} /> Added
      </span>
    );
  if (upload.status === 'failed')
    return (
      <span className="flex items-center gap-1 text-rose-300">
        <CircleAlert className="size-3.5" /> Failed, pick it again
      </span>
    );
  return <span>{file ? formatBytes(file.size) : hint}</span>;
};

export default function MediaSlot({
  label,
  hint,
  accept,
  icon: Icon,
  upload,
  file,
  previewUrl,
  disabled,
  onSelect,
}: MediaSlotProps) {
  const [dragging, setDragging] = useState(false);
  const locked = disabled || upload.status === 'uploading';
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) onSelect(picked);
    e.target.value = '';
  };
  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!locked) setDragging(true);
  };
  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && !locked) onSelect(dropped);
  };

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-ink-900 p-3.5 transition duration-200 motion-reduce:transition-none ${dragging ? 'border-lime-300/70' : 'border-white/[0.07]'} ${locked ? 'cursor-default' : 'cursor-pointer hover:border-white/15 hover:bg-ink-850'} ${disabled ? 'opacity-50' : ''}`}
    >
      <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-ink-800 text-slate-400 ring-1 ring-white/10 transition group-hover:text-lime-300">
        {previewUrl ? (
          <img src={previewUrl} alt="" className="size-full object-cover" />
        ) : (
          <Icon className="size-5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-white">
          {file ? file.name : label}
        </span>
        <span className="block text-xs text-slate-500">
          <Status upload={upload} file={file} hint={hint} />
        </span>
      </span>
      {upload.status === 'idle' && !file && !disabled && (
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-white/10 text-slate-400 transition group-hover:border-lime-300/50 group-hover:text-lime-300">
          <Plus className="size-4" />
        </span>
      )}
      {upload.status === 'uploading' && (
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white/5">
          <span
            style={{ width: `${upload.percent}%` }}
            className="block h-full bg-lime-300 transition-[width] duration-300 ease-out"
          />
        </span>
      )}
      <input
        type="file"
        accept={accept}
        disabled={locked}
        onChange={handleChange}
        aria-label={label}
        className="sr-only"
      />
    </label>
  );
}
