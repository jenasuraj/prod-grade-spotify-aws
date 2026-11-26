import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard, type AuthUser } from '../auth/auth.guard.js';
import { CreateSongDto } from './dto/create-song.dto.js';
import { SongsService } from './songs.service.js';

type AuthRequest = Request & { user: AuthUser };

@Controller('songs')
export class SongsController {
  constructor(private readonly songs: SongsService) {}

  // Returns a 15 min upload url; the browser then PUTs the music straight to S3
  @Post()
  @UseGuards(AuthGuard)
  create(@Req() req: AuthRequest, @Body() dto: CreateSongDto) {
    return this.songs.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findMine(@Req() req: AuthRequest) {
    return this.songs.findMine(req.user.id);
  }
}
