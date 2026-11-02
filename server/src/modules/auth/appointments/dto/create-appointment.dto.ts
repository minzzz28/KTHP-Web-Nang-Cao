import { Transform, Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateAppointmentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId!: number;

  @Type(() => Date)
  @IsDate()
  scheduledAt!: Date;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(3_000)
  studentNote?: string | null;
}
