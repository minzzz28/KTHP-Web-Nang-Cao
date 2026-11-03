import { DataSource, Repository } from 'typeorm';
import { RoommatePost } from '../../database/entities';
import { RoommatePostsService } from './roommate-posts.service';

describe('RoommatePostsService', () => {
  it('rejects an invalid budget range before querying data', async () => {
    const postsRepository = { createQueryBuilder: jest.fn() };
    const service = new RoommatePostsService(
      postsRepository as unknown as Repository<RoommatePost>,
      {} as DataSource,
    );

    await expect(
      service.list({
        minBudget: 3_000_000,
        maxBudget: 2_000_000,
        page: 1,
        limit: 12,
      }),
    ).rejects.toThrow('Ngân sách tối đa không hợp lệ');
    expect(postsRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('binds a search term as a query parameter rather than SQL text', async () => {
    const builder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    const postsRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(builder),
    };
    const service = new RoommatePostsService(
      postsRepository as unknown as Repository<RoommatePost>,
      {} as DataSource,
    );

    await service.list({ keyword: "x' OR 1=1 --", page: 1, limit: 12 });

    expect(builder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('post.title LIKE :keyword'),
      { keyword: "%x' OR 1=1 --%" },
    );
  });
});
