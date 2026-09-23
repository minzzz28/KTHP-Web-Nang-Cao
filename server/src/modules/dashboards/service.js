const { prisma } = require('../../lib/prisma');
const { AppError } = require('../../utils/AppError');
const { publicRoom } = require('../../utils/serializers');
const roomService = require('../rooms/service');
const { roomListInclude, publicUserSelect } = require('../_shared/selects');

const appointmentInclude = {
  room: { select: { id: true, name: true, code: true, property: { select: { name: true, address: true } } } },
  student: { select: publicUserSelect }
};

function requireRole(user, role) {
  if (!user || user.role !== role) throw new AppError('Bạn không có quyền xem bảng tổng quan này', 403);
}

async function student(user) {
  requireRole(user, 'STUDENT');
  const now = new Date();
  const [recommendations, favoriteCount, appointments, roommateRequests, unpaidInvoiceCount] = await Promise.all([
    roomService.recommendations(user, { limit: 4 }),
    prisma.favorite.count({ where: { studentId: user.id } }),
    prisma.viewingAppointment.findMany({
      where: { studentId: user.id, status: { in: ['PENDING', 'ACCEPTED', 'RESCHEDULED'] }, scheduledAt: { gte: now } },
      include: appointmentInclude,
      orderBy: { scheduledAt: 'asc' },
      take: 4
    }),
    prisma.roommateRequest.findMany({
      where: { recipientId: user.id, status: 'PENDING' },
      include: { sender: { select: publicUserSelect } },
      orderBy: { createdAt: 'desc' },
      take: 4
    }),
    prisma.invoice.count({
      where: { status: { in: ['UNPAID', 'OVERDUE'] }, contract: { is: { tenants: { some: { studentId: user.id } } } } }
    })
  ]);

  return {
    summary: {
      recommendations: recommendations.meta.total,
      favorites: favoriteCount,
      appointments: appointments.length,
      unpaidInvoices: unpaidInvoiceCount
    },
    recommendations: recommendations.data,
    upcomingAppointments: { items: appointments },
    roommateRequests: {
      items: roommateRequests.map((request) => ({
        ...request,
        sender: { ...request.sender, user: request.sender },
        receiver: { ...user, user }
      }))
    }
  };
}

async function landlord(user) {
  requireRole(user, 'LANDLORD');
  const propertyWhere = { property: { is: { landlordId: user.id } } };
  const [totalRooms, availableRooms, rentedRooms, pendingAppointments, unpaidInvoices, recentRooms, appointments] = await Promise.all([
    prisma.room.count({ where: propertyWhere }),
    prisma.room.count({ where: { ...propertyWhere, status: 'AVAILABLE', availableSlots: { gt: 0 } } }),
    prisma.room.count({ where: { ...propertyWhere, status: 'RENTED' } }),
    prisma.viewingAppointment.count({ where: { landlordId: user.id, status: 'PENDING' } }),
    prisma.invoice.count({ where: { status: { in: ['UNPAID', 'OVERDUE'] }, contract: { is: { landlordId: user.id } } } }),
    prisma.room.findMany({ where: propertyWhere, include: roomListInclude, orderBy: { updatedAt: 'desc' }, take: 6 }),
    prisma.viewingAppointment.findMany({
      where: { landlordId: user.id, status: { in: ['PENDING', 'ACCEPTED', 'RESCHEDULED'] } },
      include: appointmentInclude,
      orderBy: { scheduledAt: 'asc' },
      take: 5
    })
  ]);

  return {
    summary: { totalRooms, availableRooms, rentedRooms, pendingAppointments, unpaidInvoices },
    recentRooms: { items: recentRooms.map(publicRoom) },
    upcomingAppointments: { items: appointments }
  };
}

module.exports = { student, landlord };
