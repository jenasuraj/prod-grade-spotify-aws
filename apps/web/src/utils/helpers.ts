import { isAxiosError } from 'axios';
import { ZodError } from 'zod';

export const APP_NAME = 'Spotify';

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
