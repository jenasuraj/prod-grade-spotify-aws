import { ArrowRight, Clapperboard, LoaderCircle, Plus, Search } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import ArtworkDrop from '../../components/songs/ArtworkDrop';
import AudioDropzone from '../../components/songs/AudioDropzone';
import GenrePicker from '../../components/songs/GenrePicker';
import MediaSlot from '../../components/songs/MediaSlot';
import ReleaseChecklist, { type ChecklistItem } from '../../components/songs/ReleaseChecklist';
import SongList from '../../components/songs/SongList';
import FormMessage from '../../components/ui/FormMessage';
import SectionTabs from '../../components/ui/SectionTabs';
import { useAppDispatch, useAppSelector } from '../../store';
import { songPlayed } from '../../store/player/playerSlice';
import { songReset } from '../../store/songs/songsSlice';
import { deleteSong, fetchSongs, uploadSongFile } from '../../store/songs/songsThunks';
import type { FileUpload, SongFileKind } from '../../types/song';
import { APP_NAME, artworkFor, formatBytes, GUTTER, scrollToSection } from '../../utils/helpers';
import { useActiveSection } from './useActiveSection';
import { useObjectUrl } from './useObjectUrl';

const MB = 1024 * 1024;
const SECTIONS = ['studio', 'library'];

// Same list the api accepts
const GENRES = [
  'Pop',
  'Hip-hop',
  'R&B',
  'Rock',
  'Electronic',
  'Jazz',
  'Classical',
  'Lo-fi',
  'Indie',
  'Folk',
];

// Same rules as the api, so a wrong file is caught before anything is sent
const FILES: Record<SongFileKind, { accept: string; maxSize: number }> = {
  music: {
    accept:
      'audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,audio/flac,audio/x-flac,audio/ogg',
    maxSize: 50 * MB,
  },
  image: { accept: 'image/jpeg,image/png,image/webp', maxSize: 5 * MB },
  video: { accept: 'video/mp4,video/webm', maxSize: 200 * MB },
};

const fileError = (kind: SongFileKind, file: File) => {
  const { accept, maxSize } = FILES[kind];
  if (!accept.split(',').includes(file.type)) return "That file type isn't supported here";
  if (file.size > maxSize) return `Pick a file up to ${maxSize / MB} MB`;
  return '';
};

const fileState = ({ status }: FileUpload): ChecklistItem['state'] => {
  if (status === 'done') return 'done';
  if (status === 'failed') return 'failed';
  return status === 'uploading' ? 'active' : 'todo';
};

const fileDetail = ({ status, percent }: FileUpload, file: File | undefined, idle: string) => {
  if (status === 'uploading') return `Uploading · ${percent}%`;
  if (status === 'failed') return 'Failed, try again';
  if (file) return `${file.name} · ${formatBytes(file.size)}`;
  return idle;
};

