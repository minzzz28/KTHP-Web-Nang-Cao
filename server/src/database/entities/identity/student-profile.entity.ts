import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';

import { AuditedEntity } from '../base/audited.entity';
import { University } from '../location/university.entity';
import { User } from './user.entity';

@Entity({ name: 'student_profiles' })
@Index('student_profiles_user_id_key', ['userId'], { unique: true })
@Index('student_profiles_student_code_key', ['studentCode'], { unique: true })
@Index('student_profiles_school_email_key', ['schoolEmail'], { unique: true })
@Index('student_profiles_university_id_idx', ['universityId'])
export class StudentProfile extends AuditedEntity {
  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @Column({ name: 'student_code', type: 'varchar', length: 50, nullable: true })
  studentCode!: string | null;

  @Column({ name: 'university_id', type: 'int', nullable: true })
  universityId!: number | null;

  @Column({ name: 'school_email', type: 'varchar', length: 191, nullable: true })
  schoolEmail!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  faculty!: string | null;

  @Column({ name: 'academic_year', type: 'varchar', length: 30, nullable: true })
  academicYear!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  hometown!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @OneToOne(() => User, (user) => user.studentProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'student_profiles_user_id_fkey',
  })
  user!: User;

  @ManyToOne(() => University, (university) => university.studentProfiles, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'university_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'student_profiles_university_id_fkey',
  })
  university!: University | null;
}
