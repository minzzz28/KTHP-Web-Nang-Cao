import { presentPublicUserSummary } from '../../common/presenters/user.presenter';
import { ContractTenant, User } from '../../database/entities';

function presentStudent(user: User) {
  const summary = presentPublicUserSummary(user);
  return {
    ...summary,
    studentProfile: user.studentProfile
      ? {
          faculty: user.studentProfile.faculty,
          academicYear: user.studentProfile.academicYear,
        }
      : null,
    // The current client accepts either student data directly or at `.user`.
    // Retain the legacy shape while making the nested object an explicit,
    // non-sensitive projection instead of the original entity.
    user: { ...summary },
  };
}

/** A candidate row used by the landlord's contract-creation form. */
export function presentTenantCandidate(student: User) {
  return {
    id: student.id,
    studentId: student.id,
    student: presentStudent(student),
  };
}

/** A tenant row restricted to the landlord who manages its contract. */
export function presentTenant(tenant: ContractTenant) {
  return {
    id: tenant.id,
    contractId: tenant.contractId,
    studentId: tenant.studentId,
    isPrimaryTenant: tenant.isPrimaryTenant,
    moveInDate: tenant.moveInDate,
    moveOutDate: tenant.moveOutDate,
    signedAt: tenant.signedAt,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
    student: tenant.student ? presentStudent(tenant.student) : null,
    contract: tenant.contract
      ? {
          id: tenant.contract.id,
          contractNumber: tenant.contract.contractNumber,
          startDate: tenant.contract.startDate,
          endDate: tenant.contract.endDate,
          status: tenant.contract.status,
          room: tenant.contract.room
            ? {
                id: tenant.contract.room.id,
                name: tenant.contract.room.name,
                code: tenant.contract.room.code,
              }
            : null,
        }
      : null,
    // Legacy client alias retained during the NestJS migration.
    room: tenant.contract?.room
      ? {
          id: tenant.contract.room.id,
          name: tenant.contract.room.name,
          code: tenant.contract.room.code,
        }
      : null,
  };
}
