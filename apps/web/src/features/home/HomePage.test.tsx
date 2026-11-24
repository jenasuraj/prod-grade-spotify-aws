import { act, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { api } from '../../lib/api';
import { makeStore } from '../../store';
import { validateSession } from '../../store/auth/authThunks';
import type { ValidateResponse } from '../../types/auth';
import HomePage, { SPLASH_IMAGE, SPLASH_MS } from './HomePage';

const signedIn: ValidateResponse = {
  authenticated: true,
  user: { id: 1, name: 'suraj', email: 'suraj@example.com' },
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
};

const renderWith = (session: ValidateResponse) => {
  const store = makeStore();
  store.dispatch(validateSession.pending('id'));
  store.dispatch(validateSession.fulfilled(session, 'id'));
  return render(
    <Provider store={store}>
      <HomePage />
    </Provider>,
  );
};

describe('HomePage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(api, 'get').mockResolvedValue({ data: { status: 'ok', db: 'up', redis: 'up' } });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('shows the splash image for 2s to a logged-in user', async () => {
    renderWith(signedIn);
    expect(screen.getByAltText('Loading')).toHaveAttribute('src', SPLASH_IMAGE);
    act(() => jest.advanceTimersByTime(SPLASH_MS));
    expect(screen.queryByAltText('Loading')).not.toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /check/i })).toBeInTheDocument();
  });

  it('skips the splash for guests', () => {
    renderWith({ authenticated: false });
    expect(screen.queryByAltText('Loading')).not.toBeInTheDocument();
  });
});
