import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { ViewingAppointmentStatus } from '../../enums/domain.enums';
import { AuditedEntity } from '../base/audited.entity';
import { User } from '../identity/user.entity';
import { Room } from '../listings/room.entity';

@Entity({ name: 'viewing_appointments' })
@Index('viewing_appointments_room_id_scheduled_at_idx', ['roomId', 'scheduledAt'])
@Index('viewing_appointments_landlord_id_status_scheduled_at_idx', [
  'landlordId',
  'status',
  'scheduledAt',
])
@Index('viewing_appointments_student_id_status_scheduled_at_idx', [
  'studentId',
  'status',
  'scheduledAt',
])
export class ViewingAppointment extends AuditedEntity {
  @Column({ name: 'room_id', type: 'int' })
  roomId!: number;

  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @Column({ name: 'landlord_id', type: 'int' })
  landlordId!: number;

  @Column({ name: 'scheduled_at', type: 'datetime', precision: 3 })
  scheduledAt!: Date;

  @Column({ name: 'proposed_at', type: 'datetime', precision: 3, nullable: true })
  proposedAt!: Date | null;

  @Column({
    type: 'enum',
    enum: ViewingAppointmentStatus,
    default: ViewingAppointmentStatus.PENDING,
  })
  status!: ViewingAppointmentStatus;

  @Column({ name: 'student_note', type: 'text', nullable: true })
  studentNote!: string | null;

  @Column({ name: 'landlord_note', type: 'text', nullable: true })
  landlordNote!: string | null;

  @Column({ name: 'responded_at', type: 'datetime', precision: 3, nullable: true })
  respondedAt!: Date | null;

  @Column({ name: 'cancelled_at', type: 'datetime', precision: 3, nullable: true })
  cancelledAt!: Date | null;

  @ManyToOne(() => Room, (room) => room.appointments, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'room_id',
    foreignKeyConstraintName: 'viewing_appointments_room_id_fkey',
  })
  room!: Room;

  @ManyToOne(() => User, (user) => user.requestedAppointments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'student_id',
    foreignKeyConstraintName: 'viewing_appointments_student_id_fkey',
  })
  student!: User;

  @ManyToOne(() => User, (user) => user.managedAppointments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'landlord_id',
    foreignKeyConstraintName: 'viewing_appointments_landlord_id_fkey',
  })
  landlord!: User;
}
