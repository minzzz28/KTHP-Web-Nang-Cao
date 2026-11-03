import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { RoommateRequestStatus } from '../../../database/enums/domain.enums';

export class ListRoommateRequestsQueryDto {
  @IsOptional()
  @IsEnum(RoommateRequestStatus)
  status?: RoommateRequestStatus;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  // The student screen asks for 100 rows so both sent and received invitations
  // can be combined client-side without an artificial validation error.
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 12;
}
