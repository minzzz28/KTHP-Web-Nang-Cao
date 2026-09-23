import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { RoomStatus, RoomType } from '../../enums/domain.enums';
import { AuditedEntity } from '../base/audited.entity';
import { Property } from '../location/property.entity';
import { Review } from '../moderation/review.entity';
import { Report } from '../moderation/report.entity';
import { Contract } from '../rental/contract.entity';
import { ViewingAppointment } from '../rental/viewing-appointment.entity';
import { RentalGroup } from '../social/rental-group.entity';
import { RoommatePost } from '../social/roommate-post.entity';
import { RoommateRequest } from '../social/roommate-request.entity';
import { Favorite } from './favorite.entity';
import { RoomAmenity } from './room-amenity.entity';
import { RoomImage } from './room-image.entity';
import { RoomPriceHistory } from './room-price-history.entity';
import { RoomView } from './room-view.entity';

@Entity({ name: 'rooms' })
@Index('rooms_property_id_code_key', ['propertyId', 'code'], { unique: true })
@Index('rooms_property_id_idx', ['propertyId'])
@Index('rooms_price_idx', ['price'])
@Index('rooms_status_price_idx', ['status', 'price'])
@Index('rooms_type_status_idx', ['type', 'status'])
@Index('rooms_created_at_idx', ['createdAt'])
export class Room extends AuditedEntity {
  @Column({ name: 'property_id', type: 'int' })
  propertyId!: number;

  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 191 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  deposit!: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  area!: string;

  @Column({ type: 'int' })
  capacity!: number;

  @Column({ name: 'available_slots', type: 'int' })
  availableSlots!: number;

  @Column({ type: 'enum', enum: RoomType })
  type!: RoomType;

  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.AVAILABLE })
  status!: RoomStatus;

  @Column({ name: 'electricity_price', type: 'decimal', precision: 12, scale: 2 })
  electricityPrice!: string;

  @Column({ name: 'water_price', type: 'decimal', precision: 12, scale: 2 })
  waterPrice!: string;

  @Column({ name: 'internet_fee', type: 'decimal', precision: 12, scale: 2 })
  internetFee!: string;

  @Column({ name: 'parking_fee', type: 'decimal', precision: 12, scale: 2 })
  parkingFee!: string;

  @Column({
    name: 'service_fee',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  serviceFee!: string;

  @Column({
    name: 'location_score',
    type: 'decimal',
    precision: 3,
    scale: 1,
    nullable: true,
  })
  locationScore!: string | null;

  @Column({ name: 'published_at', type: 'datetime', precision: 3, nullable: true })
  publishedAt!: Date | null;

  @ManyToOne(() => Property, (property) => property.rooms, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'property_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'rooms_property_id_fkey',
  })
  property!: Property;

  @OneToMany(() => RoomImage, (image) => image.room)
  images!: RoomImage[];

  @OneToMany(() => RoomAmenity, (roomAmenity) => roomAmenity.room)
  amenities!: RoomAmenity[];

  @OneToMany(() => Favorite, (favorite) => favorite.room)
  favorites!: Favorite[];

  @OneToMany(() => RoomPriceHistory, (history) => history.room)
  priceHistories!: RoomPriceHistory[];

  @OneToMany(() => RoomView, (view) => view.room)
  views!: RoomView[];

  @OneToMany(() => RoommatePost, (post) => post.room)
  roommatePosts!: RoommatePost[];

  @OneToMany(() => RoommateRequest, (request) => request.room)
  roommateRequests!: RoommateRequest[];

  @OneToMany(() => RentalGroup, (group) => group.room)
  rentalGroups!: RentalGroup[];

  @OneToMany(() => ViewingAppointment, (appointment) => appointment.room)
  appointments!: ViewingAppointment[];

  @OneToMany(() => Contract, (contract) => contract.room)
  contracts!: Contract[];

  @OneToMany(() => Review, (review) => review.room)
  reviews!: Review[];

  @OneToMany(() => Report, (report) => report.room)
  reports!: Report[];
}
