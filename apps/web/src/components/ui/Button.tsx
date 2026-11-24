import type { ComponentProps } from 'react';

export default function Button({ className = '', ...props }: ComponentProps<'button'>) {
  return (
    <button
      className={`rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-400 disabled:opacity-40 ${className}`}
      {...props}
    />
  );
}
