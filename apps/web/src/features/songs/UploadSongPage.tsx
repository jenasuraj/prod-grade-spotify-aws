import { CloudUpload, Music, RotateCcw, X } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import SongList from '../../components/songs/SongList';
import UploadProgress from '../../components/songs/UploadProgress';
import FormMessage from '../../components/ui/FormMessage';
import { useAppDispatch, useAppSelector } from '../../store';
import { uploadReset } from '../../store/songs/songsSlice';
import { fetchSongs, uploadSong } from '../../store/songs/songsThunks';
import { APP_NAME, formatBytes } from '../../utils/helpers';

const MUSIC_TYPES =
  'audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,audio/flac,audio/x-flac,audio/ogg';

const MAX_SIZE = 50 * 1024 * 1024;

// Same rules as the api, so a wrong file is caught before anything is sent
const fileError = (file: File) => {
  if (!MUSIC_TYPES.split(',').includes(file.type)) return 'Pick an mp3, m4a, wav, flac or ogg file';
  if (file.size > MAX_SIZE) return 'Music must be at most 50 MB';
  return '';
};

export default function UploadSongPage() {
  const dispatch = useAppDispatch();
  const { status, percent, error, list, listLoading, listError } = useAppSelector((s) => s.songs);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileMessage, setFileMessage] = useState('');
  const [dragging, setDragging] = useState(false);
  const uploading = status === 'uploading';
  useEffect(() => {
    void dispatch(fetchSongs());
    return () => void dispatch(uploadReset());
  }, [dispatch]);
  const pick = (picked?: File) => {
    if (!picked) return;
    const message = fileError(picked);
    setFileMessage(message);
    if (!message) setFile(picked);
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    pick(e.target.files?.[0]);
    e.target.value = '';
  };
  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    if (!uploading) pick(e.dataTransfer.files[0]);
  };
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (file) void dispatch(uploadSong({ title, file }));
  };
  const handleReset = () => {
    dispatch(uploadReset());
    setTitle('');
    setFile(null);
  };

  return (
    <section className="relative isolate flex min-h-[calc(100vh-4rem)] flex-col items-center gap-8 overflow-hidden bg-slate-950 px-4 py-10">
      <title>{`Upload a song — ${APP_NAME}`}</title>
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/2 -z-10 size-[32rem] -translate-x-1/2 rounded-full bg-green-500/10 blur-3xl"
      />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8"
      >
        <header className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-green-500 text-slate-950">
            <Music className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-white">Upload a song</h1>
            <p className="text-sm text-slate-400">
              It goes straight from your browser to the cloud.
            </p>
          </div>
        </header>

        <input
          aria-label="Title"
          placeholder="Song title"
          required
          maxLength={100}
          disabled={uploading || status === 'done'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-white transition placeholder:text-slate-600 focus:border-green-500/60 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
        />
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition ${dragging ? 'border-green-400 bg-green-500/10' : 'border-slate-700 hover:border-green-500/60'} ${uploading || status === 'done' ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-800 text-green-400">
            <CloudUpload className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">
              {file ? file.name : 'Drop your music here or click to browse'}
            </span>
            <span className="block text-xs text-slate-400">
              {file ? formatBytes(file.size) : 'MP3, M4A, WAV, FLAC or OGG · up to 50 MB'}
            </span>
          </span>
          {file && status === 'idle' && (
            <button
              type="button"
              aria-label="Remove file"
              onClick={(e) => {
                e.preventDefault();
                setFile(null);
              }}
              className="pointer-events-auto grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
          <input type="file" accept={MUSIC_TYPES} onChange={handleChange} className="sr-only" />
        </label>

        {file && <UploadProgress status={status} percent={percent} size={file.size} />}
        <FormMessage message={fileMessage || error} />
        {status === 'done' ? (
          <button
            type="button"
            onClick={handleReset}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-700 py-3 text-sm font-semibold text-slate-200 transition hover:border-green-500/60 hover:text-white"
          >
            <RotateCcw className="size-4" /> Upload another
          </button>
        ) : (
          <button
            type="submit"
            disabled={uploading || !file || !title.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-green-500 py-3 text-sm font-bold text-slate-950 transition hover:bg-green-400 disabled:pointer-events-none disabled:opacity-40"
          >
            <CloudUpload className="size-4" /> {uploading ? `Uploading ${percent}%` : 'Upload'}
          </button>
        )}
      </form>

      <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
        <h2 className="flex items-center justify-between text-lg font-bold text-white">
          Your songs
          <span className="text-sm font-medium text-slate-500">{list.length}</span>
        </h2>
        <FormMessage message={listError} />
        <SongList songs={list} loading={listLoading} />
      </div>
    </section>
  );
}
