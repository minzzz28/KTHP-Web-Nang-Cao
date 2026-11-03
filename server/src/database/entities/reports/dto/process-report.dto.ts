import { Transform } from 'class-transformer';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { ReportStatus } from '../../../database/enums/domain.enums';

function trimmed(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class ProcessReportDto {
  @IsIn([ReportStatus.PROCESSING, ReportStatus.RESOLVED, ReportStatus.REJECTED])
  status!: ReportStatus.PROCESSING | ReportStatus.RESOLVED | ReportStatus.REJECTED;

  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MinLength(1)
  @MaxLength(5_000)
  adminNote!: string;
}
