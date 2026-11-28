import { createSlice, isAnyOf, type PayloadAction } from '@reduxjs/toolkit';
import type { SearchSong } from '../../types/song';
import { followArtist, likeSong, searchSongs } from './searchThunks';

interface SearchState {
  term: string; // what's typed in the navbar
  query: string; // only the latest search may fill the results
  results: SearchSong[];
  loading: boolean;
  error: string;
}

const initialState: SearchState = { term: '', query: '', results: [], loading: false, error: '' };

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    termChanged: (state, { payload }: PayloadAction<string>) => {
      state.term = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchSongs.pending, (state, { meta }) => {
        state.query = meta.arg;
        state.loading = true;
        state.error = '';
      })
      .addCase(searchSongs.fulfilled, (state, { payload, meta }) => {
        if (meta.arg !== state.query) return;
        state.results = payload;
        state.loading = false;
      })
      .addCase(searchSongs.rejected, (state, { payload, meta }) => {
        if (meta.arg !== state.query) return;
        state.loading = false;
        state.error = payload ?? 'Something went wrong';
      })
      .addCase(likeSong.fulfilled, (state, { payload }) => {
        const song = state.results.find(({ id }) => id === payload.id);
        if (song) song.liked = payload.liked;
      })
      // Every song by that artist shows the same follow state
      .addCase(followArtist.fulfilled, (state, { payload }) => {
        for (const song of state.results)
          if (song.artist === payload.name) song.following = payload.following;
      })
      .addMatcher(isAnyOf(likeSong.rejected, followArtist.rejected), (state, { payload }) => {
        state.error = payload ?? 'Something went wrong';
      });
  },
});

export const { termChanged } = searchSlice.actions;
export default searchSlice.reducer;
