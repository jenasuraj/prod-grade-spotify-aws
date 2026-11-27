import { api, s3 } from '../../lib/api';
import { makeStore } from '../index';
import { songReset } from './songsSlice';
import { deleteSong, fetchSongs, uploadSongFile } from './songsThunks';

const music = new File(['a'.repeat(10)], 'track.mp3', { type: 'audio/mpeg' });

const cover = new File(['c'.repeat(4)], 'cover.png', { type: 'image/png' });

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('song uploads', () => {
  beforeEach(() => jest.spyOn(api, 'get').mockResolvedValue({ data: [] }));

  afterEach(() => jest.restoreAllMocks());

  it('music starts the song: title goes to the api, the file goes to the signed url', async () => {
    const post = jest
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { id: 'abc', kind: 'music', url: 'https://s3/music?sig' } });
    const put = jest.spyOn(s3, 'put').mockResolvedValue({});
    const store = makeStore();
    await store.dispatch(
      uploadSongFile({
        kind: 'music',
        file: music,
        title: 'First light',
        description: '',
        genres: ['Lo-fi'],
      }),
    );
    await flush();
    expect(post).toHaveBeenCalledWith('/songs', {
      songId: undefined,
      title: 'First light',
      description: '',
      genres: ['Lo-fi'],
      contentType: 'audio/mpeg',
      size: 10,
    });
    expect(put.mock.calls[0].slice(0, 2)).toEqual(['https://s3/music?sig', music]);
    expect(store.getState().songs).toMatchObject({
      songId: 'abc',
      uploads: { music: { status: 'done', percent: 100 } },
    });
  });

  it('an image after that goes to the same api with the song id', async () => {
    const post = jest
      .spyOn(api, 'post')
      .mockResolvedValueOnce({ data: { id: 'abc', kind: 'music', url: 'https://s3/music?sig' } })
      .mockResolvedValueOnce({ data: { id: 'abc', kind: 'image', url: 'https://s3/image?sig' } });
    jest.spyOn(s3, 'put').mockResolvedValue({});
    const store = makeStore();
    await store.dispatch(uploadSongFile({ kind: 'music', file: music, title: 'First light' }));
    await store.dispatch(uploadSongFile({ kind: 'image', file: cover }));
    expect(post).toHaveBeenLastCalledWith('/songs', {
      songId: 'abc',
      title: undefined,
      description: undefined,
      contentType: 'image/png',
      size: 4,
    });
    expect(store.getState().songs.uploads.image).toEqual({ status: 'done', percent: 100 });
  });

  it('a storage failure names the file, keeps the song id for a retry, and reset clears it', async () => {
    jest
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { id: 'abc', kind: 'music', url: 'https://s3/music?sig' } });
    jest.spyOn(s3, 'put').mockRejectedValue(new Error('Network Error'));
    const store = makeStore();
    await store.dispatch(uploadSongFile({ kind: 'music', file: music, title: 'First light' }));
    expect(store.getState().songs).toMatchObject({
      songId: 'abc',
      uploads: { music: { status: 'failed' } },
      error: "Couldn't upload the music to storage. Please try again.",
    });
    store.dispatch(songReset());
    expect(store.getState().songs).toMatchObject({ songId: null, error: '' });
  });

  it('deleting a song calls the api and drops it from the list', async () => {
    const song = {
      id: 'abc',
      title: 'First light',
      description: null,
      createdAt: '',
      musicUrl: '',
      imageUrl: null,
      videoUrl: null,
    };
    jest.spyOn(api, 'get').mockResolvedValue({ data: [song] });
    const remove = jest
      .spyOn(api, 'delete')
      .mockResolvedValue({ data: { message: 'Song deleted' } });
    const store = makeStore();
    await store.dispatch(fetchSongs());
    await store.dispatch(deleteSong('abc'));
    expect(remove).toHaveBeenCalledWith('/songs/abc');
    expect(store.getState().songs).toMatchObject({ list: [], deleting: [] });
  });

  it('a failed delete keeps the song and shows why', async () => {
    const song = {
      id: 'abc',
      title: 'First light',
      description: null,
      createdAt: '',
      musicUrl: '',
      imageUrl: null,
      videoUrl: null,
    };
    jest.spyOn(api, 'get').mockResolvedValue({ data: [song] });
    jest.spyOn(api, 'delete').mockRejectedValue(new Error('boom'));
    const store = makeStore();
    await store.dispatch(fetchSongs());
    await store.dispatch(deleteSong('abc'));
    expect(store.getState().songs).toMatchObject({
      list: [song],
      deleting: [],
      listError: 'Something went wrong. Please try again.',
    });
  });
});
