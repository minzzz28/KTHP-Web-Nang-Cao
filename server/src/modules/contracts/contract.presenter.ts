import { presentPublicUserSummary } from '../../common/presenters/user.presenter';
import { Contract, ContractTenant } from '../../database/entities';

function presentTenant(tenant: ContractTenant) {
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
    student: tenant.student ? presentPublicUserSummary(tenant.student) : null,
  };
}

function dateSortValue(value: Date | string | null | undefined): number {
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value ?? '');
  return Number.isFinite(timestamp) ? timestamp : 0;
}

/** Projects contract relationships without serializing private user fields. */
export function presentContract(contract: Contract) {
  const tenants = [...(contract.tenants ?? [])].sort(
    (left, right) =>
      Number(right.isPrimaryTenant) - Number(left.isPrimaryTenant) ||
      left.id - right.id,
  );
  const invoices = [...(contract.invoices ?? [])].sort(
    (left, right) =>
      dateSortValue(right.periodEnd) - dateSortValue(left.periodEnd) ||
      right.id - left.id,
  );

  return {
    id: contract.id,
    contractNumber: contract.contractNumber,
    roomId: contract.roomId,
    landlordId: contract.landlordId,
    startDate: contract.startDate,
    endDate: contract.endDate,
    rent: contract.rent,
    deposit: contract.deposit,
    terms: contract.terms,
    status: contract.status,
    signedAt: contract.signedAt,
    terminatedAt: contract.terminatedAt,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
    room: contract.room
      ? {
          id: contract.room.id,
          name: contract.room.name,
          code: contract.room.code,
          capacity: contract.room.capacity,
          availableSlots: contract.room.availableSlots,
          property: contract.room.property
            ? {
                id: contract.room.property.id,
                name: contract.room.property.name,
                address: contract.room.property.address,
              }
            : null,
        }
      : null,
    landlord: contract.landlord
      ? presentPublicUserSummary(contract.landlord)
      : null,
    tenants: tenants.map(presentTenant),
    invoices: invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      dueDate: invoice.dueDate,
    })),
  };
}
