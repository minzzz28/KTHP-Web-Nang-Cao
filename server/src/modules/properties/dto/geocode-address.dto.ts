import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

function normalizedAddress(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;
}

/** An address only: this endpoint never accepts a destination URL. */
export class GeocodeAddressDto {
  @Transform(({ value }) => normalizedAddress(value))
  @IsString()
  @MinLength(5)
  @MaxLength(250)
  @Matches(/^(?![a-z][a-z0-9+.-]*:\/\/).+$/i, {
    message: 'Địa chỉ không được là URL',
  })
  address!: string;
}
