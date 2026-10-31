import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

function trimmed(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/** A remote image reference; the server never downloads this URL. */
export class RoomImageInputDto {
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MaxLength(500)
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    require_host: true,
  })
  url!: string;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MaxLength(255)
  altText?: string | null;

  @IsOptional()
  @IsBoolean()
  isCover?: boolean;
}
