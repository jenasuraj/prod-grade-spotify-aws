import { jest } from '@jest/globals';
import { HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { RedisService } from '../../infra/redis/redis.service.js';
import { RateLimitMiddleware } from './rate-limit.middleware.js';

const loggedIn = { cookies: { access_token: 't' } } as unknown as Request;

const res = {} as Response;

describe('RateLimitMiddleware', () => {
  let middleware: RateLimitMiddleware;
  const redis = {
    incr: jest.fn<(key: string) => Promise<number>>(),
    pexpire: jest.fn<(key: string, ms: number) => Promise<number>>(),
  };
  const jwt = { verifyAsync: jest.fn<(token: string) => Promise<{ sub: string }>>() };
  const next = jest.fn();

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitMiddleware,
        { provide: RedisService, useValue: redis },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    middleware = module.get(RateLimitMiddleware);
    jwt.verifyAsync.mockResolvedValue({ sub: '42' });
    redis.pexpire.mockResolvedValue(1);
  });

  it('the first hit starts a 1 minute window for that user', async () => {
    redis.incr.mockResolvedValue(1);
    await middleware.use(loggedIn, res, next);
    expect(redis.incr).toHaveBeenCalledWith('rate-limit:42');
    expect(redis.pexpire).toHaveBeenCalledWith('rate-limit:42', 60_000);
    expect(next).toHaveBeenCalled();
  });

  it('allows 5 hits in the window and rejects the 6th with a 429', async () => {
    redis.incr.mockResolvedValueOnce(5).mockResolvedValueOnce(6);
    await middleware.use(loggedIn, res, next);
    await expect(middleware.use(loggedIn, res, next)).rejects.toThrow(HttpException);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('skips logged-out requests', async () => {
    await middleware.use({ cookies: {} } as Request, res, next);
    expect(redis.incr).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
