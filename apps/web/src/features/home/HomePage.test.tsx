import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { api } from '../../lib/api';
import { makeStore } from '../../store';
import { validateSession } from '../../store/auth/authThunks';
import type { ValidateResponse } from '../../types/auth';
import HomePage from './HomePage';

const signedIn: ValidateResponse = {
  authenticated: true,
  user: { id: 1, name: 'suraj', email: 'suraj@example.com' },
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
};

const renderWith = (session?: ValidateResponse) => {
  const store = makeStore();
  store.dispatch(validateSession.pending('id'));
  if (session) store.dispatch(validateSession.fulfilled(session, 'id'));
  return render(
    <Provider store={store}>
      <HomePage />
    </Provider>,
  );
};

describe('HomePage', () => {
  beforeEach(() => {
    jest.spyOn(api, 'get').mockResolvedValue({ data: { status: 'ok', db: 'up', redis: 'up' } });
  });

  afterEach(() => jest.restoreAllMocks());

  it('shows a loader while the session is being checked', () => {
    renderWith();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('goes straight to the page for a logged-in user', async () => {
    renderWith(signedIn);
    expect(await screen.findByRole('button', { name: /check/i })).toBeInTheDocument();
  });

  it('goes straight to the page for guests', async () => {
    renderWith({ authenticated: false });
    expect(await screen.findByRole('button', { name: /check/i })).toBeInTheDocument();
  });
});
