import { useState, type FormEvent } from 'react';
import type { ProfileFields, UpdateProfilePayload } from '../../types/profile';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface ProfileFormProps {
  profile: ProfileFields | null;
  saving: boolean;
  onSave: (payload: UpdateProfilePayload) => void;
}

export default function ProfileForm({ profile, saving, onSave }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  // An empty string is sent as-is; the backend turns it into null (cleared)
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({ displayName });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-white/10 p-6">
      <Input
        label="Display name"
        name="displayName"
        maxLength={60}
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save profile'}
      </Button>
    </form>
  );
}
