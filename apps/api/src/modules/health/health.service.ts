import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { RedisService } from '../../infra/redis/redis.service.js';

const PING_TIMEOUT_MS = 2000;

// A dead connection can hang instead of failing, so every ping gets a deadline
const ping = (check: () => Promise<unknown>) =>
  Promise.race([
    check().then(() => 'up' as const),
    new Promise<'down'>((resolve) => setTimeout(() => resolve('down'), PING_TIMEOUT_MS)),
  ]).catch(() => 'down' as const);

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check() {
    const [db, redis] = await Promise.all([
      ping(() => this.prisma.$queryRaw`SELECT 1`),
      ping(() => this.redis.ping()),
    ]);
    if (db === 'down' || redis === 'down')
      throw new ServiceUnavailableException({ status: 'error', db, redis });
    return { status: 'ok', db, redis };
  }
}
