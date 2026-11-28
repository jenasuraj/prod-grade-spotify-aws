import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { makeStore } from '../../store';
import { songPlayed } from '../../store/player/playerSlice';
import NowPlayingBar from './NowPlayingBar';

// react-router 8 uses import.meta, which Jest can't load in CommonJS mode; Link is all we need
jest.mock('react-router', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

const song = {
  id: 'a',
  title: 'Night owl',
  description: null,
  genres: [],
  createdAt: '2026-11-28T00:00:00.000Z',
  musicUrl: 'https://s3/m',
  imageUrl: null,
  videoUrl: null,
  artist: 'riya',
};

describe('NowPlayingBar', () => {
  it('shows nothing until a song is played, then its title, artist and player', async () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <NowPlayingBar />
      </Provider>,
    );
    expect(screen.queryByText('Night owl')).not.toBeInTheDocument();
    store.dispatch(songPlayed(song));
    expect(await screen.findByText('Night owl')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'riya' })).toHaveAttribute('href', '/riya');
    expect(screen.getByRole('button', { name: 'Play Night owl' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close player' }));
    expect(screen.queryByText('Night owl')).not.toBeInTheDocument();
  });
});
