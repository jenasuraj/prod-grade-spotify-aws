import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import type { FollowsResponse, ProfileResponse } from '../../types/profile';
import type { ProfileSongs } from '../../types/song';
import {
  fetchFollows,
  fetchProfile,
  fetchProfileSongs,
  updateProfile,
  uploadAvatar,
} from './profileThunks';

interface ProfileState {
  data: ProfileResponse | null;
  follows: FollowsResponse | null;
  songs: ProfileSongs | null;
  loading: boolean; // fetching the page
  saving: boolean; // saving the form or uploading the picture
  error: string;
  notice: string;
}

const initialState: ProfileState = {
  data: null,
  follows: null,
  songs: null,
  loading: false,
  saving: false,
  error: '',
  notice: '',
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.data = null;
        state.follows = null;
        state.songs = null;
        state.loading = true;
        state.error = '';
        state.notice = '';
      })
      .addCase(fetchProfile.fulfilled, (state, { payload }) => {
        state.data = payload;
        state.loading = false;
      })
      .addCase(fetchProfile.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload ?? 'Something went wrong';
      })
      .addCase(fetchFollows.fulfilled, (state, { payload }) => {
        state.follows = payload;
      })
      .addCase(fetchProfileSongs.fulfilled, (state, { payload }) => {
        state.songs = payload;
      })
      .addCase(fetchProfileSongs.rejected, (state, { payload }) => {
        state.error = payload ?? 'Something went wrong';
      })
      .addMatcher(isAnyOf(updateProfile.pending, uploadAvatar.pending), (state) => {
        state.saving = true;
        state.error = '';
        state.notice = '';
      })
      .addMatcher(
        isAnyOf(updateProfile.fulfilled, uploadAvatar.fulfilled),
        (state, { payload }) => {
          state.data = payload;
          state.saving = false;
          state.notice = 'Saved';
        },
      )
      .addMatcher(isAnyOf(updateProfile.rejected, uploadAvatar.rejected), (state, { payload }) => {
        state.saving = false;
        state.error = payload ?? 'Something went wrong';
      });
  },
});

export default profileSlice.reducer;
