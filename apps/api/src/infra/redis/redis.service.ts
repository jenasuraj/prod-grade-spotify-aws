import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

// The whole connection comes from REDIS_URL: redis:// locally, rediss:// (TLS) on managed cloud Redis
@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(config: ConfigService) {
    super(config.getOrThrow<string>('REDIS_URL'), { maxRetriesPerRequest: 3 });
    // A refused connection has an empty message, only a code
    this.on('error', (error: NodeJS.ErrnoException) =>
      this.logger.error(`Redis error: ${error.message || error.code}`),
    );
  }

  async onModuleDestroy() {
    await this.quit();
  }
}