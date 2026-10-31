import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { StudentProfile } from '../../database/entities/identity/student-profile.entity';
import { University } from '../../database/entities/location/university.entity';
import { RoommateProfile } from '../../database/entities/social/roommate-profile.entity';
import { UniversitiesService } from './universities.service';

describe('UniversitiesService', () => {
  const university = { id: 1, name: 'Đại học Phenikaa' } as University;
  const queryBuilder = {
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    where: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getManyAndCount: jest.fn(),
  };
  const repository = {
    createQueryBuilder: jest.fn(),
    findOneBy: jest.fn(),
  };
  const dataSource = { transaction: jest.fn() };
  const transactionUniversities = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  };
  const studentProfiles = { count: jest.fn() };
  const roommateProfiles = { count: jest.fn() };
  const manager = { getRepository: jest.fn() };
  let service: UniversitiesService;

  beforeEach(() => {
    jest.resetAllMocks();
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    queryBuilder.addOrderBy.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.skip.mockReturnValue(queryBuilder);
    queryBuilder.take.mockReturnValue(queryBuilder);
    repository.createQueryBuilder.mockReturnValue(queryBuilder);
    manager.getRepository.mockImplementation((entity: unknown) => {
      if (entity === University) return transactionUniversities;
      if (entity === StudentProfile) return studentProfiles;
      return roommateProfiles;
    });
    dataSource.transaction.mockImplementation(
      async (run: (entityManager: typeof manager) => Promise<unknown>) =>
        run(manager),
    );
    service = new UniversitiesService(
      repository as unknown as Repository<University>,
      dataSource as unknown as DataSource,
    );
  });

  it('binds the search term and returns legacy-compatible pagination', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[university], 13]);

    await expect(
      service.list({ q: "Phenikaa' OR 1=1 --", page: 2, limit: 5 }),
    ).resolves.toEqual({
      data: { items: [university] },
      meta: { page: 2, limit: 5, total: 13, totalPages: 3 },
    });

    expect(queryBuilder.where).toHaveBeenCalledWith(
      '(university.name LIKE :search OR university.code LIKE :search OR university.address LIKE :search)',
      { search: "%Phenikaa' OR 1=1 --%" },
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(5);
    expect(queryBuilder.take).toHaveBeenCalledWith(5);
  });

  it('returns a not-found error when an ID is absent', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(service.findById(404)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('makes a newly selected primary university clear the previous primary', async () => {
    const writeQueryBuilder = {
      update: jest.fn(),
      set: jest.fn(),
      execute: jest.fn(),
    };
    writeQueryBuilder.update.mockReturnValue(writeQueryBuilder);
    writeQueryBuilder.set.mockReturnValue(writeQueryBuilder);
    transactionUniversities.count.mockResolvedValue(2);
    transactionUniversities.createQueryBuilder.mockReturnValue(writeQueryBuilder);
    transactionUniversities.create.mockImplementation((input) => input);
    transactionUniversities.save.mockImplementation((input) => input);

    const result = await service.create({
      code: 'PKA',
      name: 'Đại học Phenikaa',
      address: 'Hà Nội',
      latitude: 20.1,
      longitude: 105.7,
      isPrimary: true,
    });

    expect(writeQueryBuilder.set).toHaveBeenCalledWith({ isPrimary: false });
    expect(result).toEqual(
      expect.objectContaining({
        code: 'PKA',
        latitude: '20.1',
        longitude: '105.7',
        isPrimary: true,
      }),
    );
  });

  it('does not let the only primary university lose that status', async () => {
    const countQueryBuilder = {
      where: jest.fn(),
      andWhere: jest.fn(),
      getCount: jest.fn(),
    };
    countQueryBuilder.where.mockReturnValue(countQueryBuilder);
    countQueryBuilder.andWhere.mockReturnValue(countQueryBuilder);
    countQueryBuilder.getCount.mockResolvedValue(0);
    transactionUniversities.findOneBy.mockResolvedValue({
      id: 1,
      isPrimary: true,
    });
    transactionUniversities.createQueryBuilder.mockReturnValue(countQueryBuilder);

    await expect(
      service.update(1, { isPrimary: false }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('does not delete a university still referenced by a profile', async () => {
    transactionUniversities.findOneBy.mockResolvedValue({
      id: 2,
      isPrimary: false,
    });
    studentProfiles.count.mockResolvedValue(1);
    roommateProfiles.count.mockResolvedValue(0);

    await expect(service.remove(2)).rejects.toBeInstanceOf(ConflictException);

    expect(transactionUniversities.delete).not.toHaveBeenCalled();
  });
});
