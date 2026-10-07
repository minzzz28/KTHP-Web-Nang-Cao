import {
  Column,
  Entity,
  Index,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';

import {
  UserRole,
  UserStatus,
  VerificationStatus,
} from '../../enums/domain.enums';
import { AuditedEntity } from '../base/audited.entity';
import { Favorite } from '../listings/favorite.entity';
import { RoomPriceHistory } from '../listings/room-price-history.entity';
import { RoomView } from '../listings/room-view.entity';
import { Property } from '../location/property.entity';
import { ConversationMember } from '../chat/conversation-member.entity';
import { Message } from '../chat/message.entity';
import { Notification } from '../moderation/notification.entity';
import { Report } from '../moderation/report.entity';
import { Review } from '../moderation/review.entity';
import { Contract } from '../rental/contract.entity';
import { ContractTenant } from '../rental/contract-tenant.entity';
import { ViewingAppointment } from '../rental/viewing-appointment.entity';
import { GroupMember } from '../social/group-member.entity';
import { RentalGroup } from '../social/rental-group.entity';
import { RoommatePost } from '../social/roommate-post.entity';
import { RoommateProfile } from '../social/roommate-profile.entity';
import { RoommateRequest } from '../social/roommate-request.entity';
import { LandlordProfile } from './landlord-profile.entity';
import { StudentProfile } from './student-profile.entity';
import { VerificationRequest } from './verification-request.entity';

@Entity({ name: 'users' })
@Index('users_username_key', ['username'], { unique: true })
@Index('users_email_key', ['email'], { unique: true })
@Index('users_phone_key', ['phone'], { unique: true })
@Index('users_role_status_idx', ['role', 'status'])
@Index('users_verification_status_idx', ['verificationStatus'])
export class User extends AuditedEntity {
  @Column({ type: 'varchar', length: 30, nullable: true })
  username!: string | null;

  @Column({ type: 'varchar', length: 191, nullable: true })
  email!: string | null;

  @Exclude()
  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 120 })
  fullName!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.UNVERIFIED,
  })
  verificationStatus!: VerificationStatus;

  @OneToOne(() => StudentProfile, (profile) => profile.user)
  studentProfile?: StudentProfile;

  @OneToOne(() => LandlordProfile, (profile) => profile.user)
  landlordProfile?: LandlordProfile;

  @OneToMany(() => VerificationRequest, (request) => request.user)
  verificationRequests!: VerificationRequest[];

  @OneToMany(() => VerificationRequest, (request) => request.reviewedBy)
  reviewedVerificationRequests!: VerificationRequest[];

  @OneToMany(() => Property, (property) => property.landlord)
  properties!: Property[];

  @OneToMany(() => Favorite, (favorite) => favorite.student)
  favorites!: Favorite[];

  @OneToMany(() => RoomView, (view) => view.viewer)
  roomViews!: RoomView[];

  @OneToOne(() => RoommateProfile, (profile) => profile.student)
  roommateProfile?: RoommateProfile;

  @OneToMany(() => RoommatePost, (post) => post.student)
  roommatePosts!: RoommatePost[];

  @OneToMany(() => RoommateRequest, (request) => request.sender)
  sentRoommateRequests!: RoommateRequest[];

  @OneToMany(() => RoommateRequest, (request) => request.recipient)
  receivedRoommateRequests!: RoommateRequest[];

  @OneToMany(() => RentalGroup, (group) => group.creator)
  createdRentalGroups!: RentalGroup[];

  @OneToMany(() => GroupMember, (membership) => membership.student)
  groupMemberships!: GroupMember[];

  @OneToMany(() => ConversationMember, (membership) => membership.user)
  conversationMemberships!: ConversationMember[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages!: Message[];

  @OneToMany(() => ViewingAppointment, (appointment) => appointment.student)
  requestedAppointments!: ViewingAppointment[];

  @OneToMany(() => ViewingAppointment, (appointment) => appointment.landlord)
  managedAppointments!: ViewingAppointment[];

  @OneToMany(() => Contract, (contract) => contract.landlord)
  landlordContracts!: Contract[];

  @OneToMany(() => ContractTenant, (tenancy) => tenancy.student)
  contractTenancies!: ContractTenant[];

  @OneToMany(() => Review, (review) => review.student)
  authoredReviews!: Review[];

  @OneToMany(() => Review, (review) => review.landlord)
  landlordReviews!: Review[];

  @OneToMany(() => Review, (review) => review.moderatedBy)
  moderatedReviews!: Review[];

  @OneToMany(() => Report, (report) => report.reporter)
  reportsFiled!: Report[];

  @OneToMany(() => Report, (report) => report.targetUser)
  reportsAgainst!: Report[];

  @OneToMany(() => Report, (report) => report.reviewedBy)
  reportsReviewed!: Report[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications!: Notification[];

  @OneToMany(() => RoomPriceHistory, (history) => history.changedBy)
  roomPriceChanges!: RoomPriceHistory[];
}
