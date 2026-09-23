import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';

import { AuditedEntity } from '../base/audited.entity';
import { User } from './user.entity';

@Entity({ name: 'landlord_profiles' })
@Index('landlord_profiles_user_id_key', ['userId'], { unique: true })
@Index('landlord_profiles_national_id_key', ['nationalId'], { unique: true })
export class LandlordProfile extends AuditedEntity {
  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @Column({ name: 'business_name', type: 'varchar', length: 191, nullable: true })
  businessName!: string | null;

  @Column({ name: 'national_id', type: 'varchar', length: 32, nullable: true })
  nationalId!: string | null;

  @Column({
    name: 'contact_address',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  contactAddress!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @OneToOne(() => User, (user) => user.landlordProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'landlord_profiles_user_id_fkey',
  })
  user!: User;
}
