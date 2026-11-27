import { createSlice } from '@reduxjs/toolkit';
import type { FileUpload, Song, SongFileKind } from '../../types/song';
import { deleteSong, fetchSongs, fileProgressed, songStarted, uploadSongFile } from './songsThunks';

const IDLE: FileUpload = { status: 'idle', percent: 0 };

interface SongsState {
  songId: string | null; // the song being built; image and video are added to it
  uploads: Record<SongFileKind, FileUpload>;
  error: string;
  list: Song[];
  listLoading: boolean;
  listError: string;
  deleting: string[]; // song ids with a delete in flight
}

export const initialState: SongsState = {
  songId: null,
  uploads: { music: IDLE, image: IDLE, video: IDLE },
  error: '',
  list: [],
  listLoading: false,
  listError: '',
  deleting: [],
};

const songsSlice = createSlice({
  name: 'songs',
  initialState,
  reducers: {
    // Starts a new song but keeps the list on screen
    songReset: (state) => ({ ...initialState, list: state.list }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(songStarted, (state, { payload }) => {
        state.songId = payload;
      })
      .addCase(uploadSongFile.pending, (state, { meta }) => {
        state.uploads[meta.arg.kind] = { status: 'uploading', percent: 0 };
        state.error = '';
      })
      .addCase(fileProgressed, (state, { payload }) => {
        state.uploads[payload.kind].percent = payload.percent;
      })
      .addCase(uploadSongFile.fulfilled, (state, { meta }) => {
        state.uploads[meta.arg.kind] = { status: 'done', percent: 100 };
      })
      .addCase(uploadSongFile.rejected, (state, { meta, payload }) => {
        state.uploads[meta.arg.kind].status = 'failed';
        state.error = payload ?? 'Something went wrong';
      })
      .addCase(fetchSongs.pending, (state) => {
        state.listLoading = true;
        state.listError = '';
      })
      .addCase(fetchSongs.fulfilled, (state, { payload }) => {
        state.list = payload;
        state.listLoading = false;
      })
      .addCase(fetchSongs.rejected, (state, { payload }) => {
        state.listLoading = false;
        state.listError = payload ?? 'Something went wrong';
      })
      .addCase(deleteSong.pending, (state, { meta }) => {
        state.deleting.push(meta.arg);
        state.listError = '';
      })
      .addCase(deleteSong.fulfilled, (state, { payload }) => {
        state.list = state.list.filter(({ id }) => id !== payload);
        state.deleting = state.deleting.filter((id) => id !== payload);
      })
      .addCase(deleteSong.rejected, (state, { meta, payload }) => {
        state.deleting = state.deleting.filter((id) => id !== meta.arg);
        state.listError = payload ?? 'Something went wrong';
      });
  },
});

export const { songReset } = songsSlice.actions;
export default songsSlice.reducer;
