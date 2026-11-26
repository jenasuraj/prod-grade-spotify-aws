import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { S3Service } from '../../infra/s3/s3.service.js';
import { SongsService } from './songs.service.js';

describe('SongsService', () => {
  let service: SongsService;
  const songs = {
    create: jest.fn<(args: { data: Record<string, unknown> }) => Promise<unknown>>(),
    findMany: jest.fn<(args: unknown) => Promise<unknown[]>>(),
  };
  const s3 = {
    signUpload: jest.fn<S3Service['signUpload']>(),
    signedUrl: jest.fn<S3Service['signedUrl']>(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongsService,
        { provide: PrismaService, useValue: { song: songs } },
        { provide: S3Service, useValue: s3 },
      ],
    }).compile();
    service = module.get(SongsService);
    s3.signUpload.mockImplementation((key) => Promise.resolve(`https://s3/${key}?signed`));
  });

  it('saves the song with its key and returns a url signed for that key, type and size', async () => {
    const { id, url } = await service.create(7, {
      title: 'First light',
      contentType: 'audio/mpeg',
      size: 1000,
    });
    const musicKey = `songs/7/${id}`;
    expect(s3.signUpload).toHaveBeenCalledWith(musicKey, 'audio/mpeg', 1000);
    expect(songs.create).toHaveBeenCalledWith({
      data: { id, userId: 7, title: 'First light', musicKey },
    });
    expect(url).toBe(`https://s3/${musicKey}?signed`);
  });

  it('lists only your songs, newest first, with a play url instead of the key', async () => {
    const createdAt = new Date('2026-11-27');
    songs.findMany.mockResolvedValue([
      { id: 'abc', title: 'First light', musicKey: 'songs/7/abc', createdAt },
    ]);
    s3.signedUrl.mockImplementation((key) => Promise.resolve(`https://s3/${key}?read`));
    const result = await service.findMine(7);
    expect(songs.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 7 }, orderBy: { createdAt: 'desc' } }),
    );
    expect(result).toEqual([
      { id: 'abc', title: 'First light', createdAt, musicUrl: 'https://s3/songs/7/abc?read' },
    ]);
  });
});
