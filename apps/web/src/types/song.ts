export interface UploadSongPayload {
  title: string;
  file: File;
}

// POST /api/songs: the saved song's id and a 15 min url to PUT the music to
export interface CreateSongResponse {
  id: string;
  url: string;
}

export type UploadStatus = 'idle' | 'uploading' | 'done' | 'failed';

// GET /api/songs: your songs, each with a 1 hour url to play it
export interface Song {
  id: string;
  title: string;
  createdAt: string;
  musicUrl: string;
}
