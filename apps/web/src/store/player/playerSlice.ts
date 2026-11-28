import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { NowPlaying } from '../../types/song';

interface PlayerState {
  current: NowPlaying | null;
}

const initialState: PlayerState = { current: null };

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    songPlayed: (state, { payload }: PayloadAction<NowPlaying>) => {
      state.current = payload;
    },
    playerClosed: (state) => {
      state.current = null;
    },
  },
});

export const { songPlayed, playerClosed } = playerSlice.actions;
export default playerSlice.reducer;
