import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRoommateRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  recipientId!: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  postId?: number | null;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  roomId?: number | null;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string | null;
}
