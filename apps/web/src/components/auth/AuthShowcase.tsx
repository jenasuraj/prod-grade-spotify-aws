import { AudioLines, Play } from 'lucide-react';
import { FaSpotify } from 'react-icons/fa';
import { Link } from 'react-router';
import { APP_NAME, artworkFor } from '../../utils/helpers';

// Seeds only pick a gradient; every 3rd tile gets a play button
const TILES = ['dawn', 'blue hour', 'neon', 'low tide', 'static', 'ember', 'moss', 'drift', 'echo'];

// Left half of the auth page on large screens: a wall of cover art behind the pitch
export default function AuthShowcase() {
  return (
    <aside className="relative isolate hidden overflow-hidden bg-ink-900 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div
        aria-hidden="true"
        className="absolute -top-16 -right-24 -z-10 grid w-[130%] rotate-[-8deg] grid-cols-3 gap-4 opacity-80"
      >
        {TILES.map((seed, i) => (
          <div
            key={seed}
            className={`grid aspect-square place-items-center rounded-3xl bg-linear-to-br ${artworkFor(seed)}`}
          >
            {i % 3 === 1 ? (
              <span className="grid size-14 place-items-center rounded-full bg-white text-ink-950 shadow-xl">
                <Play className="size-6 translate-x-px fill-current" />
              </span>
            ) : (
              <AudioLines className="size-10 text-white/50" />
            )}
          </div>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-ink-950 via-ink-950/80 to-ink-950/10"
      />
      <Link to="/" className="flex items-center gap-2.5 font-display text-xl font-semibold">
        <FaSpotify className="size-8" /> {APP_NAME}
      </Link>
      <div className="max-w-md">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-lime-300 uppercase">
          Made by listeners
        </p>
        <p className="mt-4 font-display text-5xl leading-[1.05] font-semibold tracking-tight text-white xl:text-6xl">
          Your sound, out in the open.
        </p>
        <p className="mt-5 leading-relaxed text-slate-400">
          Upload your tracks, follow the artists you rate and keep every song you love in one place.
        </p>
      </div>
    </aside>
  );
}
