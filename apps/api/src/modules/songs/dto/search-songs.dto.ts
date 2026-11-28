import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

// GET /api/songs/search?q=night
export class SearchSongsDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 100)
  q: string;
}