export default function UploadSongPage() {
  const dispatch = useAppDispatch();
  const { songId, uploads, error, list, listLoading, listError, deleting } = useAppSelector(
    (s) => s.songs,
  );
  const me = useAppSelector((s) => s.auth.user);
  const playingId = useAppSelector((s) => s.player.current?.id);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [files, setFiles] = useState<Partial<Record<SongFileKind, File>>>({});
  const [fileMessage, setFileMessage] = useState('');
  const [query, setQuery] = useState('');
  const coverPreview = useObjectUrl(files.image);
  const active = useActiveSection(SECTIONS);
  const musicDone = uploads.music.status === 'done';
  const busy = Object.values(uploads).some(({ status }) => status === 'uploading');
  const seed = songId ?? (title || 'new');
  const needle = query.trim().toLowerCase();
  const shown = list.filter(
    (song) =>
      !needle ||
      song.title.toLowerCase().includes(needle) ||
      song.description?.toLowerCase().includes(needle) ||
      song.genres.some((genre) => genre.toLowerCase().includes(needle)),
  );
  const checklist: ChecklistItem[] = [
    {
      label: 'Title',
      detail: title.trim() || 'Name your track',
      state: title.trim() ? 'done' : 'active',
    },
    {
      label: 'Genres',
      detail: genres.length ? genres.join(', ') : 'Optional',
      state: genres.length ? 'done' : 'todo',
    },
    {
      label: 'Audio',
      detail: fileDetail(uploads.music, files.music, 'Required'),
      state: fileState(uploads.music),
    },
    {
      label: 'Artwork',
      detail: fileDetail(uploads.image, files.image, 'Optional'),
      state: fileState(uploads.image),
    },
    {
      label: 'Video',
      detail: fileDetail(uploads.video, files.video, 'Optional'),
      state: fileState(uploads.video),
    },
  ];

  useEffect(() => {
    void dispatch(fetchSongs());
    return () => void dispatch(songReset());
  }, [dispatch]);

  const pick = (kind: SongFileKind) => (file: File) => {
    const message = fileError(kind, file);
    setFileMessage(message);
    if (message) return;
    setFiles({ ...files, [kind]: file });
    // Once the song exists, artwork or video uploads as soon as it's picked
    if (kind !== 'music') void dispatch(uploadSongFile({ kind, file }));
  };

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (files.music)
      void dispatch(
        uploadSongFile({ kind: 'music', file: files.music, title, description, genres }),
      );
  };

  const handleFinish = () => {
    dispatch(songReset());
    setTitle('');
    setDescription('');
    setGenres([]);
    setFiles({});
    setFileMessage('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-ink-950 text-slate-100">
      <title>{`Studio — ${APP_NAME}`}</title>

      <SectionTabs ids={SECTIONS} active={active} onSelect={scrollToSection}>
        {list.length} {list.length === 1 ? 'track' : 'tracks'} in your library
      </SectionTabs>

      <section id="studio" className="relative isolate scroll-mt-28 overflow-hidden">
        <div
          aria-hidden="true"
          className={`absolute -top-1/3 left-0 -z-10 h-[140%] w-2/3 bg-linear-to-br opacity-[0.18] blur-3xl transition-colors duration-700 ${artworkFor(seed)}`}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-b from-transparent via-ink-950/40 to-ink-950"
        />

        <form
          onSubmit={handleCreate}
          className={`grid gap-10 py-10 md:grid-cols-[14rem_minmax(0,1fr)] lg:grid-cols-[18rem_minmax(0,1fr)] lg:py-14 xl:grid-cols-[20rem_minmax(0,1fr)_19rem] xl:gap-12 2xl:grid-cols-[24rem_minmax(0,1fr)_22rem] ${GUTTER}`}
        >
          <div className="mx-auto w-full max-w-72 md:max-w-none">
            <ArtworkDrop
              seed={seed}
              accept={FILES.image.accept}
              upload={uploads.image}
              previewUrl={coverPreview}
              locked={!musicDone}
              onSelect={pick('image')}
            />
          </div>

          <div className="flex min-w-0 flex-col">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] text-slate-400 uppercase">
              <span
                className={`size-1.5 rounded-full ${musicDone ? 'bg-lime-300' : 'bg-amber-300'}`}
              />
              Single · {musicDone ? 'Saved' : 'Draft'}
            </p>
            <input
              aria-label="Title"
              placeholder="Untitled track"
              required
              maxLength={100}
              disabled={!!songId}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-3 w-full border-0 bg-transparent p-0 font-display text-4xl font-semibold tracking-tight text-white placeholder:text-white/20 focus:outline-none disabled:text-white sm:text-5xl xl:text-6xl"
            />
            <textarea
              aria-label="Description"
              placeholder="Add a line about the track, the mood, who's on it…"
              rows={2}
              maxLength={1000}
              disabled={!!songId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-3 w-full max-w-3xl resize-none border-0 bg-transparent p-0 leading-relaxed text-slate-300 placeholder:text-slate-600 focus:outline-none disabled:text-slate-400"
            />
            <div className="mt-5">
              <p className="mb-3 text-[11px] font-semibold tracking-[0.22em] text-slate-500 uppercase">
                Genres <span className="tracking-normal normal-case">· pick any</span>
              </p>
              <GenrePicker
                options={GENRES}
                selected={genres}
                disabled={!!songId}
                onChange={setGenres}
              />
            </div>

            <div className="mt-8">
              <AudioDropzone
                accept={FILES.music.accept}
                upload={uploads.music}
                file={files.music}
                onSelect={pick('music')}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              {musicDone ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleFinish}
                  className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-lime-300 active:scale-[0.98] disabled:opacity-40"
                >
                  <Plus className="size-4" /> Start another track
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={busy || !files.music || !title.trim()}
                  className="group flex items-center gap-2 rounded-full bg-lime-300 px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-lime-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-30 motion-reduce:transition-none"
                >
                  {busy ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" /> Uploading{' '}
                      {uploads.music.percent}%
                    </>
                  ) : (
                    <>
                      Save track
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              )}
              <p className="text-sm text-slate-500">
                {musicDone
                  ? 'Saved. Add artwork or a video, both upload as soon as you pick them.'
                  : 'Audio goes straight from your browser to storage.'}
              </p>
            </div>
            <div className="mt-4 max-w-xl">
              <FormMessage message={fileMessage || error} />
            </div>
          </div>

          <aside className="space-y-8 md:col-span-2 xl:col-span-1 xl:border-l xl:border-white/[0.06] xl:pl-10">
            <div>
              <p className="mb-5 text-[11px] font-semibold tracking-[0.22em] text-slate-500 uppercase">
                Release checklist
              </p>
              <ReleaseChecklist items={checklist} />
            </div>
            <MediaSlot
              label="Add a video"
              hint={musicDone ? 'MP4 or WebM · up to 200 MB' : 'Unlocks once the track is up'}
              accept={FILES.video.accept}
              icon={Clapperboard}
              upload={uploads.video}
              file={files.video}
              disabled={!musicDone}
              onSelect={pick('video')}
            />
          </aside>
        </form>
      </section>

      <section
        id="library"
        className={`scroll-mt-28 border-t border-white/[0.06] py-12 lg:py-16 ${GUTTER}`}
      >
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Library
            </h2>
            <p className="mt-1 text-sm text-slate-500">Everything you've released, newest first.</p>
          </div>
          <label className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              aria-label="Search your tracks"
              placeholder="Search title or genre"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full border border-white/[0.07] bg-ink-900 py-2.5 pr-4 pl-11 text-sm text-slate-100 transition placeholder:text-slate-600 hover:border-white/15 focus:border-lime-300/50 focus:ring-4 focus:ring-lime-300/10 focus:outline-none"
            />
          </label>
        </div>
        <FormMessage message={listError} />
        <SongList
          songs={shown}
          playingId={playingId}
          onPlay={(song) => dispatch(songPlayed({ ...song, artist: me?.name }))}
          loading={listLoading}
          deleting={deleting}
          onDelete={(id) => void dispatch(deleteSong(id))}
          emptyText={
            needle
              ? `Nothing matches "${query.trim()}".`
              : 'No tracks yet. Your first upload will land here.'
          }
        />
      </section>
    </div>
  );
}
