import { jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/infra/prisma/prisma.service.js';
import { RedisService } from '../src/infra/redis/redis.service.js';

describe('GET /api/health (e2e)', () => {
  let app: INestApplication<App>;
  const prisma = { $queryRaw: jest.fn<() => Promise<unknown>>(), $disconnect: jest.fn() };
  const redis = { ping: jest.fn<() => Promise<string>>(), quit: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(RedisService)
      .useValue(redis)
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 when db and redis are up', () => {
    prisma.$queryRaw.mockResolvedValue([]);
    redis.ping.mockResolvedValue('PONG');
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', db: 'up', redis: 'up' });
  });

  it('returns 503 and names the service that is down', () => {
    prisma.$queryRaw.mockRejectedValue(new Error('ECONNREFUSED'));
    redis.ping.mockResolvedValue('PONG');
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(503)
      .expect({ status: 'error', db: 'down', redis: 'up' });
  });
});
