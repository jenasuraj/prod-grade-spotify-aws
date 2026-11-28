import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { RedisService } from '../../infra/redis/redis.service.js';
import { S3Service } from '../../infra/s3/s3.service.js';
import { UploadSongFileDto } from './dto/upload-song-file.dto.js';



const MB = 1024 * 1024;
type SongFile = 'music' | 'image' | 'video';
const FILE_RULES: Record<SongFile, { label: string; maxSize: number; types: string[] }> = {
  music: {
    label: 'Music',
    maxSize: 50 * MB,
    types: [
      'audio/mpeg',
      'audio/mp4',
      'audio/x-m4a',
      'audio/wav',
      'audio/x-wav',
      'audio/flac',
      'audio/x-flac',
      'audio/ogg',
    ],
  },
  image: { label: 'Image', maxSize: 5 * MB, types: ['image/jpeg', 'image/png', 'image/webp'] },
  video: { label: 'Video', maxSize: 200 * MB, types: ['video/mp4', 'video/webm'] },
};

const KEY_FIELD = { music: 'musicKey', image: 'imageKey', video: 'videoKey' } as const;
const UNSUPPORTED = 'Upload music (mp3, m4a, wav, flac, ogg), an image (jpg, png, webp) or a video (mp4, webm)';





// The file's type decides what it is
const kindOf = (contentType: string) =>
  (Object.keys(FILE_RULES) as SongFile[]).find((kind) =>
    FILE_RULES[kind].types.includes(contentType),
  );


const keyFor = (userId: number, songId: string, kind: SongFile) => `songs/${userId}/${songId}/${kind}`;
const mineKey = (userId: number) => `songs:mine:${userId}`;

type MySong = {
  id: string;
  title: string;
  description: string | null;
  genres: string[];
  createdAt: Date;
  musicUrl: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
};



@Injectable()
export class SongsService {
  private readonly logger = new Logger(SongsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly s3: S3Service,
  ) {}




  /** Saves the file's key on the song, then returns the url the browser PUTs the file to */
  async upload(userId: number, { songId, contentType, size, ...details }: UploadSongFileDto) {
    const kind = kindOf(contentType);
    if (!kind) throw new BadRequestException(UNSUPPORTED);
    const { label, maxSize } = FILE_RULES[kind];
    if (size > maxSize)
      throw new BadRequestException(`${label} must be at most ${maxSize / MB} MB`);
    const id = songId ?? randomUUID();
    const key = keyFor(userId, id, kind);
    const url = await this.s3.signUpload(key, contentType, size);
    if (songId) await this.attach(userId, songId, kind, key);
    else await this.create(userId, id, kind, key, details);
    return { id, kind, url };
  }



  /** Your songs, newest first, each file with a 1 hour url from the private bucket */
  async findMine(userId: number) {
    const cached = await this.redis.get(mineKey(userId)).catch(() => null);
    if (cached) return JSON.parse(cached) as MySong[];
    const songs = await this.prisma.song.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        genres: true,
        createdAt: true,
        musicKey: true,
        imageKey: true,
        videoKey: true,
      },
    });
    const sign = (key: string | null) => (key ? this.s3.signedUrl(key) : null);
    const data: MySong[] = await Promise.all(
      songs.map(async ({ musicKey, imageKey, videoKey, ...song }) => {
        const [musicUrl, imageUrl, videoUrl] = await Promise.all([
          sign(musicKey),
          sign(imageKey),
          sign(videoKey),
        ]);
        return { ...song, musicUrl, imageUrl, videoUrl };
      }),
    );
    // 10 min, well under the 1h signed urls, so a cached url never expires before it's served
    await this.redis.set(mineKey(userId), JSON.stringify(data), 'EX', 600).catch(() => null);
    return data;
  }




  /** Deletes the song, then its files. Db first: a failed S3 call only leaves unseen files, never a broken song */
  async remove(userId: number, id: string) {
    const song = await this.prisma.song.findFirst({
      where: { id, userId },
      select: { musicKey: true, imageKey: true, videoKey: true },
    });
    if (!song) throw new NotFoundException('Song not found');
    await this.prisma.song.delete({ where: { id } });
    await this.redis.del(mineKey(userId)).catch(() => null);
    const keys = [song.musicKey, song.imageKey, song.videoKey].filter((key) => key !== null);
    await this.s3
      .deleteMany(keys)
      .catch((err: Error) =>
        this.logger.warn(`Song ${id} deleted, files left in S3: ${err.message}`),
      );
    return { message: 'Song deleted' };
  }


  

  // A song starts with its music; the image and video are added to it afterwards
  private async create( userId: number, id: string, kind: SongFile, key: string,
    { title, description, genres }: Pick<UploadSongFileDto, 'title' | 'description' | 'genres'>,
  ) {
    if (kind !== 'music')
      throw new BadRequestException('Start a song with its music, then add the image or video');
    if (!title) throw new BadRequestException('Title is required');
    await this.prisma.song.create({
      data: { id, userId, title, description, genres, musicKey: key },
    });
    await this.redis.del(mineKey(userId)).catch(() => null);
  }

  private async attach(userId: number, id: string, kind: SongFile, key: string) {
    const song = await this.prisma.song.findFirst({ where: { id, userId }, select: { id: true } });
    if (!song) throw new NotFoundException('Song not found');
    await this.prisma.song.update({ where: { id }, data: { [KEY_FIELD[kind]]: key } });
    await this.redis.del(mineKey(userId)).catch(() => null);
  }
}