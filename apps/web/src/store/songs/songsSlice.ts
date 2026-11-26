import { createSlice } from '@reduxjs/toolkit';
import type { Song, UploadStatus } from '../../types/song';
import { fetchSongs, uploadProgressed, uploadSong } from './songsThunks';

interface SongsState {
  status: UploadStatus;
  percent: number;
  error: string;
  list: Song[];
  listLoading: boolean;
  listError: string;
}

export const initialState: SongsState = {
  status: 'idle',
  percent: 0,
  error: '',
  list: [],
  listLoading: false,
  listError: '',
};

const songsSlice = createSlice({
  name: 'songs',
  initialState,
  reducers: {
    // Clears the upload form but keeps the list on screen
    uploadReset: (state) => ({ ...initialState, list: state.list }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadSong.pending, (state) => {
        state.status = 'uploading';
        state.percent = 0;
        state.error = '';
      })
      .addCase(uploadProgressed, (state, { payload }) => {
        state.percent = payload;
      })
      .addCase(uploadSong.fulfilled, (state) => {
        state.status = 'done';
        state.percent = 100;
      })
      .addCase(uploadSong.rejected, (state, { payload }) => {
        state.status = 'failed';
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
      });
  },
});

export const { uploadReset } = songsSlice.actions;
export default songsSlice.reducer;
