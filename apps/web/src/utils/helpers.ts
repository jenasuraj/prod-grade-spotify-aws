import { isAxiosError } from 'axios';
import { ZodError } from 'zod';

export const APP_NAME = 'Spotify';

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
