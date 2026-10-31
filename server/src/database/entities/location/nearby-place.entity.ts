import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { NearbyPlaceCategory } from '../../enums/domain.enums';
import { AuditedEntity } from '../base/audited.entity';
import { Property } from './property.entity';

@Entity({ name: 'nearby_places' })
@Index('nearby_places_property_id_category_idx', ['propertyId', 'category'])
@Index('nearby_places_latitude_longitude_idx', ['latitude', 'longitude'])
export class NearbyPlace extends AuditedEntity {
  @Column({ name: 'property_id', type: 'int' })
  propertyId!: number;

  @Column({ type: 'varchar', length: 191 })
  name!: string;

  @Column({ type: 'enum', enum: NearbyPlaceCategory })
  category!: NearbyPlaceCategory;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude!: string;

  @Column({ name: 'distance_meters', type: 'int', nullable: true })
  distanceMeters!: number | null;

  @ManyToOne(() => Property, (property) => property.nearbyPlaces, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'property_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'nearby_places_property_id_fkey',
  })
  property!: Property;
}
