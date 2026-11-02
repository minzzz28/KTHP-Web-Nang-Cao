import { IsIn } from 'class-validator';
import { ContractStatus } from '../../../database/enums/domain.enums';

export class TransitionContractDto {
  @IsIn([
    ContractStatus.ACTIVE,
    ContractStatus.TERMINATED,
    ContractStatus.EXPIRED,
  ])
  status!: ContractStatus;
}
