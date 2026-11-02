import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

const MAX_MONEY_VALUE = 9_999_999_999;

/**
 * Numeric values are deliberately accepted as numbers at the HTTP boundary.
 * The service validates their date relationships and converts each value to a
 * fixed-scale decimal before it is persisted to the existing MySQL schema.
 */
export class CreateInvoiceDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  contractId!: number;

  @Type(() => Date)
  @IsDate()
  periodStart!: Date;

  @Type(() => Date)
  @IsDate()
  periodEnd!: Date;

  @Type(() => Date)
  @IsDate()
  dueDate!: Date;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  rentAmount?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  electricityStart?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  electricityEnd?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  electricityUnitPrice?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  waterStart?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  waterEnd?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  waterUnitPrice?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  internetAmount?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  parkingAmount?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  serviceAmount?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  otherAmount?: number;
}
