import { LoaderCircle, Pencil, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import FollowStats from '../../components/profile/FollowStats';
import ProfileCard from '../../components/profile/ProfileCard';
import ProfileForm from '../../components/profile/ProfileForm';
import SongList from '../../components/songs/SongList';
import FormMessage from '../../components/ui/FormMessage';
import SectionHeading from '../../components/ui/SectionHeading';
import SectionTabs from '../../components/ui/SectionTabs';
import { useAppDispatch, useAppSelector } from '../../store';
import { songPlayed } from '../../store/player/playerSlice';
import {
  fetchFollows,
  fetchProfile,
  fetchProfileSongs,
  updateProfile,
  uploadAvatar,
} from '../../store/profile/profileThunks';
import { APP_NAME, artworkFor, GUTTER } from '../../utils/helpers';

const TABS = ['tracks', 'liked', 'people'];

// /:name — anyone can view it; the owner can also edit it and change the picture
export default function ProfilePage() {
  const { name = '' } = useParams();
  const dispatch = useAppDispatch();
  const me = useAppSelector((s) => s.auth.user);
  const playingId = useAppSelector((s) => s.player.current?.id);
  const { data, follows, songs, loading, saving, error, notice } = useAppSelector((s) => s.profile);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState(TABS[0]);
  const isOwner = me?.name === name;
  const tracks = songs?.songs ?? [];
  const liked = songs?.liked ?? [];
  const songsLoading = !songs && !error;
  const stats = [
    { label: tracks.length === 1 ? 'track' : 'tracks', value: tracks.length },
    { label: 'liked', value: liked.length },
    { label: 'followers', value: follows?.followerCount ?? 0 },
    { label: 'following', value: follows?.followingCount ?? 0 },
  ];

  useEffect(() => {
    void dispatch(fetchProfile(name));
    void dispatch(fetchFollows(name));
    void dispatch(fetchProfileSongs(name));
  }, [dispatch, name]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-ink-950 text-slate-100">
      <title>{`${name} — ${APP_NAME}`}</title>

      <header className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className={`absolute -top-1/2 left-0 -z-10 h-[180%] w-full bg-linear-to-br opacity-25 blur-3xl ${artworkFor(name)}`}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-b from-transparent via-ink-950/40 to-ink-950"
        />
        <div className={`space-y-6 py-12 lg:py-16 ${GUTTER}`}>
          {loading && (
            <div role="status" aria-label="Loading" className="grid h-56 place-items-center">
              <LoaderCircle className="size-6 animate-spin text-slate-500" />
            </div>
          )}
          {data && (
            <ProfileCard
              data={data}
              stats={stats}
              onUpload={isOwner ? (file) => void dispatch(uploadAvatar(file)) : undefined}
              uploading={saving}
            >
              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing(!editing)}
                    className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-lime-300 active:scale-[0.98]"
                  >
                    <Pencil className="size-4" /> {editing ? 'Close editor' : 'Edit profile'}
                  </button>
                  <Link
                    to="/songs/new"
                    className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-white transition hover:border-lime-300/60 hover:text-lime-300"
                  >
                    <Plus className="size-4" /> New track
                  </Link>
                </>
              )}
            </ProfileCard>
          )}
          {data && isOwner && editing && (
            <div className="max-w-md">
              <ProfileForm
                profile={data.profile}
                saving={saving}
                onSave={(payload) => void dispatch(updateProfile(payload))}
              />
            </div>
          )}
          <div className="max-w-xl space-y-2">
            <FormMessage message={error} />
            <FormMessage message={notice} tone="success" />
          </div>
        </div>
      </header>

      <SectionTabs ids={TABS} active={tab} onSelect={setTab} />

      <section className={`py-12 lg:py-16 ${GUTTER}`}>
        {tab === 'tracks' && (
          <>
            <SectionHeading title="Tracks" subtitle="Everything released, newest first." />
            <SongList
              songs={tracks}
              playingId={playingId}
              onPlay={(song) => dispatch(songPlayed({ ...song, artist: name }))}
              loading={songsLoading}
              emptyText={
                isOwner ? 'No tracks yet. Your first upload will land here.' : 'No tracks yet.'
              }
            />
          </>
        )}
        {tab === 'liked' && (
          <>
            <SectionHeading title="Liked" subtitle="Songs from other artists, latest like first." />
            <SongList
              songs={liked}
              playingId={playingId}
              onPlay={(song) => dispatch(songPlayed(song))}
              loading={songsLoading}
              emptyText="No liked songs yet."
              renderCredit={(song) => (
                <Link
                  to={`/${song.artist}`}
                  className="mt-0.5 block truncate text-sm text-slate-400 hover:text-white hover:underline"
                >
                  {song.artist}
                </Link>
              )}
            />
          </>
        )}
        {tab === 'people' && (
          <>
            <SectionHeading title="People" subtitle="Who they follow and who follows them." />
            {follows && <FollowStats follows={follows} />}
          </>
        )}
      </section>
    </div>
  );
}
