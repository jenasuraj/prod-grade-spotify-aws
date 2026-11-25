import { Camera } from 'lucide-react';
import type { ChangeEvent } from 'react';
import type { ProfileResponse } from '../../types/profile';
import { getInitials } from '../../utils/helpers';

interface ProfileCardProps {
  data: ProfileResponse;
  onUpload?: (file: File) => void; // only passed on your own profile
  uploading?: boolean;
}

export default function ProfileCard({ data, onUpload, uploading }: ProfileCardProps) {
  const { name, avatarUrl, profile: p } = data;
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload?.(file);
    e.target.value = ''; // lets you pick the same file again
  };

  return (
    <div className="rounded-xl border border-white/10 p-6">
      <div className="flex items-center gap-5">
        <div className="relative size-24 shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="size-24 rounded-full object-cover" />
          ) : (
            <span className="grid size-24 place-items-center rounded-full bg-linear-to-br from-indigo-500 to-fuchsia-500 text-2xl font-semibold">
              {getInitials(p?.displayName ?? name)}
            </span>
          )}
          {onUpload && (
            <label
              aria-label="Change picture"
              className="absolute right-0 bottom-0 grid size-8 cursor-pointer place-items-center rounded-full border border-white/10 bg-zinc-900 hover:bg-zinc-800"
            >
              <Camera className="size-4" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={handleFile}
              />
            </label>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{p?.displayName ?? name}</h1>
          <p className="text-sm text-zinc-400">@{name}</p>
        </div>
      </div>
    </div>
  );
}
