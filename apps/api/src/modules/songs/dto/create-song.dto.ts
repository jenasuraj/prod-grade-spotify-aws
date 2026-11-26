import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsString, Length, Max, Min } from 'class-validator';

export const MUSIC_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/x-flac',
  'audio/ogg',
];

export const MAX_MUSIC_SIZE = 50 * 1024 * 1024;

// Describes the file only; the bytes go straight from the browser to S3
export class CreateSongDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 100)
  title: string;

  @IsIn(MUSIC_TYPES, { message: 'Music must be an mp3, m4a, wav, flac or ogg file' })
  contentType: string;

  @IsInt()
  @Min(1)
  @Max(MAX_MUSIC_SIZE, { message: 'Music must be at most 50 MB' })
  size: number;
}
