import { IsEnum } from 'class-validator';
import { UserStatus } from '../../../database/enums/domain.enums';

export class SetUserStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}
