import { IsEnum } from 'class-validator';

export enum RoommateRequestAction {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
  CANCEL = 'CANCEL',
}

export class RespondRoommateRequestDto {
  @IsEnum(RoommateRequestAction)
  action!: RoommateRequestAction;
}
