import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsDefined,
  IsIn,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ViewingAppointmentStatus } from '../../../database/enums/domain.enums';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** The legacy PATCH alias additionally permits a student cancellation. */
export class UpdateAppointmentDto {
  @IsIn([
    ViewingAppointmentStatus.ACCEPTED,
    ViewingAppointmentStatus.REJECTED,
    ViewingAppointmentStatus.RESCHEDULED,
    ViewingAppointmentStatus.COMPLETED,
    ViewingAppointmentStatus.CANCELLED,
  ])
  status!: ViewingAppointmentStatus;

  @Type(() => Date)
  @ValidateIf(
    (input: UpdateAppointmentDto, value) =>
      input.status === ViewingAppointmentStatus.RESCHEDULED ||
      (value !== undefined && value !== null),
  )
  @IsDefined({
    message: 'Cần có thời gian đề xuất mới khi yêu cầu dời lịch',
  })
  @IsDate()
  proposedAt?: Date | null;

  @Transform(trim)
  @ValidateIf((_input, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(3_000)
  landlordNote?: string | null;
}
