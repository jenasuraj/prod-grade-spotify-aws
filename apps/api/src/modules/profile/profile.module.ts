import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { SongsModule } from '../songs/songs.module.js';
import { ProfileController } from './profile.controller.js';
import { ProfileService } from './profile.service.js';

@Module({
  imports: [AuthModule, SongsModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
