import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * Compatibility body retained for the legacy POST /conversations route.
 * `participantId` keeps precedence over the older aliases, exactly as before.
 */
export class CreateDirectConversationCompatibilityDto {
  @Type(() => Number)
  @ValidateIf((_input, value) => value !== undefined)
  @IsInt()
  @Min(1)
  participantId?: number;

  @Type(() => Number)
  @ValidateIf((_input, value) => value !== undefined)
  @IsInt()
  @Min(1)
  recipientId?: number;

  @Type(() => Number)
  @ValidateIf((_input, value) => value !== undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  participantIds?: number[];
}
