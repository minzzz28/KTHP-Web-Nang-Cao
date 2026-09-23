jest.mock('../../lib/prisma', () => ({
  prisma: {
    property: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('../_shared/notifications', () => ({ createNotification: jest.fn() }));

const { prisma } = require('../../lib/prisma');
const { createNotification } = require('../_shared/notifications');
const { propertyVerificationSchema } = require('./validator');
const service = require('./service');

describe('admin property verification', () => {
  beforeEach(() => jest.clearAllMocks());

  test('allows an admin to verify a pending property and notifies its landlord', async () => {
    const property = { id: 17, name: 'Khu trọ An Bình', landlordId: 6, verificationStatus: 'PENDING' };
    const updated = { ...property, verificationStatus: 'VERIFIED', landlord: { id: 6, fullName: 'Chủ trọ' } };
    prisma.property.findUnique
      .mockResolvedValueOnce(property)
      .mockResolvedValueOnce(updated);
    prisma.property.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.setPropertyVerification({ id: 1, role: 'ADMIN' }, '17', { status: 'VERIFIED' }))
      .resolves.toEqual(updated);

    expect(prisma.property.updateMany).toHaveBeenCalledWith({
      where: { id: 17, verificationStatus: { in: ['UNVERIFIED', 'PENDING'] } },
      data: { verificationStatus: 'VERIFIED' },
    });
    expect(createNotification).toHaveBeenCalledWith(6, expect.objectContaining({
      type: 'VERIFICATION',
      title: 'Khu trọ đã được xác minh',
      linkUrl: '/landlord/properties',
    }));
  });

  test('rejects a non-admin before accessing the property', async () => {
    await expect(service.setPropertyVerification({ id: 2, role: 'LANDLORD' }, '17', { status: 'VERIFIED' }))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(prisma.property.findUnique).not.toHaveBeenCalled();
  });

  test('does not reprocess a property that has already been reviewed', async () => {
    prisma.property.findUnique.mockResolvedValue({ id: 17, name: 'Khu trọ An Bình', landlordId: 6, verificationStatus: 'VERIFIED' });

    await expect(service.setPropertyVerification({ id: 1, role: 'ADMIN' }, '17', { status: 'REJECTED' }))
      .rejects.toMatchObject({ statusCode: 409 });
    expect(prisma.property.updateMany).not.toHaveBeenCalled();
  });

  test('only accepts terminal review statuses and a valid property id', async () => {
    expect(propertyVerificationSchema.safeParse({ status: 'VERIFIED' }).success).toBe(true);
    expect(propertyVerificationSchema.safeParse({ status: 'PENDING' }).success).toBe(false);
    expect(propertyVerificationSchema.safeParse({ status: 'VERIFIED', reason: 'extra field' }).success).toBe(false);

    await expect(service.setPropertyVerification({ id: 1, role: 'ADMIN' }, 'not-a-number', { status: 'VERIFIED' }))
      .rejects.toMatchObject({ statusCode: 422 });
  });
});
