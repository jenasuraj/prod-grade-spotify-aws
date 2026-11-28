import { HttpException, HttpStatus, Injectable, type NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { NextFunction, Request, Response } from 'express';
import { RedisService } from '../../infra/redis/redis.service.js';
import { AUTH_COOKIE } from './auth.controller.js';
import { userIdFromSub } from './auth.service.js';

const LIMIT = 200;
const WINDOW_MS = 60_000;

// One counter per user: the key expires when the minute is up, so the count starts again
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // Runs before AuthGuard, so it reads the user id from the cookie itself
    const token = req.cookies?.[AUTH_COOKIE] as string | undefined;
    const payload = token
      ? await this.jwt.verifyAsync<{ sub: string }>(token).catch(() => null)
      : null;
    const id = userIdFromSub(payload?.sub);
    if (!id) return next();
    const key = `rate-limit:${id}`;
    // A Redis outage lets requests through instead of taking the app down
    const count = await this.redis.incr(key).catch(() => 0);
    if (count === 1) await this.redis.pexpire(key, WINDOW_MS).catch(() => null);
    if (count > LIMIT) throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    next();
  }
}