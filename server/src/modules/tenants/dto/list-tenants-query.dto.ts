import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

function parseLegacyBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === '1';
}

export class ListTenantsQueryDto {
  // The old endpoint accepted both candidates=true and candidates=1. Keep
  // that contract without turning arbitrary strings into truthy values.
  @IsOptional()
  @Transform(({ value }) => parseLegacyBoolean(value))
  @IsBoolean()
  candidates = false;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10_000)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;
}
