const { prisma } = require('../../lib/prisma');
const { AppError } = require('../../utils/AppError');
const { listOptions, listData } = require('../_shared/common');

const tenantUserSelect = {
  id: true,
  username: true,
  email: true,
  fullName: true,
  phone: true,
  avatarUrl: true,
  verificationStatus: true,
  studentProfile: { select: { studentCode: true, faculty: true, academicYear: true } }
};

function requireLandlordOrAdmin(user) {
  if (!user || !['LANDLORD', 'ADMIN'].includes(user.role)) throw new AppError('Chỉ chủ trọ hoặc quản trị viên có thể xem người thuê', 403);
}

function compatibilityStudent(student) {
  return { ...student, user: student };
}

async function listCandidates(query) {
  const pagination = listOptions(query);
  const where = { role: 'STUDENT', status: 'ACTIVE' };
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({ where, select: tenantUserSelect, orderBy: { createdAt: 'desc' }, skip: pagination.skip, take: pagination.limit }),
    prisma.user.count({ where })
  ]);
  return listData(items.map((student) => ({ id: student.id, studentId: student.id, student: compatibilityStudent(student) })), pagination, total);
}

async function listTenants(user, query) {
  requireLandlordOrAdmin(user);
  if (query.candidates) return listCandidates(query);
  const pagination = listOptions(query);
  const where = {
    contract: {
      is: user.role === 'ADMIN' ? {} : { landlordId: user.id }
    }
  };
  const [items, total] = await prisma.$transaction([
    prisma.contractTenant.findMany({
      where,
      select: {
        id: true,
        studentId: true,
        isPrimaryTenant: true,
        moveInDate: true,
        moveOutDate: true,
        student: { select: tenantUserSelect },
        contract: { select: { id: true, contractNumber: true, startDate: true, endDate: true, status: true, room: { select: { id: true, name: true, code: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit
    }),
    prisma.contractTenant.count({ where })
  ]);
  return listData(items.map((tenant) => ({ ...tenant, student: compatibilityStudent(tenant.student), room: tenant.contract.room })), pagination, total);
}

module.exports = { listTenants };
