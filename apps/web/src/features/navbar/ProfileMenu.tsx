import { CirclePlus, LogIn, LogOut, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/auth/authThunks';
import { getInitials } from '../../utils/helpers';

const ITEM =
  'flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm text-zinc-100 hover:bg-white/10';

export default function ProfileMenu() {
  const dispatch = useAppDispatch();
  const { status, user } = useAppSelector((s) => s.auth);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);
  const close = () => setOpen(false);
  const handleLogout = () => {
    close();
    void dispatch(logoutUser());
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Account"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={status === 'loading'}
        onClick={() => setOpen(!open)}
        className="grid size-12 place-items-center rounded-full bg-zinc-900 transition-transform hover:scale-105"
      >
        <span className="grid size-8 place-items-center rounded-full bg-linear-to-br from-indigo-500 to-fuchsia-500 text-xs font-semibold text-white">
          {user ? getInitials(user.name) : <User className="size-4" />}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 mt-2 w-52 rounded-md bg-zinc-800 p-1 shadow-2xl shadow-black/60"
        >
          {user ? (
            <>
              <Link role="menuitem" to={`/${user.name}`} onClick={close} className={ITEM}>
                <User className="size-4" /> Profile
              </Link>
              <Link role="menuitem" to="/songs/new" onClick={close} className={ITEM}>
                <CirclePlus className="size-4" /> Upload song
              </Link>
              <div className="my-1 border-t border-white/10" />
              <button role="menuitem" type="button" onClick={handleLogout} className={ITEM}>
                <LogOut className="size-4" /> Log out
              </button>
            </>
          ) : (
            <Link role="menuitem" to="/login" onClick={close} className={ITEM}>
              <LogIn className="size-4" /> Log in
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
