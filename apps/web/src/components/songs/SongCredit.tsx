import { Heart } from 'lucide-react';
import { Link } from 'react-router';

interface SongCreditProps {
  title: string;
  artist: string;
  liked: boolean;
  following: boolean;
  onLike: () => void;
  onFollow: () => void;
}

// Who made someone else's song, with like and follow
export default function SongCredit({
  title,
  artist,
  liked,
  following,
  onLike,
  onFollow,
}: SongCreditProps) {
  return (
    <div className="mt-1 flex items-center gap-2">
      <Link
        to={`/${artist}`}
        className="truncate text-sm text-slate-400 hover:text-white hover:underline"
      >
        {artist}
      </Link>
      <button
        type="button"
        onClick={onFollow}
        aria-pressed={following}
        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ${following ? 'border-white/15 text-slate-300 hover:border-white/30' : 'border-lime-300/50 text-lime-300 hover:bg-lime-300/10'}`}
      >
        {following ? 'Following' : 'Follow'}
      </button>
      <button
        type="button"
        onClick={onLike}
        aria-pressed={liked}
        aria-label={`${liked ? 'Unlike' : 'Like'} ${title}`}
        className="ml-auto shrink-0 text-slate-400 transition hover:scale-110 hover:text-white"
      >
        <Heart className={`size-5 ${liked ? 'fill-lime-300 text-lime-300' : ''}`} />
      </button>
    </div>
  );
}
