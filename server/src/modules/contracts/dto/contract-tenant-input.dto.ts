import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';

export class ContractTenantInputDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId!: number;

  @IsOptional()
  @IsBoolean()
  isPrimaryTenant?: boolean;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  moveInDate?: Date | null;

  @Type(() => Date)
  @ValidateIf((_input, value) => value !== undefined && value !== null)
  @IsDate()
  moveOutDate?: Date | null;
}
