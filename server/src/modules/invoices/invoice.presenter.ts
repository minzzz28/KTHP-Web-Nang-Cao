import { presentPublicUserSummary } from '../../common/presenters/user.presenter';
import { Invoice } from '../../database/entities';

/** Projects invoices and their relationships without exposing private users. */
export function presentInvoice(invoice: Invoice) {
  const tenants = [...(invoice.contract?.tenants ?? [])].sort(
    (left, right) =>
      Number(right.isPrimaryTenant) - Number(left.isPrimaryTenant) ||
      left.id - right.id,
  );
  const items = [...(invoice.items ?? [])].sort((left, right) => left.id - right.id);

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    contractId: invoice.contractId,
    periodStart: invoice.periodStart,
    periodEnd: invoice.periodEnd,
    dueDate: invoice.dueDate,
    electricityStart: invoice.electricityStart,
    electricityEnd: invoice.electricityEnd,
    electricityUsage: invoice.electricityUsage,
    electricityUnitPrice: invoice.electricityUnitPrice,
    electricityAmount: invoice.electricityAmount,
    waterStart: invoice.waterStart,
    waterEnd: invoice.waterEnd,
    waterUsage: invoice.waterUsage,
    waterUnitPrice: invoice.waterUnitPrice,
    waterAmount: invoice.waterAmount,
    rentAmount: invoice.rentAmount,
    internetAmount: invoice.internetAmount,
    parkingAmount: invoice.parkingAmount,
    serviceAmount: invoice.serviceAmount,
    otherAmount: invoice.otherAmount,
    totalAmount: invoice.totalAmount,
    status: invoice.status,
    issuedAt: invoice.issuedAt,
    paidAt: invoice.paidAt,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    contract: invoice.contract
      ? {
          id: invoice.contract.id,
          contractNumber: invoice.contract.contractNumber,
          room: invoice.contract.room
            ? {
                id: invoice.contract.room.id,
                name: invoice.contract.room.name,
                code: invoice.contract.room.code,
                property: invoice.contract.room.property
                  ? {
                      name: invoice.contract.room.property.name,
                      address: invoice.contract.room.property.address,
                    }
                  : null,
              }
            : null,
          landlord: invoice.contract.landlord
            ? presentPublicUserSummary(invoice.contract.landlord)
            : null,
          tenants: tenants.map((tenant) => ({
            id: tenant.id,
            contractId: tenant.contractId,
            studentId: tenant.studentId,
            isPrimaryTenant: tenant.isPrimaryTenant,
            moveInDate: tenant.moveInDate,
            moveOutDate: tenant.moveOutDate,
            signedAt: tenant.signedAt,
            createdAt: tenant.createdAt,
            updatedAt: tenant.updatedAt,
            student: tenant.student
              ? presentPublicUserSummary(tenant.student)
              : null,
          })),
        }
      : null,
    items: items.map((item) => ({
      id: item.id,
      invoiceId: item.invoiceId,
      type: item.type,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
      createdAt: item.createdAt,
    })),
  };
}
