import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { VerificationStatus } from '../../enums/domain.enums';
import { AuditedEntity } from '../base/audited.entity';
import { User } from '../identity/user.entity';
import { Room } from '../listings/room.entity';
import { NearbyPlace } from './nearby-place.entity';

@Entity({ name: 'properties' })
@Index('properties_slug_key', ['slug'], { unique: true })
@Index('properties_landlord_id_idx', ['landlordId'])
@Index('properties_city_district_idx', ['city', 'district'])
@Index('properties_latitude_longitude_idx', ['latitude', 'longitude'])
@Index('properties_verification_status_idx', ['verificationStatus'])
export class Property extends AuditedEntity {
  @Column({ name: 'landlord_id', type: 'int' })
  landlordId!: number;

  @Column({ type: 'varchar', length: 191 })
  slug!: string;

  @Column({ type: 'varchar', length: 191 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 500 })
  address!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  ward!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  district!: string | null;

  @Column({ type: 'varchar', length: 120, default: 'Hà Nội' })
  city!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude!: string;

  @Column({ type: 'text', nullable: true })
  rules!: string | null;

  @Column({ name: 'opening_hours', type: 'varchar', length: 120, nullable: true })
  openingHours!: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 30, nullable: true })
  contactPhone!: string | null;

  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.UNVERIFIED,
  })
  verificationStatus!: VerificationStatus;

  @ManyToOne(() => User, (user) => user.properties, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'landlord_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'properties_landlord_id_fkey',
  })
  landlord!: User;

  @OneToMany(() => Room, (room) => room.property)
  rooms!: Room[];

  @OneToMany(() => NearbyPlace, (nearbyPlace) => nearbyPlace.property)
  nearbyPlaces!: NearbyPlace[];
}
