import { jest } from '@jest/globals';
import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { RedisService } from '../../infra/redis/redis.service.js';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  let service: HealthService;
  const prisma = { $queryRaw: jest.fn<() => Promise<unknown>>() };
  const redis = { ping: jest.fn<() => Promise<string>>() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();
    service = module.get(HealthService);
  });

  it('reports ok when db and redis answer', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    redis.ping.mockResolvedValue('PONG');
    await expect(service.check()).resolves.toEqual({ status: 'ok', db: 'up', redis: 'up' });
  });

  it('throws 503 when redis is down', async () => {
    prisma.$queryRaw.mockResolvedValue([]);
    redis.ping.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(service.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('throws 503 when the db is down', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('ECONNREFUSED'));
    redis.ping.mockResolvedValue('PONG');
    await expect(service.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
