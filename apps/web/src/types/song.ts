export type SongFileKind = 'music' | 'image' | 'video';

// One file for POST /api/songs. Music without a song id starts a new song with this title
export interface UploadSongFilePayload {
  kind: SongFileKind;
  file: File;
  title?: string;
  description?: string;
  genres?: string[];
}

// The song the file belongs to and a 15 min url to PUT it to
export interface UploadUrlResponse {
  id: string;
  kind: SongFileKind;
  url: string;
}

export interface FileUpload {
  status: 'idle' | 'uploading' | 'done' | 'failed';
  percent: number;
}

// GET /api/songs: your songs, each file with a 1 hour url
export interface Song {
  id: string;
  title: string;
  description: string | null;
  genres: string[];
  createdAt: string;
  musicUrl: string;
  imageUrl: string | null;
  videoUrl: string | null;
}

// Someone else's song in a profile's liked list
export interface LikedSong extends Song {
  artist: string;
}

// GET /api/profile/:name/songs
export interface ProfileSongs {
  songs: Song[];
  liked: LikedSong[];
}

// GET /api/songs/search?q=: everyone's songs, with your like and follow state
export interface SearchSong extends Song {
  artist: string;
  isMine: boolean;
  liked: boolean;
  following: boolean;
}
