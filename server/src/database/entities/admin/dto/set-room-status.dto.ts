import { IsEnum } from 'class-validator';
import { RoomStatus } from '../../../database/enums/domain.enums';

export class SetRoomStatusDto {
  @IsEnum(RoomStatus)
  status!: RoomStatus;
}
