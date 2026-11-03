import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class GroupMemberDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId!: number;
}
