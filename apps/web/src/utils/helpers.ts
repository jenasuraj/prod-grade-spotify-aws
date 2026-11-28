import { isAxiosError } from 'axios';
import { ZodError } from 'zod';

export const APP_NAME = 'Spotify';

// Side padding shared by the navbar and full-width pages, so their edges line up
export const GUTTER = 'px-4 sm:px-6 lg:px-10 2xl:px-16';

export const scrollToSection = (id: string) => {
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
};

export const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
};

export const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// Fallback artwork: the same song always gets the same gradient
const ARTWORK = [
  'from-lime-300 via-emerald-500 to-teal-900',
  'from-cyan-300 via-sky-600 to-indigo-950',
  'from-fuchsia-400 via-purple-700 to-indigo-950',
  'from-amber-300 via-orange-500 to-rose-900',
  'from-teal-200 via-teal-600 to-slate-900',
];

export const artworkFor = (seed: string) =>
  ARTWORK[[...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % ARTWORK.length];

export const getErrorMessage = (error: unknown) => {
  if (error instanceof ZodError) return 'The server sent an unexpected response.';
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    if (!error.response) return 'Cannot reach the server. Is the backend running?';
    const message = error.response.data?.message;
    if (Array.isArray(message)) return message[0];
    if (message) return message;
  }
  return 'Something went wrong. Please try again.';
};
