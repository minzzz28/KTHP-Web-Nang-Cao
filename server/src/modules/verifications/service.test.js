jest.mock('../../lib/prisma', () => ({
  prisma: {
    verificationRequest: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('../_shared/notifications', () => ({ createNotification: jest.fn() }));

const { prisma } = require('../../lib/prisma');
const { requestSchema } = require('./validator');
const service = require('./service');

describe('verification submission', () => {
  beforeEach(() => jest.clearAllMocks());

  test('creates a pending request and updates the account status atomically', async () => {
    const create = jest.fn().mockResolvedValue({ id: 41, status: 'PENDING' });
    const update = jest.fn().mockResolvedValue({ id: 9, verificationStatus: 'PENDING' });
    prisma.verificationRequest.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (operation) => operation({
      verificationRequest: { create },
      user: { update },
    }));

    const result = await service.submit(
      { id: 9, role: 'STUDENT' },
      { type: 'STUDENT', studentCode: 'SV-2026-009' },
    );

    expect(result).toEqual({ id: 41, status: 'PENDING' });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 9, type: 'STUDENT', studentCode: 'SV-2026-009', status: 'PENDING' }),
    }));
    expect(update).toHaveBeenCalledWith({ where: { id: 9 }, data: { verificationStatus: 'PENDING' } });
  });

  test('accepts only web links for submitted documents', () => {
    expect(requestSchema.parse({ type: 'LANDLORD', documentUrl: 'https://files.example.test/proof.pdf' }).documentUrl).toBe('https://files.example.test/proof.pdf');
    expect(() => requestSchema.parse({ type: 'LANDLORD', documentUrl: 'javascript:alert(1)' })).toThrow();
    expect(() => requestSchema.parse({ type: 'LANDLORD', documentUrl: 'ftp://files.example.test/proof.pdf' })).toThrow();
  });
});
