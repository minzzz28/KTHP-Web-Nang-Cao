import { ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { NearbyPlace, Room, RoomImage, RoomPriceHistory, University } from '../../database/entities';
import { RoomStatus, UserRole, UserStatus } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { hasExpectedImageSignature, uploadedRoomImageUrl, type UploadedRoomImage } from './room-image-upload';
import { RoomsService } from './rooms.service';

const landlord: AuthenticatedUser = { id: 9, username: 'owner', email: 'owner@example.test', fullName: 'Chủ trọ', role: UserRole.LANDLORD, status: UserStatus.ACTIVE };

describe('room image upload safeguards', () => {
  it('recognizes only expected image file signatures', () => {
    expect(hasExpectedImageSignature('image/png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
    expect(hasExpectedImageSignature('image/png', Buffer.from('<script>'))).toBe(false);
    expect(hasExpectedImageSignature('image/jpeg', Buffer.from([0xff, 0xd8, 0xff]))).toBe(true);
  });

  it('never builds a public URL from an arbitrary client filename', () => {
    expect(() => uploadedRoomImageUrl({ filename: '../secret.png', mimetype: 'image/png', size: 1 }))
      .toThrow(UnprocessableEntityException);
  });

  it('checks room ownership before touching uploaded content', async () => {
    const rooms = { findOne: jest.fn().mockResolvedValue({ id: 5, status: RoomStatus.AVAILABLE, property: { landlordId: 12 } }) };
    const roomImages = { create: jest.fn(), find: jest.fn(), save: jest.fn() };
    const repositories = new Map<unknown, unknown>([[Room, rooms], [RoomImage, roomImages]]);
    const manager = { getRepository: jest.fn((entity: unknown) => repositories.get(entity)) };
    const transaction = jest.fn(async (work: (value: typeof manager) => Promise<unknown>) => work(manager));
    const service = new RoomsService(
      rooms as unknown as Repository<Room>,
      {} as Repository<University>,
      {} as Repository<RoomPriceHistory>,
      {} as Repository<NearbyPlace>,
      { transaction } as unknown as DataSource,
    );
    const forgedFile: UploadedRoomImage = { filename: '../not-read.png', mimetype: 'image/png', size: 1 };

    await expect(service.uploadImages(landlord, 5, [forgedFile])).rejects.toBeInstanceOf(ForbiddenException);
    expect(roomImages.find).not.toHaveBeenCalled();
    expect(roomImages.save).not.toHaveBeenCalled();
  });

  it('rejects too many files before entering a database transaction', async () => {
    const service = new RoomsService(
      {} as Repository<Room>, {} as Repository<University>, {} as Repository<RoomPriceHistory>, {} as Repository<NearbyPlace>,
      { transaction: jest.fn() } as unknown as DataSource,
    );
    const files = Array.from({ length: 9 }, (_, index) => ({ filename: `${index}.png`, mimetype: 'image/png', size: 1 }));

    await expect(service.uploadImages(landlord, 5, files)).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
