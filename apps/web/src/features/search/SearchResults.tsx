import { useEffect } from 'react';
import SongCredit from '../../components/songs/SongCredit';
import SongList from '../../components/songs/SongList';
import FormMessage from '../../components/ui/FormMessage';
import { useAppDispatch, useAppSelector } from '../../store';
import { followArtist, likeSong, searchSongs } from '../../store/search/searchThunks';
import { APP_NAME, GUTTER } from '../../utils/helpers';

// Searches only once typing stops for this long, so each keystroke doesn't hit the api
const TYPING_DELAY = 500;

interface SearchResultsProps {
  q: string;
}

export default function SearchResults({ q }: SearchResultsProps) {
  const dispatch = useAppDispatch();
  const { results, loading, error } = useAppSelector((s) => s.search);
  useEffect(() => {
    const timer = setTimeout(() => void dispatch(searchSongs(q)), TYPING_DELAY);
    return () => clearTimeout(timer);
  }, [dispatch, q]);

  return (
    <section
      className={`min-h-[calc(100vh-4rem)] space-y-6 bg-ink-950 py-10 text-slate-100 ${GUTTER}`}
    >
      <title>{`Search — ${APP_NAME}`}</title>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
        Songs matching “{q}”
      </h1>
      <FormMessage message={error} />
      <SongList
        songs={results}
        loading={loading}
        emptyText={`No songs match "${q}".`}
        renderCredit={(song) =>
          song.isMine ? null : (
            <SongCredit
              title={song.title}
              artist={song.artist}
              liked={song.liked}
              following={song.following}
              onLike={() => void dispatch(likeSong(song.id))}
              onFollow={() => void dispatch(followArtist(song.artist))}
            />
          )
        }
      />
    </section>
  );
}
