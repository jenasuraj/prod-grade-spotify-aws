import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export const GENRES = [
  'Pop',
  'Hip-hop',
  'R&B',
  'Rock',
  'Electronic',
  'Jazz',
  'Classical',
  'Lo-fi',
  'Indie',
  'Folk',
];

// Describes one file; the bytes go straight from the browser to S3.
// No songId starts a new song (music + title); with a songId the file is added to that song
export class UploadSongFileDto {
  @IsOptional()
  @IsUUID()
  songId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 100)
  title?: string;

  // '' becomes null, so an empty textarea stores nothing
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  // Any number of the fixed GENRES, set when the song is created
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(GENRES, { each: true, message: `Genres must be from: ${GENRES.join(', ')}` })
  genres?: string[];

  @IsString()
  contentType: string;

  @IsInt()
  @Min(1)
  size: number;
}
