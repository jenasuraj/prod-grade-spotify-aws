import type { ReactNode } from 'react';
import { FaSpotify } from 'react-icons/fa';
import { Link } from 'react-router';
import { APP_NAME } from '../../utils/helpers';
import AuthShowcase from './AuthShowcase';

interface AuthCardProps {
  children: ReactNode;
  footer?: ReactNode;
}

// Split screen: cover art on the left (large screens), the form on the right
export default function AuthCard({ children, footer }: AuthCardProps) {
  return (
    <section className="grid min-h-[calc(100vh-4rem)] mt-5 bg-ink-950 text-slate-100 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <AuthShowcase />

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 xl:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Link
            to="/"
            className="mb-10 flex items-center gap-2.5 font-display text-xl font-semibold lg:hidden"
          >
            <FaSpotify className="size-8" /> {APP_NAME}
          </Link>
          {children}
          {footer && <p className="mt-8 text-sm text-slate-500">{footer}</p>}
        </div>
      </div>
    </section>
  );
}
