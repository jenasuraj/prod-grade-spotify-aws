import { Outlet } from 'react-router';
import { useSessionCheck } from '../features/auth/useSessionCheck';
import Navbar from '../features/navbar/Navbar';

export default function Layout() {
  useSessionCheck();
  return (
    <>
      <Navbar />
      <main className="min-h-screen overflow-x-clip pt-16">
        <Outlet />
      </main>
    </>
  );
}
