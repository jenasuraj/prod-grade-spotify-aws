import { AudioLines, Check, CircleAlert, RefreshCw } from 'lucide-react';
import { useState, type ChangeEvent, type DragEvent } from 'react';
import type { FileUpload } from '../../types/song';
import { formatBytes } from '../../utils/helpers';

// A fixed, made-up waveform; its lit bars only show how far the upload has got
const WAVE = Array.from(
  { length: 120 },
  (_, i) => 0.15 + 0.85 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.31)),
);

interface AudioDropzoneProps {
  accept: string;
  upload: FileUpload;
  file?: File;
  onSelect: (file: File) => void;
}

const Status = ({ upload, file }: Pick<AudioDropzoneProps, 'upload' | 'file'>) => {
  if (upload.status === 'uploading')
    return (
      <p className="text-sm text-slate-400 tabular-nums">
        <span className="font-display text-xl font-semibold text-white">{upload.percent}%</span> ·{' '}
        {formatBytes(((file?.size ?? 0) * upload.percent) / 100)} of {formatBytes(file?.size ?? 0)}
      </p>
    );
  if (upload.status === 'done')
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-lime-300">
        <Check className="size-4" strokeWidth={3} /> Track uploaded
      </p>
    );
  if (upload.status === 'failed')
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-rose-300">
        <CircleAlert className="size-4" /> Upload failed. Try again or pick another file.
      </p>
    );
  if (file)
    return (
      <p className="flex items-center gap-1.5 text-sm text-slate-400">
        <RefreshCw className="size-3.5" /> Ready · click or drop to replace
      </p>
    );
  return (
    <p className="text-sm text-slate-400">
      Drop audio here or{' '}
      <span className="font-medium text-lime-300 underline-offset-4 group-hover:underline">
        browse
      </span>{' '}
      · MP3, M4A, WAV, FLAC, OGG · 50 MB
    </p>
  );
};

const barTone = (lit: boolean, failed: boolean) => {
  if (!lit) return 'bg-white/[0.08] group-hover:bg-white/[0.12]';
  return failed ? 'bg-rose-400' : 'bg-lime-300';
};

export default function AudioDropzone({ accept, upload, file, onSelect }: AudioDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const locked = upload.status === 'uploading' || upload.status === 'done';
  const lit = upload.status === 'idle' && file ? WAVE.length : (upload.percent / 100) * WAVE.length;
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
      className={`group relative flex flex-col gap-5 rounded-2xl border p-5 transition duration-300 motion-reduce:transition-none sm:p-6 ${dragging ? 'border-lime-300/70 bg-lime-300/[0.04]' : 'border-white/[0.07] bg-ink-900/70'} ${locked ? 'cursor-default' : 'cursor-pointer hover:border-white/15 hover:bg-ink-900'}`}
    >
      <div className="flex items-center gap-4">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-xl transition duration-300 ${file ? 'bg-lime-300 text-ink-950' : 'bg-ink-800 text-lime-300 ring-1 ring-white/10 group-hover:ring-lime-300/40'}`}
        >
          <AudioLines className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {file ? file.name : 'Add the audio'}
            {file && (
              <span className="ml-2 font-normal text-slate-500">
                {formatBytes(file.size)} · {file.type.replace('audio/', '').toUpperCase()}
              </span>
            )}
          </p>
          <Status upload={upload} file={file} />
        </div>
      </div>
      <div aria-hidden="true" className="flex h-20 items-center gap-[2px] sm:h-24">
        {WAVE.map((height, i) => (
          <span
            key={i}
            style={{ height: `${height * 100}%` }}
            className={`flex-1 rounded-full transition-colors duration-300 ${barTone(i < lit, upload.status === 'failed')}`}
          />
        ))}
      </div>
      <input
        type="file"
        accept={accept}
        disabled={locked}
        onChange={handleChange}
        aria-label="Music file"
        className="sr-only"
      />
    </label>
  );
}
