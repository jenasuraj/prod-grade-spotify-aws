import { createSlice } from '@reduxjs/toolkit';
import type { Health } from '../../types/health';
import { fetchHealth } from './healthThunks';

interface HealthState {
  data: Health | null;
  loading: boolean;
  error: string;
}

export const initialState: HealthState = { data: null, loading: false, error: '' };

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealth.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchHealth.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.data = payload;
      })
      .addCase(fetchHealth.rejected, (state, { payload }) => {
        state.loading = false;
        state.data = null;
        state.error = payload ?? 'Something went wrong';
      });
  },
});

export default healthSlice.reducer;
