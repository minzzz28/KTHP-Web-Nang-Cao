import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { RentalGroupStatus } from '../../../database/enums/domain.enums';

function parseBoolean(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  return value;
}

export class ListRentalGroupsQueryDto {
  @IsOptional()
  @IsEnum(RentalGroupStatus)
  status?: RentalGroupStatus;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  roomId?: number;

  @Transform(({ value }) => parseBoolean(value))
  @IsOptional()
  @IsBoolean()
  mine?: boolean;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;
}
