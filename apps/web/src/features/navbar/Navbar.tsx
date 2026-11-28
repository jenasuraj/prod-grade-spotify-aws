import { Archive, Bell, CircleArrowDown, House, Search, Users } from 'lucide-react';
import { FaSpotify } from 'react-icons/fa';
import type { ChangeEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../store';
import { termChanged } from '../../store/search/searchSlice';
import { GUTTER } from '../../utils/helpers';
import ProfileMenu from './ProfileMenu';

const ICON_BUTTON =
  'grid size-8 place-items-center text-zinc-400 transition-colors hover:text-white';

// Persists across routes via Layout. Typing in search shows the results on the home page
export default function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const term = useAppSelector((s) => s.search.term);
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch(termChanged(e.target.value));
    if (pathname !== '/') void navigate('/');
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between gap-4 bg-black ${GUTTER}`}
    >
      <Link to="/" aria-label="Home" className="shrink-0">
        <FaSpotify className="size-9 text-white" />
      </Link>
      <div className="flex max-w-xl min-w-0 flex-1 items-center gap-2">
        <Link
          to="/"
          aria-label="Home"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-zinc-900 text-white transition-transform hover:scale-105"
        >
          <House className="size-6" />
        </Link>
        <label className="group flex h-12 min-w-0 flex-1 items-center gap-3 rounded-full bg-zinc-900 px-3 ring-white transition-colors focus-within:ring-2 hover:bg-zinc-800">
          <Search className="size-6 shrink-0 text-zinc-400 group-hover:text-white" />
          <input
            type="search"
            aria-label="Search songs"
            placeholder="What do you want to play?"
            value={term}
            onChange={handleSearch}
            className="min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-zinc-400 focus:outline-none"
          />
          <span className="hidden h-6 border-l border-zinc-600 sm:block" />
          <Archive aria-label="Browse" className="hidden size-6 shrink-0 text-zinc-400 sm:block" />
        </label>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          className="hidden items-center gap-2 text-sm font-bold text-zinc-400 transition-colors hover:text-white lg:flex"
        >
          <CircleArrowDown className="size-5" /> Install App
        </button>
        <button type="button" aria-label="What's New" className={`${ICON_BUTTON} hidden sm:grid`}>
          <Bell className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Friend Activity"
          className={`${ICON_BUTTON} hidden sm:grid`}
        >
          <Users className="size-5" />
        </button>
        <ProfileMenu />
      </div>
    </header>
  );
}
