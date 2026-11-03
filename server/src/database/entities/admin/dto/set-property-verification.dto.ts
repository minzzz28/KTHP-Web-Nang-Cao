import { IsIn } from 'class-validator';
import { VerificationStatus } from '../../../database/enums/domain.enums';

export class SetPropertyVerificationDto {
  @IsIn([VerificationStatus.VERIFIED, VerificationStatus.REJECTED])
  status!: VerificationStatus.VERIFIED | VerificationStatus.REJECTED;
}
