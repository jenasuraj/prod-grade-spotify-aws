import { api, s3 } from '../../lib/api';
import { makeStore } from '../index';
import { uploadReset } from './songsSlice';
import { fetchSongs, uploadSong } from './songsThunks';

const file = new File(['a'.repeat(10)], 'track.mp3', { type: 'audio/mpeg' });

const song = {
  id: 'abc',
  title: 'First light',
  createdAt: '2026-11-27T10:00:00.000Z',
  musicUrl: 'https://s3/songs/1/abc?read',
};

describe('uploadSong', () => {
  afterEach(() => jest.restoreAllMocks());

  it('asks the api for a signed url, sends the file straight to it, then refreshes the list', async () => {
    const post = jest
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { id: 'abc', url: 'https://s3/songs/1/abc?sig' } });
    const put = jest.spyOn(s3, 'put').mockResolvedValue({});
    const get = jest.spyOn(api, 'get').mockResolvedValue({ data: [song] });
    const store = makeStore();
    await store.dispatch(uploadSong({ title: 'First light', file }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(post).toHaveBeenCalledWith('/songs', {
      title: 'First light',
      contentType: 'audio/mpeg',
      size: 10,
    });
    expect(put.mock.calls[0].slice(0, 2)).toEqual(['https://s3/songs/1/abc?sig', file]);
    expect(get).toHaveBeenCalledWith('/songs');
    expect(store.getState().songs).toMatchObject({ status: 'done', percent: 100, list: [song] });
  });

  it('keeps the list when the form is reset for another upload', async () => {
    jest.spyOn(api, 'get').mockResolvedValue({ data: [song] });
    const store = makeStore();
    await store.dispatch(fetchSongs());
    store.dispatch(uploadReset());
    expect(store.getState().songs).toMatchObject({ status: 'idle', list: [song] });
  });

  it('says the storage upload failed rather than blaming the backend', async () => {
    jest.spyOn(api, 'post').mockResolvedValue({ data: { id: 'abc', url: 'https://s3/x?sig' } });
    jest.spyOn(s3, 'put').mockRejectedValue(new Error('Network Error'));
    const store = makeStore();
    await store.dispatch(uploadSong({ title: 'First light', file }));
    expect(store.getState().songs).toMatchObject({
      status: 'failed',
      error: "Couldn't upload the music to storage. Please try again.",
    });
  });
});
