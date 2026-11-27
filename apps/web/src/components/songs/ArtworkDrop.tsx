import { AudioLines, ImagePlus, Lock } from 'lucide-react';
import { useState, type ChangeEvent, type DragEvent } from 'react';
import type { FileUpload } from '../../types/song';
import { artworkFor } from '../../utils/helpers';

interface ArtworkDropProps {
  seed: string;
  accept: string;
  upload: FileUpload;
  previewUrl: string | null;
  locked: boolean; // the cover can only join a song that exists
  onSelect: (file: File) => void;
}

export default function ArtworkDrop({
  seed,
  accept,
  upload,
  previewUrl,
  locked,
  onSelect,
}: ArtworkDropProps) {
  const [dragging, setDragging] = useState(false);
  const disabled = locked || upload.status === 'uploading';
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) onSelect(picked);
    e.target.value = '';
  };
  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  };
  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && !disabled) onSelect(dropped);
  };

  return (
    <div className="space-y-3">
      <label
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`group relative block aspect-square overflow-hidden rounded-2xl shadow-2xl ring-1 shadow-black/60 transition duration-300 motion-reduce:transition-none ${dragging ? 'ring-2 ring-lime-300' : 'ring-white/10'} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Cover artwork" className="size-full object-cover" />
        ) : (
          <div className={`grid size-full place-items-center bg-linear-to-br ${artworkFor(seed)}`}>
            <AudioLines className="size-16 text-white/70" />
          </div>
        )}
        {!disabled && (
          <span className="absolute inset-0 grid place-items-center bg-ink-950/60 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
            <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-950">
              <ImagePlus className="size-4" /> {previewUrl ? 'Replace artwork' : 'Add artwork'}
            </span>
          </span>
        )}
        {upload.status === 'uploading' && (
          <span className="absolute inset-x-0 bottom-0 bg-ink-950/80 px-4 py-3 backdrop-blur">
            <span className="flex justify-between text-xs font-medium text-white tabular-nums">
              Uploading artwork <span>{upload.percent}%</span>
            </span>
            <span className="mt-2 block h-1 rounded-full bg-white/10">
              <span
                style={{ width: `${upload.percent}%` }}
                className="block h-full rounded-full bg-lime-300 transition-[width] duration-300"
              />
            </span>
          </span>
        )}
        <input
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={handleChange}
          aria-label="Cover artwork"
          className="sr-only"
        />
      </label>
      {locked && (
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <Lock className="size-3" /> Artwork unlocks once the track is up
        </p>
      )}
      {upload.status === 'failed' && (
        <p className="text-xs text-rose-300">Artwork failed to upload. Pick it again.</p>
      )}
    </div>
  );
}
