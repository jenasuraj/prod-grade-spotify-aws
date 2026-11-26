import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { S3Service } from '../../infra/s3/s3.service.js';
import { CreateSongDto } from './dto/create-song.dto.js';

@Injectable()
export class SongsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  /** Saves the song and returns the url the browser PUTs the music to. Nothing confirms the upload yet */
  async create(userId: number, { title, contentType, size }: CreateSongDto) {
    const id = randomUUID();
    const musicKey = `songs/${userId}/${id}`;
    const url = await this.s3.signUpload(musicKey, contentType, size);
    await this.prisma.song.create({ data: { id, userId, title, musicKey } });
    return { id, url };
  }

  /** Your songs, newest first, each with a 1 hour url to play it from the private bucket */
  async findMine(userId: number) {
    const songs = await this.prisma.song.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, musicKey: true, createdAt: true },
    });
    return Promise.all(
      songs.map(async ({ musicKey, ...song }) => ({
        ...song,
        musicUrl: await this.s3.signedUrl(musicKey),
      })),
    );
  }
}
