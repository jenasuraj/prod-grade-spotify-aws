import { api } from '../../lib/api';
import type { SearchSong } from '../../types/song';
import { makeStore } from '../index';
import { followArtist, likeSong, searchSongs } from './searchThunks';

const song = (id: string, artist: string): SearchSong => ({
  id,
  title: `Song ${id}`,
  description: null,
  genres: [],
  createdAt: '2026-11-28T00:00:00.000Z',
  musicUrl: 'https://s3/m',
  imageUrl: null,
  videoUrl: null,
  artist,
  isMine: false,
  liked: false,
  following: false,
});

describe('search', () => {
  afterEach(() => jest.restoreAllMocks());

  it('like and follow update the results, follow on every song by that artist', async () => {
    jest
      .spyOn(api, 'get')
      .mockResolvedValue({ data: [song('a', 'riya'), song('b', 'riya'), song('c', 'amit')] });
    jest
      .spyOn(api, 'post')
      .mockResolvedValueOnce({ data: { liked: true } })
      .mockResolvedValueOnce({ data: { following: true } });
    const store = makeStore();
    await store.dispatch(searchSongs('song'));
    await store.dispatch(likeSong('a'));
    await store.dispatch(followArtist('riya'));
    const { results } = store.getState().search;
    expect(results.map(({ liked, following }) => ({ liked, following }))).toEqual([
      { liked: true, following: true },
      { liked: false, following: true },
      { liked: false, following: false },
    ]);
  });

  it('a slow older search never replaces newer results', async () => {
    let finishOld: (value: { data: SearchSong[] }) => void = () => undefined;
    jest
      .spyOn(api, 'get')
      .mockReturnValueOnce(new Promise((resolve) => (finishOld = resolve)))
      .mockResolvedValueOnce({ data: [song('new', 'riya')] });
    const store = makeStore();
    const old = store.dispatch(searchSongs('n'));
    await store.dispatch(searchSongs('ni'));
    finishOld({ data: [song('old', 'amit')] });
    await old;
    expect(store.getState().search.results.map(({ id }) => id)).toEqual(['new']);
  });
});
