import { AudioLines, Clapperboard, LoaderCircle, Play, Trash2, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { Song } from '../../types/song';
import { artworkFor } from '../../utils/helpers';

interface SongListProps<T extends Song> {
  songs: T[];
  loading: boolean;
  emptyText: string;
  playingId?: string; // the song in the player bar
  onPlay: (song: T) => void;
  deleting?: string[]; // ids with a delete in flight
  onDelete?: (id: string) => void; // no delete button without it
  renderCredit?: (song: T) => ReactNode; // shown under the title, e.g. artist and like
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

// An open video, else the artwork, else a generated gradient
const Cover = ({ id, imageUrl, videoUrl }: Pick<Song, 'id' | 'imageUrl' | 'videoUrl'>) => {
  if (videoUrl)
    return <video controls autoPlay src={videoUrl} className="size-full bg-black object-contain" />;
  if (imageUrl)
    return (
      <img
        src={imageUrl}
        alt=""
        className="size-full object-cover transition duration-500 group-hover/card:scale-[1.03] motion-reduce:transition-none"
      />
    );
  return (
    <div className={`grid size-full place-items-center bg-linear-to-br ${artworkFor(id)}`}>
      <AudioLines className="size-12 text-white/70" />
    </div>
  );
};

export default function SongList<T extends Song>({
  songs,
  loading,
  emptyText,
  playingId,
  onPlay,
  deleting = [],
  onDelete,
  renderCredit,
}: SongListProps<T>) {
  const [openVideo, setOpenVideo] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  if (loading && !songs.length)
    return (
      <div role="status" aria-label="Loading songs" className="grid place-items-center py-20">
        <LoaderCircle className="size-5 animate-spin text-slate-500" />
      </div>
    );
  if (!songs.length)
    return (
      <div className="grid place-items-center gap-3 rounded-3xl border border-dashed border-white/10 py-20 text-center">
        <AudioLines className="size-8 text-slate-600" />
        <p className="max-w-xs text-sm text-slate-500">{emptyText}</p>
      </div>
    );
  return (
    <ol className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {songs.map((song) => {
        const { id, title, description, genres, createdAt, imageUrl, videoUrl } = song;
        const playing = playingId === id;
        return (
          <li key={id} className="group/card min-w-0">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-ink-900 ring-1 ring-white/[0.06] transition duration-300 group-hover/card:ring-white/15 motion-reduce:transition-none">
              <Cover id={id} imageUrl={imageUrl} videoUrl={openVideo === id ? videoUrl : null} />
              <button
                type="button"
                onClick={() => onPlay(song)}
                aria-label={playing ? `${title} is playing` : `Play ${title}`}
                className={`absolute right-3 bottom-3 grid size-12 place-items-center rounded-full bg-lime-300 text-ink-950 shadow-xl shadow-black/40 transition hover:scale-105 hover:bg-lime-200 focus-visible:opacity-100 motion-reduce:transition-none ${playing ? '' : 'sm:translate-y-2 sm:opacity-0 sm:group-hover/card:translate-y-0 sm:group-hover/card:opacity-100'}`}
              >
                {playing ? (
                  <AudioLines className="size-5" />
                ) : (
                  <Play className="size-5 translate-x-px fill-current" />
                )}
              </button>
              {onDelete && (
                <button
                  type="button"
                  aria-label={`Delete ${title}`}
                  onClick={() => setConfirming(id)}
                  className="absolute top-3 left-3 grid size-8 place-items-center rounded-full bg-ink-950/75 text-slate-300 backdrop-blur transition hover:bg-rose-500 hover:text-white focus-visible:opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
              {videoUrl && (
                <button
                  type="button"
                  aria-pressed={openVideo === id}
                  onClick={() => setOpenVideo(openVideo === id ? null : id)}
                  className="absolute top-3 right-3 flex h-8 items-center gap-1.5 rounded-full bg-ink-950/75 px-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-ink-950"
                >
                  {openVideo === id ? (
                    <>
                      <X className="size-3.5" /> Close
                    </>
                  ) : (
                    <>
                      <Clapperboard className="size-3.5" /> Video
                    </>
                  )}
                </button>
              )}
              {(confirming === id || deleting.includes(id)) && (
                <div
                  role="alertdialog"
                  aria-label={`Delete ${title}?`}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink-950/90 p-5 text-center backdrop-blur-sm"
                >
                  {deleting.includes(id) ? (
                    <p className="flex items-center gap-2 text-sm text-slate-300">
                      <LoaderCircle className="size-4 animate-spin" /> Deleting…
                    </p>
                  ) : (
                    <>
                      <div>
                        <p className="font-display font-semibold text-white">Delete “{title}”?</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Its audio, artwork and video are removed for good.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirming(null)}
                          className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/30"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirming(null);
                            onDelete?.(id);
                          }}
                          className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-400"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 px-0.5">
              <p
                className={`truncate font-display text-lg font-semibold ${playing ? 'text-lime-300' : 'text-white'}`}
              >
                {title}
              </p>
              {renderCredit?.(song)}
              <p className="truncate text-sm text-slate-500">
                {description ? `${description} · ` : ''}
                {formatDate(createdAt)}
              </p>
              {genres.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {genres.map((genre) => (
                    <li
                      key={genre}
                      className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-slate-300"
                    >
                      {genre}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
