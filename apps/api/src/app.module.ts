import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MailModule } from './infra/mail/mail.module.js';
import { PrismaModule } from './infra/prisma/prisma.module.js';
import { RedisModule } from './infra/redis/redis.module.js';
import { S3Module } from './infra/s3/s3.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { RateLimitMiddleware } from './modules/auth/rate-limit.middleware.js';
import { HealthModule } from './modules/health/health.module.js';
import { ProfileModule } from './modules/profile/profile.module.js';
import { SongsModule } from './modules/songs/songs.module.js';
import { DummyModule } from './modules/dummy/dummy.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // infra: connections, no routes
    PrismaModule,
    RedisModule,
    MailModule,
    S3Module,
    // features: /api/auth, /api/health, /api/profile, /api/songs
    AuthModule,
    HealthModule,
    ProfileModule,
    SongsModule,
    DummyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  // Every route of every controller is rate limited; health checks from the platform are not
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).exclude('health').forRoutes('*path');
  }
}
