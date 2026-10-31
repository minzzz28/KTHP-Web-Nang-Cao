import { DataSource, Repository } from 'typeorm';
import { Property } from '../../database/entities';
import { UserRole, UserStatus } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { PropertiesService } from './properties.service';

const landlord: AuthenticatedUser = {
  id: 8,
  username: 'landlord',
  email: 'landlord@example.test',
  fullName: 'Chủ trọ',
  role: UserRole.LANDLORD,
  status: UserStatus.ACTIVE,
};

describe('PropertiesService', () => {
  const propertiesRepository = { findAndCount: jest.fn(), findOne: jest.fn() };
  const dataSource = { transaction: jest.fn() };
  let service: PropertiesService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new PropertiesService(
      propertiesRepository as unknown as Repository<Property>,
      dataSource as unknown as DataSource,
    );
  });

  it('limits a landlord to properties they own', async () => {
    propertiesRepository.findAndCount.mockResolvedValue([[], 0]);

    await service.list(landlord, { landlordId: 99, page: 1, limit: 20 });

    expect(propertiesRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { landlordId: landlord.id }, take: 20 }),
    );
  });
});
