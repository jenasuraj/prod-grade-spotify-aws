import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { RedisService } from '../../infra/redis/redis.service.js';
import { S3Service } from '../../infra/s3/s3.service.js';
import { ProfileService } from './profile.service.js';

describe('ProfileService follows', () => {
  let service: ProfileService;
  const users = {
    findUnique: jest.fn<(args: unknown) => Promise<unknown>>(),
    findUniqueOrThrow: jest.fn<(args: unknown) => Promise<{ name: string }>>(),
  };
  const follows = {
    deleteMany: jest.fn<(args: unknown) => Promise<{ count: number }>>(),
    createMany: jest.fn<(args: unknown) => Promise<{ count: number }>>(),
  };
  const redis = {
    get: jest.fn<(key: string) => Promise<string | null>>(),
    set: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    del: jest.fn<(...keys: string[]) => Promise<number>>(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: PrismaService, useValue: { user: users, follow: follows } },
        { provide: RedisService, useValue: redis },
        { provide: S3Service, useValue: {} },
      ],
    }).compile();
    service = module.get(ProfileService);
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue('OK');
    redis.del.mockResolvedValue(2);
    users.findUniqueOrThrow.mockResolvedValue({ name: 'me' });
  });

  it('follow toggles and clears both cached lists', async () => {
    users.findUnique.mockResolvedValue({ id: 9 });
    follows.deleteMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
    expect(await service.toggleFollow(7, 'riya')).toEqual({ following: true });
    expect(follows.createMany).toHaveBeenCalledWith({
      data: { followerId: 7, followingId: 9 },
      skipDuplicates: true,
    });
    expect(redis.del).toHaveBeenCalledWith('profile:riya:follows', 'profile:me:follows');
    expect(await service.toggleFollow(7, 'riya')).toEqual({ following: false });
    expect(follows.createMany).toHaveBeenCalledTimes(1);
  });

  it("can't follow yourself or someone who doesn't exist", async () => {
    users.findUnique.mockResolvedValueOnce({ id: 7 }).mockResolvedValueOnce(null);
    await expect(service.toggleFollow(7, 'me')).rejects.toThrow(BadRequestException);
    await expect(service.toggleFollow(7, 'ghost')).rejects.toThrow(NotFoundException);
    expect(follows.deleteMany).not.toHaveBeenCalled();
  });

  it('follow stats have both counts and lists, then get cached', async () => {
    users.findUnique.mockResolvedValue({
      following: [{ following: { name: 'riya', profile: { displayName: 'Riya' } } }],
      followers: [
        { follower: { name: 'amit', profile: null } },
        { follower: { name: 'riya', profile: { displayName: 'Riya' } } },
      ],
    });
    expect(await service.getFollows('me')).toEqual({
      followingCount: 1,
      followerCount: 2,
      following: [{ name: 'riya', displayName: 'Riya' }],
      followers: [
        { name: 'amit', displayName: null },
        { name: 'riya', displayName: 'Riya' },
      ],
    });
    expect(redis.set).toHaveBeenCalledWith('profile:me:follows', expect.any(String), 'EX', 600);
  });
});
