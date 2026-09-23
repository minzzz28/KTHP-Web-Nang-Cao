import { Column, Entity, Index, OneToMany } from 'typeorm';

import { AuditedEntity } from '../base/audited.entity';
import { StudentProfile } from '../identity/student-profile.entity';
import { RoommateProfile } from '../social/roommate-profile.entity';

@Entity({ name: 'universities' })
@Index('universities_code_key', ['code'], { unique: true })
@Index('universities_name_key', ['name'], { unique: true })
@Index('universities_latitude_longitude_idx', ['latitude', 'longitude'])
export class University extends AuditedEntity {
  @Column({ type: 'varchar', length: 30 })
  code!: string;

  @Column({ type: 'varchar', length: 191 })
  name!: string;

  @Column({ type: 'varchar', length: 500 })
  address!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website!: string | null;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @OneToMany(() => StudentProfile, (profile) => profile.university)
  studentProfiles!: StudentProfile[];

  @OneToMany(() => RoommateProfile, (profile) => profile.university)
  roommateProfiles!: RoommateProfile[];
}
