import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';

import { Gender, SocialPreference } from '../../enums/domain.enums';
import { AuditedEntity } from '../base/audited.entity';
import { User } from '../identity/user.entity';
import { University } from '../location/university.entity';

@Entity({ name: 'roommate_profiles' })
@Index('roommate_profiles_student_id_key', ['studentId'], { unique: true })
@Index('roommate_profiles_university_id_idx', ['universityId'])
@Index('roommate_profiles_is_visible_budget_min_budget_max_idx', [
  'isVisible',
  'budgetMin',
  'budgetMax',
])
export class RoommateProfile extends AuditedEntity {
  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @Column({ name: 'university_id', type: 'int', nullable: true })
  universityId!: number | null;

  @Column({ type: 'enum', enum: Gender })
  gender!: Gender;

  @Column({ type: 'varchar', length: 120, nullable: true })
  hometown!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  faculty!: string | null;

  @Column({ name: 'academic_year', type: 'varchar', length: 30, nullable: true })
  academicYear!: string | null;

  @Column({ name: 'budget_min', type: 'decimal', precision: 12, scale: 2 })
  budgetMin!: string;

  @Column({ name: 'budget_max', type: 'decimal', precision: 12, scale: 2 })
  budgetMax!: string;

  @Column({ name: 'preferred_area', type: 'varchar', length: 255, nullable: true })
  preferredArea!: string | null;

  @Column({
    name: 'max_distance_km',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  maxDistanceKm!: string | null;

  @Column({ name: 'is_smoking', type: 'boolean', default: false })
  isSmoking!: boolean;

  @Column({ name: 'accepts_smoking', type: 'boolean', default: false })
  acceptsSmoking!: boolean;

  @Column({ name: 'has_pets', type: 'boolean', default: false })
  hasPets!: boolean;

  @Column({ name: 'accepts_pets', type: 'boolean', default: false })
  acceptsPets!: boolean;

  @Column({ name: 'cooks_often', type: 'boolean', default: false })
  cooksOften!: boolean;

  @Column({ name: 'sleep_time', type: 'varchar', length: 5, nullable: true })
  sleepTime!: string | null;

  @Column({ name: 'wake_up_time', type: 'varchar', length: 5, nullable: true })
  wakeUpTime!: string | null;

  @Column({ name: 'cleanliness_level', type: 'int', default: 3 })
  cleanlinessLevel!: number;

  @Column({
    name: 'social_preference',
    type: 'enum',
    enum: SocialPreference,
    default: SocialPreference.BALANCED,
  })
  socialPreference!: SocialPreference;

  @Column({ name: 'preferred_roommates', type: 'int', default: 1 })
  preferredRoommates!: number;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ name: 'is_visible', type: 'boolean', default: true })
  isVisible!: boolean;

  // A OneToOne join column is unique, matching Prisma's `studentId @unique`.
  @OneToOne(() => User, (user) => user.roommateProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'student_id',
    foreignKeyConstraintName: 'roommate_profiles_student_id_fkey',
  })
  student!: User;

  @ManyToOne(() => University, (university) => university.roommateProfiles, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'university_id',
    foreignKeyConstraintName: 'roommate_profiles_university_id_fkey',
  })
  university!: University | null;
}
