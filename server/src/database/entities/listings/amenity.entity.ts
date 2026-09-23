import { Column, Entity, Index, OneToMany } from 'typeorm';

import { AuditedEntity } from '../base/audited.entity';
import { RoomAmenity } from './room-amenity.entity';

@Entity({ name: 'amenities' })
@Index('amenities_slug_key', ['slug'], { unique: true })
@Index('amenities_name_key', ['name'], { unique: true })
export class Amenity extends AuditedEntity {
  @Column({ type: 'varchar', length: 100 })
  slug!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  category!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  icon!: string | null;

  @OneToMany(() => RoomAmenity, (roomAmenity) => roomAmenity.amenity)
  rooms!: RoomAmenity[];
}
