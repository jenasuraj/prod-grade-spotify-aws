import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { S3Service } from '../../infra/s3/s3.service.js';
import { SongsService } from './songs.service.js';

const ID = '7f6c2d0e-6a3b-4c1e-9f2a-1b2c3d4e5f60';

const MB = 1024 * 1024;

describe('SongsService', () => {
  let service: SongsService;
  const songs = {
    create: jest.fn<(args: { data: Record<string, unknown> }) => Promise<unknown>>(),
    findFirst: jest.fn<(args: unknown) => Promise<{ id: string } | null>>(),
    update: jest.fn<(args: { data: Record<string, unknown> }) => Promise<unknown>>(),
    findMany: jest.fn<(args: unknown) => Promise<unknown[]>>(),
    delete: jest.fn<(args: unknown) => Promise<unknown>>(),
  };
  const s3 = {
    signUpload: jest.fn<S3Service['signUpload']>(),
    signedUrl: jest.fn<S3Service['signedUrl']>(),
    deleteMany: jest.fn<S3Service['deleteMany']>(),
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
    s3.signedUrl.mockImplementation((key) => Promise.resolve(`https://s3/${key}?read`));
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
});
