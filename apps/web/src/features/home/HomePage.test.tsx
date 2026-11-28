import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { api } from '../../lib/api';
import { makeStore } from '../../store';
import { validateSession } from '../../store/auth/authThunks';
import { termChanged } from '../../store/search/searchSlice';
import type { ValidateResponse } from '../../types/auth';
import HomePage from './HomePage';

// react-router 8 uses import.meta, which Jest can't load in CommonJS mode; Link is all we need
jest.mock('react-router', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

const signedIn: ValidateResponse = {
  authenticated: true,
  user: { id: 1, name: 'suraj', email: 'suraj@example.com' },
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
};

const renderWith = (session?: ValidateResponse, term = '') => {
  const store = makeStore();
  store.dispatch(termChanged(term));
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

  it("searches what's typed and shows heart and follow only on other people's songs", async () => {
    const song = {
      description: null,
      genres: [],
      createdAt: '2026-11-28T00:00:00.000Z',
      musicUrl: 'https://s3/m',
      imageUrl: null,
      videoUrl: null,
      liked: false,
      following: false,
    };
    const get = jest.spyOn(api, 'get').mockResolvedValue({
      data: [
        { ...song, id: 'a', title: 'Night drive', artist: 'suraj', isMine: true },
        { ...song, id: 'b', title: 'Night owl', artist: 'riya', isMine: false },
      ],
    });
    renderWith(signedIn, 'night owl');
    expect(await screen.findByText('Night owl')).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith('/songs/search?q=night%20owl');
    expect(screen.getByRole('link', { name: 'riya' })).toHaveAttribute('href', '/riya');
    expect(screen.getAllByRole('button', { name: /like/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Follow' })).toHaveLength(1);
  });

  it('asks guests to log in before searching', () => {
    renderWith({ authenticated: false }, 'night');
    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument();
  });
});
