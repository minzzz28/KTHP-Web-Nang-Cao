import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

/** Body used by the canonical POST /conversations/direct endpoint. */
export class CreateDirectConversationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  participantId!: number;
}
