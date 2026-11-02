import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ContractTenantInputDto } from './contract-tenant-input.dto';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateContractDto {
  @ValidateIf((_input, value) => value !== undefined)
  @Transform(trim)
  @IsString()
  @MinLength(4)
  @MaxLength(80)
  contractNumber?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId!: number;

  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @Type(() => Date)
  @IsDate()
  endDate!: Date;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsPositive()
  @Max(9_999_999_999)
  rent!: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(9_999_999_999)
  deposit!: number;

  @Transform(trim)
  @IsString()
  @MinLength(10)
  @MaxLength(30_000)
  terms!: string;

  @ValidateIf((_input, value) => value !== undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ContractTenantInputDto)
  tenants?: ContractTenantInputDto[];

  // Legacy callers may still send a simple array.  The service converts it
  // into one normalized tenant list and selects the first entry as primary.
  @ValidateIf((_input, value) => value !== undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  studentIds?: number[];
}
