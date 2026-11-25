export interface ProfileFields {
  displayName: string | null;
}

// GET /api/profile/:name. profile is null until the user edits it once
export interface ProfileResponse {
  name: string;
  avatarUrl: string | null;
  profile: ProfileFields | null;
}

export type UpdateProfilePayload = Partial<ProfileFields>;
