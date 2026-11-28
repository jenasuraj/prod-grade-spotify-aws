import { AudioLines, X } from 'lucide-react';
import { Link } from 'react-router';
import AudioPlayer from '../../components/songs/AudioPlayer';
import { useAppDispatch, useAppSelector } from '../../store';
import { playerClosed } from '../../store/player/playerSlice';
import { artworkFor } from '../../utils/helpers';

// Fixed to the bottom of every page, so a song keeps playing while you browse
export default function NowPlayingBar() {
  const dispatch = useAppDispatch();
  const song = useAppSelector((s) => s.player.current);
  if (!song) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 grid h-20 grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] items-center gap-4 border-t border-white/[0.06] bg-black/95 px-8 backdrop-blur-md sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] sm:px-6">
      <div className="flex min-w-0 items-center gap-3 ml-0 md:ml-8">
        {song.imageUrl ? (
          <img src={song.imageUrl} alt="" className="size-8 md:size-14 shrink-0 rounded-lg object-cover" />
        ) : (
          <span
            className={`grid size-14 shrink-0 place-items-center rounded-lg bg-linear-to-br ${artworkFor(song.id)}`}
          >
            <AudioLines className="size-6 text-white/70" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{song.title}</p>
          {song.artist && (
            <Link
              to={`/${song.artist}`}
              className="block truncate text-xs text-slate-400 hover:text-white hover:underline"
            >
              {song.artist}
            </Link>
          )}
        </div>
      </div>
      {/* key: a new song remounts the player, so it starts from 0 and plays */}
      <AudioPlayer key={song.id} src={song.musicUrl} title={song.title} autoPlay />
      <button
        type="button"
        onClick={() => dispatch(playerClosed())}
        aria-label="Close player"
        className="justify-self-end text-slate-400 transition hover:text-white"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}
