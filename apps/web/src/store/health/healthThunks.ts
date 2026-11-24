import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';
import { healthSchema } from '../../types/health';
import { getErrorMessage } from '../../utils/helpers';

const thunk = createAsyncThunk.withTypes<{ rejectValue: string }>();

// 503 still carries which service is down, so it's a result to show, not an error
export const fetchHealth = thunk('health/fetch', async (_: void, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/health', { validateStatus: (s) => s === 200 || s === 503 });
    return healthSchema.parse(data);
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});
