import { LoaderCircle, Music } from 'lucide-react';
import type { Song } from '../../types/song';

interface SongListProps {
  songs: Song[];
  loading: boolean;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export default function SongList({ songs, loading }: SongListProps) {
  if (loading && !songs.length)
    return (
      <div role="status" aria-label="Loading songs" className="grid place-items-center py-10">
        <LoaderCircle className="size-5 animate-spin text-slate-500" />
      </div>
    );
  if (!songs.length)
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No songs yet. Upload your first one above.
      </p>
    );
  return (
    <ol className="divide-y divide-slate-800">
      {songs.map(({ id, title, createdAt, musicUrl }, i) => (
        <li key={id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="w-5 text-right text-sm text-slate-500 tabular-nums">{i + 1}</span>
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-linear-to-br from-green-500 to-emerald-800 text-slate-950">
              <Music className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{title}</p>
              <p className="text-xs text-slate-500">{formatDate(createdAt)}</p>
            </div>
          </div>
          <audio controls preload="none" src={musicUrl} className="h-9 w-full sm:w-64" />
        </li>
      ))}
    </ol>
  );
}
