import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ContractStatus } from '../../../database/enums/domain.enums';

export class ListContractsQueryDto {
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

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
