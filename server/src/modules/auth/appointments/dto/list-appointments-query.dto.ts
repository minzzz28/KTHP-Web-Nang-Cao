import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ViewingAppointmentStatus } from '../../../database/enums/domain.enums';

export class ListAppointmentsQueryDto {
  @IsOptional()
  @IsEnum(ViewingAppointmentStatus)
  status?: ViewingAppointmentStatus;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10_000)
  page = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;
}
