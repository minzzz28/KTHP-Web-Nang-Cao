import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsDefined,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ViewingAppointmentStatus } from '../../../database/enums/domain.enums';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const landlordActions = [
  ViewingAppointmentStatus.ACCEPTED,
  ViewingAppointmentStatus.REJECTED,
  ViewingAppointmentStatus.RESCHEDULED,
  ViewingAppointmentStatus.COMPLETED,
] as const;

export class AppointmentActionDto {
  @IsIn(landlordActions)
  status!: ViewingAppointmentStatus;

  // The same field is allowed for the other actions for legacy compatibility,
  // but only a reschedule requires it.
  @Type(() => Date)
  @ValidateIf(
    (input: AppointmentActionDto, value) =>
      input.status === ViewingAppointmentStatus.RESCHEDULED ||
      (value !== undefined && value !== null),
  )
  @IsDefined({
    message: 'Cần có thời gian đề xuất mới khi yêu cầu dời lịch',
  })
  @IsDate()
  proposedAt?: Date | null;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(3_000)
  landlordNote?: string | null;
}
