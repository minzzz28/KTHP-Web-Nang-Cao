import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUrl, MaxLength, Min } from 'class-validator';
import { ReportReason, ReportTargetType } from '../../../database/enums/domain.enums';

function trimmed(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateReportDto {
  @IsEnum(ReportTargetType)
  targetType!: ReportTargetType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetUserId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roommatePostId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reviewId?: number | null;

  @IsEnum(ReportReason)
  reason!: ReportReason;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MaxLength(5_000)
  description?: string | null;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  evidenceUrl?: string | null;
}
