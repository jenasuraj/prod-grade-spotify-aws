import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard, type AuthUser } from '../auth/auth.guard.js';
import { SearchSongsDto } from './dto/search-songs.dto.js';
import { UploadSongFileDto } from './dto/upload-song-file.dto.js';
import { SongsService } from './songs.service.js';

type AuthRequest = Request & { user: AuthUser };

@Controller('songs')
@UseGuards(AuthGuard)
export class SongsController {
  constructor(private readonly songs: SongsService) {}

  // One endpoint for every file: music starts a song, an image or video (with songId) joins it.
  // Returns a 15 min url; the browser then PUTs the file straight to S3
  @Post()
  upload(@Req() req: AuthRequest, @Body() dto: UploadSongFileDto) {
    return this.songs.upload(req.user.id, dto);
  }

  @Get()
  findMine(@Req() req: AuthRequest) {
    return this.songs.findMine(req.user.id);
  }

  @Get('search')
  search(@Req() req: AuthRequest, @Query() { q }: SearchSongsDto) {
    return this.songs.search(req.user.id, q);
  }

  // Toggles: likes the song, or unlikes it if you already do
  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  like(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.songs.toggleLike(req.user.id, id);
  }

  // Removes the song and its music, image and video from storage
  @Delete(':id')
  remove(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.songs.remove(req.user.id, id);
  }
}
