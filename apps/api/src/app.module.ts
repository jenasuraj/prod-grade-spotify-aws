import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MailModule } from './infra/mail/mail.module.js';
import { PrismaModule } from './infra/prisma/prisma.module.js';
import { RedisModule } from './infra/redis/redis.module.js';
import { S3Module } from './infra/s3/s3.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ProfileModule } from './modules/profile/profile.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // infra: connections, no routes
    PrismaModule,
    RedisModule,
    MailModule,
    S3Module,
    // features: /api/auth, /api/health, /api/profile
    AuthModule,
    HealthModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
