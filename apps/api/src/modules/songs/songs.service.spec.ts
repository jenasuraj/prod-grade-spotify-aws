import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { RedisService } from '../../infra/redis/redis.service.js';
import { S3Service } from '../../infra/s3/s3.service.js';
import { SongsService } from './songs.service.js';

const ID = '7f6c2d0e-6a3b-4c1e-9f2a-1b2c3d4e5f60';

const MB = 1024 * 1024;

describe('SongsService', () => {
  let service: SongsService;
  const songs = {
    create: jest.fn<(args: { data: Record<string, unknown> }) => Promise<unknown>>(),
    findFirst: jest.fn<(args: unknown) => Promise<{ id: string } | null>>(),
    findUnique: jest.fn<(args: unknown) => Promise<{ userId: number } | null>>(),
    update: jest.fn<(args: { data: Record<string, unknown> }) => Promise<unknown>>(),
    findMany: jest.fn<(args: unknown) => Promise<unknown[]>>(),
    delete: jest.fn<(args: unknown) => Promise<unknown>>(),
  };
  const likes = {
    findMany: jest.fn<(args: unknown) => Promise<{ songId: string }[]>>(),
    deleteMany: jest.fn<(args: unknown) => Promise<{ count: number }>>(),
    createMany: jest.fn<(args: unknown) => Promise<{ count: number }>>(),
  };
  const follows = { findMany: jest.fn<(args: unknown) => Promise<{ followingId: number }[]>>() };
  const users = { findUnique: jest.fn<(args: unknown) => Promise<{ id: number } | null>>() };
  const s3 = {
    signUpload: jest.fn<S3Service['signUpload']>(),
    signedUrl: jest.fn<S3Service['signedUrl']>(),
    deleteMany: jest.fn<S3Service['deleteMany']>(),
  };
  const redis = {
    get: jest.fn<(key: string) => Promise<string | null>>(),
    set: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    del: jest.fn<(key: string) => Promise<number>>(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongsService,
        {
          provide: PrismaService,
          useValue: { song: songs, like: likes, follow: follows, user: users },
        },
        { provide: RedisService, useValue: redis },
        { provide: S3Service, useValue: s3 },
      ],
    }).compile();
    service = module.get(SongsService);
    s3.signUpload.mockImplementation((key) => Promise.resolve(`https://s3/${key}?signed`));
    s3.signedUrl.mockImplementation((key) => Promise.resolve(`https://s3/${key}?read`));
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue('OK');
    redis.del.mockResolvedValue(1);
  });

  it('music without a songId creates the song with its key, then returns the upload url', async () => {
    const result = await service.upload(7, {
      title: 'First light',
      description: 'Intro',
      genres: ['Lo-fi', 'Jazz'],
      contentType: 'audio/mpeg',
      size: MB,
    });
    const musicKey = `songs/7/${result.id}/music`;
    expect(songs.create).toHaveBeenCalledWith({
      data: {
        id: result.id,
        userId: 7,
        title: 'First light',
        description: 'Intro',
        genres: ['Lo-fi', 'Jazz'],
        musicKey,
      },
    });
    expect(result).toEqual({ id: result.id, kind: 'music', url: `https://s3/${musicKey}?signed` });
  });

  it('an image or video with a songId is saved on that song', async () => {
    songs.findFirst.mockResolvedValue({ id: ID });
    const result = await service.upload(7, { songId: ID, contentType: 'video/mp4', size: MB });
    expect(songs.update).toHaveBeenCalledWith({
      where: { id: ID },
      data: { videoKey: `songs/7/${ID}/video` },
    });
    expect(result.kind).toBe('video');
  });

  it("rejects a new song that doesn't start with music, an unknown type, or a file too big for its kind", async () => {
    await expect(
      service.upload(7, { title: 'x', contentType: 'image/png', size: MB }),
    ).rejects.toThrow(
      new BadRequestException('Start a song with its music, then add the image or video'),
    );
    await expect(
      service.upload(7, { title: 'x', contentType: 'application/pdf', size: MB }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.upload(7, { songId: ID, contentType: 'image/png', size: 9 * MB }),
    ).rejects.toThrow(new BadRequestException('Image must be at most 5 MB'));
    expect(songs.create).not.toHaveBeenCalled();
  });

  it("404s when adding to a song that isn't yours", async () => {
    songs.findFirst.mockResolvedValue(null);
    await expect(
      service.upload(8, { songId: ID, contentType: 'image/png', size: MB }),
    ).rejects.toThrow(NotFoundException);
    expect(songs.update).not.toHaveBeenCalled();
  });

  it('lists your songs with a url per file and null for files never added', async () => {
    const createdAt = new Date('2026-11-28');
    songs.findMany.mockResolvedValue([
      {
        id: ID,
        title: 'First light',
        description: null,
        createdAt,
        musicKey: 'm',
        imageKey: 'i',
        videoKey: null,
      },
    ]);
    expect(await service.findMine(7)).toEqual([
      {
        id: ID,
        title: 'First light',
        description: null,
        createdAt,
        musicUrl: 'https://s3/m?read',
        imageUrl: 'https://s3/i?read',
        videoUrl: null,
      },
    ]);
    expect(redis.set).toHaveBeenCalledWith('songs:mine:7', expect.any(String), 'EX', 600);
  });

  it('serves your songs from the cache without touching the db', async () => {
    redis.get.mockResolvedValue(JSON.stringify([{ id: ID, title: 'Cached' }]));
    expect(await service.findMine(7)).toEqual([{ id: ID, title: 'Cached' }]);
    expect(songs.findMany).not.toHaveBeenCalled();
  });

  it('creating, adding a file to or removing a song clears your cached list', async () => {
    await service.upload(7, { title: 'x', contentType: 'audio/mpeg', size: MB });
    songs.findFirst.mockResolvedValue({ id: ID });
    await service.upload(7, { songId: ID, contentType: 'image/png', size: MB });
    expect(redis.del).toHaveBeenCalledTimes(2);
    expect(redis.del).toHaveBeenCalledWith('songs:mine:7');
  });

  it('remove deletes the row first, then every stored file in one S3 call', async () => {
    const keys = { musicKey: 'm', imageKey: 'i', videoKey: null };
    (songs.findFirst as jest.Mock<(args: unknown) => Promise<unknown>>).mockResolvedValue(keys);
    const order: string[] = [];
    songs.delete.mockImplementation(() => Promise.resolve(order.push('db')));
    s3.deleteMany.mockImplementation(() => Promise.resolve(void order.push('s3')));
    expect(await service.remove(7, ID)).toEqual({ message: 'Song deleted' });
    expect(songs.delete).toHaveBeenCalledWith({ where: { id: ID } });
    expect(s3.deleteMany).toHaveBeenCalledWith(['m', 'i']);
    expect(order).toEqual(['db', 's3']);
  });

  it("remove still succeeds when S3 can't delete the files", async () => {
    (songs.findFirst as jest.Mock<(args: unknown) => Promise<unknown>>).mockResolvedValue({
      musicKey: 'm',
      imageKey: null,
      videoKey: null,
    });
    s3.deleteMany.mockRejectedValue(new Error('m: AccessDenied'));
    await expect(service.remove(7, ID)).resolves.toEqual({ message: 'Song deleted' });
  });

  it("remove 404s for a song that isn't yours and touches nothing", async () => {
    songs.findFirst.mockResolvedValue(null);
    await expect(service.remove(8, ID)).rejects.toThrow(NotFoundException);
    expect(songs.delete).not.toHaveBeenCalled();
    expect(s3.deleteMany).not.toHaveBeenCalled();
  });

  it('search marks your own songs, the ones you liked and the artists you follow', async () => {
    const createdAt = new Date('2026-11-28');
    const base = { description: null, genres: [], createdAt, imageKey: null, videoKey: null };
    songs.findMany.mockResolvedValue([
      { ...base, id: 'a', title: 'Night drive', musicKey: 'ma', user: { id: 7, name: 'me' } },
      { ...base, id: 'b', title: 'Night owl', musicKey: 'mb', user: { id: 9, name: 'riya' } },
    ]);
    likes.findMany.mockResolvedValue([{ songId: 'b' }]);
    follows.findMany.mockResolvedValue([{ followingId: 9 }]);
    const result = await service.search(7, 'Night');
    expect(songs.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { title: { contains: 'Night', mode: 'insensitive' } } }),
    );
    expect(
      result.map(({ artist, isMine, liked, following }) => ({ artist, isMine, liked, following })),
    ).toEqual([
      { artist: 'me', isMine: true, liked: false, following: false },
      { artist: 'riya', isMine: false, liked: true, following: true },
    ]);
    expect(redis.set).toHaveBeenCalledWith('songs:search:night', expect.any(String), 'EX', 60);
  });

  it('search serves the shared song list from the cache', async () => {
    redis.get.mockResolvedValue(
      JSON.stringify([{ id: 'b', title: 'Night owl', artist: { id: 9, name: 'riya' } }]),
    );
    likes.findMany.mockResolvedValue([]);
    follows.findMany.mockResolvedValue([]);
    const [song] = await service.search(7, 'night');
    expect(songs.findMany).not.toHaveBeenCalled();
    expect(song).toMatchObject({ artist: 'riya', isMine: false, liked: false });
  });

  it('like toggles: the first call likes, the second unlikes', async () => {
    songs.findUnique.mockResolvedValue({ userId: 9 });
    likes.deleteMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
    expect(await service.toggleLike(7, ID)).toEqual({ liked: true });
    expect(likes.createMany).toHaveBeenCalledWith({
      data: { userId: 7, songId: ID },
      skipDuplicates: true,
    });
    expect(await service.toggleLike(7, ID)).toEqual({ liked: false });
    expect(likes.createMany).toHaveBeenCalledTimes(1);
  });

  it("can't like your own song or one that doesn't exist", async () => {
    songs.findUnique.mockResolvedValueOnce({ userId: 7 }).mockResolvedValueOnce(null);
    await expect(service.toggleLike(7, ID)).rejects.toThrow(BadRequestException);
    await expect(service.toggleLike(7, ID)).rejects.toThrow(NotFoundException);
    expect(likes.deleteMany).not.toHaveBeenCalled();
  });

  it("a profile's songs: their own plus the ones they liked, credited to each artist", async () => {
    const base = {
      description: null,
      genres: [],
      createdAt: new Date(),
      imageKey: null,
      videoKey: null,
    };
    users.findUnique.mockResolvedValue({ id: 9 });
    songs.findMany.mockResolvedValue([{ ...base, id: 'own', title: 'Mine', musicKey: 'm1' }]);
    (likes.findMany as jest.Mock<(args: unknown) => Promise<unknown>>).mockResolvedValue([
      { song: { ...base, id: 'fav', title: 'Theirs', musicKey: 'm2', user: { name: 'amit' } } },
    ]);
    const { songs: own, liked } = await service.findByUser('riya');
    expect(own.map(({ id }) => id)).toEqual(['own']);
    expect(liked).toEqual([
      expect.objectContaining({ id: 'fav', artist: 'amit', musicUrl: 'https://s3/m2?read' }),
    ]);
    expect(redis.set).toHaveBeenCalledWith('songs:liked:9', expect.any(String), 'EX', 600);
  });

  it('liking or unliking clears your cached liked songs', async () => {
    songs.findUnique.mockResolvedValue({ userId: 9 });
    likes.deleteMany.mockResolvedValue({ count: 0 });
    await service.toggleLike(7, ID);
    expect(redis.del).toHaveBeenCalledWith('songs:liked:7');
  });
});
