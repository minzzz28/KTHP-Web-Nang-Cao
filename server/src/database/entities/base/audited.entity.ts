import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Shared auto-incrementing primary key for entities backed by an `id` column. */
export abstract class AbstractIdEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;
}

/** For tables that only record their creation time. */
export abstract class CreatedEntity extends AbstractIdEntity {
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date;
}

/** For mutable domain records that retain both creation and update timestamps. */
export abstract class AuditedEntity extends CreatedEntity {
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date;
}
