import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';
import type { SearchSong } from '../../types/song';
import { getErrorMessage } from '../../utils/helpers';
import type { RootState } from '../index';

const thunk = createAsyncThunk.withTypes<{
  state: RootState;
  rejectValue: string;
}>();

// encodeURIComponent sends spaces as %20 (axios params would send them as +)
export const searchSongs = thunk('search/songs', async (q: string, { rejectWithValue }) => {
  try {
    const { data } = await api.get<SearchSong[]>(`/songs/search?q=${encodeURIComponent(q)}`);
    return data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Toggles on the server; the answer says where it landed
export const likeSong = thunk('search/like', async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.post<{ liked: boolean }>(`/songs/${id}/like`);
    return { id, liked: data.liked };
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const followArtist = thunk('search/follow', async (name: string, { rejectWithValue }) => {
  try {
    const { data } = await api.post<{ following: boolean }>(`/profile/${name}/follow`);
    return { name, following: data.following };
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});
