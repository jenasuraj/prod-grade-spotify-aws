import { Outlet } from 'react-router';
import { useSessionCheck } from '../features/auth/useSessionCheck';
import Navbar from '../features/navbar/Navbar';
import NowPlayingBar from '../features/player/NowPlayingBar';
import { useAppSelector } from '../store';

export default function Layout() {
  useSessionCheck();
  const playing = useAppSelector((s) => !!s.player.current);

  return (
    <>
      <Navbar />
      {/* Room at the bottom so the player bar never covers the end of a page */}
      <main className={`min-h-screen overflow-x-clip pt-16 ${playing ? 'pb-20' : ''}`}>
        <Outlet />
      </main>
      <NowPlayingBar />
    </>
  );
}
