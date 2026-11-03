import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

function trimmed(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateReviewDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  contractId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  roomQuality!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  security!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  cleanliness!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  wifiQuality!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  utilityPrice!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  listingAccuracy!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  landlordAttitude!: number;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MaxLength(5_000)
  comment?: string | null;
}
