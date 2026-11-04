import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { VerificationStatus } from '../../../database/enums/domain.enums';

export class ReviewVerificationRequestDto {
  @IsIn([VerificationStatus.VERIFIED, VerificationStatus.REJECTED])
  status!: VerificationStatus.VERIFIED | VerificationStatus.REJECTED;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(5_000)
  reviewerNote?: string | null;
}
