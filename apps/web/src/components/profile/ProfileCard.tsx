import { Camera, LoaderCircle } from 'lucide-react';
import type { ChangeEvent, ReactNode } from 'react';
import type { ProfileResponse } from '../../types/profile';
import { artworkFor, getInitials } from '../../utils/helpers';

interface ProfileStat {
  label: string;
  value: number;
}

interface ProfileCardProps {
  data: ProfileResponse;
  stats: ProfileStat[];
  onUpload?: (file: File) => void; // only passed on your own profile
  uploading?: boolean;
  children?: ReactNode; // actions under the stats, e.g. Edit profile
}

// The big header of a profile: picture, name, counts
export default function ProfileCard({
  data,
  stats,
  onUpload,
  uploading,
  children,
}: ProfileCardProps) {
  const { name, avatarUrl, profile } = data;
  const displayName = profile?.displayName ?? name;
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload?.(file);
    e.target.value = ''; // lets you pick the same file again
  };

  return (
    <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:items-end sm:text-left">
      <div className="group/avatar relative size-44 shrink-0 lg:size-56">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="size-full rounded-full object-cover shadow-2xl shadow-black/60 ring-1 ring-white/10"
          />
        ) : (
          <span
            className={`grid size-full place-items-center rounded-full bg-linear-to-br font-display text-6xl font-semibold text-white/90 shadow-2xl shadow-black/60 ${artworkFor(name)}`}
          >
            {getInitials(displayName)}
          </span>
        )}
        {onUpload && (
          <label
            aria-label="Change picture"
            className="absolute inset-0 grid cursor-pointer place-items-center rounded-full bg-ink-950/60 text-sm font-semibold text-white opacity-0 backdrop-blur-sm transition group-hover/avatar:opacity-100 focus-within:opacity-100"
          >
            {uploading ? (
              <LoaderCircle className="size-6 animate-spin" />
            ) : (
              <span className="flex flex-col items-center gap-2">
                <Camera className="size-6" /> Change picture
              </span>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="sr-only"
              disabled={uploading}
              onChange={handleFile}
            />
          </label>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-400 uppercase">
          Profile
        </p>
        <h1 className="mt-2 truncate font-display text-5xl font-semibold tracking-tight text-white sm:text-6xl xl:text-7xl">
          {displayName}
        </h1>
        <p className="mt-2 text-slate-400">@{name}</p>
        <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-slate-400 sm:justify-start">
          {stats.map(({ label, value }) => (
            <li key={label}>
              <span className="font-semibold text-white tabular-nums">{value}</span> {label}
            </li>
          ))}
        </ul>
        {children && (
          <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
