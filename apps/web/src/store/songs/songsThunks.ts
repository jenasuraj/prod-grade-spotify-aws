import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import { api, s3 } from '../../lib/api';
import type {
  Song,
  SongFileKind,
  UploadSongFilePayload,
  UploadUrlResponse,
} from '../../types/song';
import { getErrorMessage } from '../../utils/helpers';
import type { RootState } from '../index';

const thunk = createAsyncThunk.withTypes<{
  state: RootState;
  rejectValue: string;
}>();

export const songStarted = createAction<string>('songs/songStarted');

export const fileProgressed = createAction<{ kind: SongFileKind; percent: number }>(
  'songs/fileProgressed',
);

export const fetchSongs = thunk('songs/fetch', async (_: void, { rejectWithValue }) => {
  try {
    const { data } = await api.get<Song[]>('/songs');
    return data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Same endpoint for every file: the api saves the key and returns a signed url, then the file goes straight to S3
export const uploadSongFile = thunk(
  'songs/uploadFile',
  async (
    { kind, file, title, description, genres }: UploadSongFilePayload,
    { dispatch, getState, rejectWithValue },
  ) => {
    const songId = getState().songs.songId ?? undefined;
    let sending = false;
    try {
      const { data } = await api.post<UploadUrlResponse>('/songs', {
        songId,
        title: songId ? undefined : title,
        description: songId ? undefined : description,
        genres: songId ? undefined : genres,
        contentType: file.type,
        size: file.size,
      });
      // The row exists from here, so a retry adds to it instead of creating another song
      dispatch(songStarted(data.id));
      sending = true;
      await s3.put(data.url, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: ({ loaded }) =>
          dispatch(fileProgressed({ kind, percent: Math.floor((loaded / file.size) * 100) })),
      });
      void dispatch(fetchSongs());
    } catch (err) {
      // S3 answers in XML, and a CORS block has no response at all, so name the file instead
      if (sending)
        return rejectWithValue(`Couldn't upload the ${kind} to storage. Please try again.`);
      return rejectWithValue(getErrorMessage(err));
    }
  },
);

export const deleteSong = thunk('songs/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/songs/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});
