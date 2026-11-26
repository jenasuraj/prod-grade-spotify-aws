import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import { api, s3 } from '../../lib/api';
import type { CreateSongResponse, Song, UploadSongPayload } from '../../types/song';
import { getErrorMessage } from '../../utils/helpers';
import type { RootState } from '../index';

const thunk = createAsyncThunk.withTypes<{
  state: RootState;
  rejectValue: string;
}>();

export const uploadProgressed = createAction<number>('songs/uploadProgressed');

export const fetchSongs = thunk('songs/fetch', async (_: void, { rejectWithValue }) => {
  try {
    const { data } = await api.get<Song[]>('/songs');
    return data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// One api call saves the song and hands back a signed url; the music then goes straight to S3
export const uploadSong = thunk(
  'songs/upload',
  async ({ title, file }: UploadSongPayload, { dispatch, rejectWithValue }) => {
    let sending = false;
    try {
      const { data } = await api.post<CreateSongResponse>('/songs', {
        title,
        contentType: file.type,
        size: file.size,
      });
      sending = true;
      await s3.put(data.url, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: ({ loaded }) =>
          dispatch(uploadProgressed(Math.floor((loaded / file.size) * 100))),
      });
      void dispatch(fetchSongs());
      return data.id;
    } catch (err) {
      // S3 answers in XML, and a CORS block has no response at all, so the generic message would mislead
      if (sending)
        return rejectWithValue("Couldn't upload the music to storage. Please try again.");
      return rejectWithValue(getErrorMessage(err));
    }
  },
);
