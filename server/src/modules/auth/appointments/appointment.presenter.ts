import { presentPublicUserSummary } from '../../common/presenters/user.presenter';
import { ViewingAppointment } from '../../database/entities';

/** Explicitly project all account relations before returning an appointment. */
export function presentAppointment(appointment: ViewingAppointment) {
  return {
    id: appointment.id,
    roomId: appointment.roomId,
    studentId: appointment.studentId,
    landlordId: appointment.landlordId,
    scheduledAt: appointment.scheduledAt,
    proposedAt: appointment.proposedAt,
    status: appointment.status,
    studentNote: appointment.studentNote,
    landlordNote: appointment.landlordNote,
    // Existing resource tables render `note`; retain the source fields above
    // while making their visible value work without a client-only workaround.
    note: appointment.studentNote ?? appointment.landlordNote,
    respondedAt: appointment.respondedAt,
    cancelledAt: appointment.cancelledAt,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
    room: appointment.room
      ? {
          id: appointment.room.id,
          name: appointment.room.name,
          code: appointment.room.code,
          property: appointment.room.property
            ? {
                id: appointment.room.property.id,
                name: appointment.room.property.name,
                address: appointment.room.property.address,
              }
            : null,
        }
      : null,
    student: appointment.student
      ? presentPublicUserSummary(appointment.student)
      : null,
    landlord: appointment.landlord
      ? presentPublicUserSummary(appointment.landlord)
      : null,
  };
}
