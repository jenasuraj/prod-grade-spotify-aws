import reducer, { initialState } from './healthSlice';
import { fetchHealth } from './healthThunks';

describe('healthSlice', () => {
  it('sets loading while the check is pending', () => {
    const state = reducer({ ...initialState, error: 'old' }, fetchHealth.pending('id'));
    expect(state).toEqual({ data: null, loading: true, error: '' });
  });

  it('stores the result when the check succeeds', () => {
    const health = { status: 'ok', db: 'up', redis: 'up' } as const;
    const state = reducer(initialState, fetchHealth.fulfilled(health, 'id'));
    expect(state).toEqual({ data: health, loading: false, error: '' });
  });

  it('stores the message when the check fails', () => {
    const action = fetchHealth.rejected(null, 'id', undefined, 'Cannot reach the server');
    expect(reducer(initialState, action)).toEqual({
      data: null,
      loading: false,
      error: 'Cannot reach the server',
    });
  });
});
