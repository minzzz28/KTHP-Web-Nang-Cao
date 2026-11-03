import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { presentPublicUserSummary } from '../../common/presenters/user.presenter';
import { Room, RoommatePost } from '../../database/entities';
import { RoomStatus, RoommatePostStatus, UserRole } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CreateRoommatePostDto } from './dto/create-roommate-post.dto';
import { ListRoommatePostsQueryDto } from './dto/list-roommate-posts-query.dto';
import { UpdateRoommatePostDto } from './dto/update-roommate-post.dto';

export interface RoommatePostListResult {
  data: { items: ReturnType<typeof presentRoommatePost>[] };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class RoommatePostsService {
  constructor(
    @InjectRepository(RoommatePost)
    private readonly posts: Repository<RoommatePost>,
    private readonly dataSource: DataSource,
  ) {}

  async list(
    query: ListRoommatePostsQueryDto,
  ): Promise<RoommatePostListResult> {
    this.assertBudgetRange(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const builder = this.withPublicRelations(
      this.posts.createQueryBuilder('post'),
    ).where('post.status = :status', {
      status: query.status ?? RoommatePostStatus.OPEN,
    });

    this.applyFilters(builder, query);
    const [items, total] = await builder
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return this.toListResult(items, page, limit, total);
  }

  async mine(
    studentId: number,
    query: ListRoommatePostsQueryDto,
  ): Promise<RoommatePostListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const [items, total] = await this.withPublicRelations(
      this.posts.createQueryBuilder('post'),
    )
      .where('post.studentId = :studentId', { studentId })
      .orderBy('post.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return this.toListResult(items, page, limit, total);
  }

  async findById(id: number) {
    const post = await this.withPublicRelations(
      this.posts.createQueryBuilder('post'),
    )
      .where('post.id = :id', { id })
      .getOne();

    if (!post || post.status === RoommatePostStatus.ARCHIVED) {
      throw new NotFoundException('Không tìm thấy bài đăng');
    }

    return presentRoommatePost(post);
  }

  async create(actor: AuthenticatedUser, input: CreateRoommatePostDto) {
    this.requireStudent(actor);
    const postId = await this.dataSource.transaction(async (manager) => {
      const posts = manager.getRepository(RoommatePost);
      if (input.roomId !== undefined && input.roomId !== null) {
        await this.requireVisibleRoom(manager, input.roomId);
      }
      const post = await posts.save(posts.create({
        studentId: actor.id,
        roomId: input.roomId ?? null,
        title: input.title,
        content: input.content,
        area: input.area ?? null,
        budgetPerPerson: String(input.budgetPerPerson),
        neededPeople: input.neededPeople,
        preferredGender: input.preferredGender ?? null,
        moveInDate: input.moveInDate ?? null,
        requirements: input.requirements ?? null,
        status: RoommatePostStatus.OPEN,
      }));
      return post.id;
    });
    return presentRoommatePost(await this.loadFull(postId));
  }

  async update(actor: AuthenticatedUser, postId: number, input: UpdateRoommatePostDto) {
    this.requireStudent(actor);
    const values = this.updateValues(input);
    if (!Object.keys(values).length) throw new UnprocessableEntityException('Cần có dữ liệu cập nhật');
    const id = await this.dataSource.transaction(async (manager) => {
      const posts = manager.getRepository(RoommatePost);
      const post = await this.requireOwnedPost(posts, actor, postId);
      if (post.status === RoommatePostStatus.ARCHIVED) throw new ConflictException('Bài đăng đã được lưu trữ');
      if (input.roomId !== undefined && input.roomId !== null) await this.requireVisibleRoom(manager, input.roomId);
      const result = await posts.update({ id: post.id }, values);
      if (!result.affected) throw new ConflictException('Bài đăng đã thay đổi, vui lòng tải lại');
      return post.id;
    });
    return presentRoommatePost(await this.loadFull(id));
  }

  async close(actor: AuthenticatedUser, postId: number) {
    this.requireStudent(actor);
    return this.dataSource.transaction(async (manager) => {
      const posts = manager.getRepository(RoommatePost);
      const post = await this.requireOwnedPost(posts, actor, postId);
      if (post.status === RoommatePostStatus.ARCHIVED) throw new ConflictException('Bài đăng đã được lưu trữ');
      if (post.status !== RoommatePostStatus.CLOSED) {
        const result = await posts.update({ id: post.id }, { status: RoommatePostStatus.CLOSED });
        if (!result.affected) throw new ConflictException('Bài đăng đã thay đổi, vui lòng tải lại');
      }
      return { id: post.id, status: RoommatePostStatus.CLOSED };
    });
  }

  async archive(actor: AuthenticatedUser, postId: number) {
    this.requireStudent(actor);
    return this.dataSource.transaction(async (manager) => {
      const posts = manager.getRepository(RoommatePost);
      const post = await this.requireOwnedPost(posts, actor, postId);
      if (post.status !== RoommatePostStatus.ARCHIVED) {
        const result = await posts.update({ id: post.id }, { status: RoommatePostStatus.ARCHIVED });
        if (!result.affected) throw new ConflictException('Bài đăng đã thay đổi, vui lòng tải lại');
      }
      return { id: post.id, status: RoommatePostStatus.ARCHIVED };
    });
  }

  private withPublicRelations(
    builder: SelectQueryBuilder<RoommatePost>,
  ): SelectQueryBuilder<RoommatePost> {
    return builder
      .leftJoinAndSelect('post.student', 'student')
      .leftJoinAndSelect('student.studentProfile', 'studentProfile')
      .leftJoinAndSelect('studentProfile.university', 'university')
      .leftJoinAndSelect('post.room', 'room')
      .leftJoinAndSelect('room.property', 'property');
  }

  private async loadFull(postId: number): Promise<RoommatePost> {
    const post = await this.posts.findOne({
      where: { id: postId },
      relations: { student: { studentProfile: { university: true } }, room: { property: true } },
    });
    if (!post) throw new NotFoundException('Không tìm thấy bài đăng');
    return post;
  }

  private requireStudent(actor: AuthenticatedUser): void {
    if (actor.role !== UserRole.STUDENT) throw new ForbiddenException('Chỉ sinh viên có thể quản lý bài tìm người ở ghép');
  }

  private async requireOwnedPost(repository: Repository<RoommatePost>, actor: AuthenticatedUser, postId: number): Promise<RoommatePost> {
    const post = await repository.findOne({ where: { id: postId }, lock: { mode: 'pessimistic_write' } });
    if (!post) throw new NotFoundException('Không tìm thấy bài đăng');
    if (post.studentId !== actor.id) throw new ForbiddenException('Bạn không có quyền thao tác bài đăng này');
    return post;
  }

  private async requireVisibleRoom(manager: EntityManager, roomId: number): Promise<void> {
    const room = await manager.getRepository(Room).findOne({ where: { id: roomId }, lock: { mode: 'pessimistic_read' } });
    if (!room || room.status === RoomStatus.HIDDEN) throw new NotFoundException('Không tìm thấy phòng được chọn');
  }

  private updateValues(input: UpdateRoommatePostDto): Partial<RoommatePost> {
    const values: Partial<RoommatePost> = {};
    if (input.roomId !== undefined) values.roomId = input.roomId;
    if (input.title !== undefined) values.title = input.title;
    if (input.content !== undefined) values.content = input.content;
    if (input.area !== undefined) values.area = input.area;
    if (input.budgetPerPerson !== undefined) values.budgetPerPerson = String(input.budgetPerPerson);
    if (input.neededPeople !== undefined) values.neededPeople = input.neededPeople;
    if (input.preferredGender !== undefined) values.preferredGender = input.preferredGender;
    if (input.moveInDate !== undefined) values.moveInDate = input.moveInDate;
    if (input.requirements !== undefined) values.requirements = input.requirements;
    return values;
  }

  private applyFilters(
    builder: SelectQueryBuilder<RoommatePost>,
    query: ListRoommatePostsQueryDto,
  ): void {
    if (query.area) {
      builder.andWhere('post.area LIKE :area', { area: `%${query.area}%` });
    }
    if (query.keyword) {
      builder.andWhere(
        '(post.title LIKE :keyword OR post.content LIKE :keyword OR post.area LIKE :keyword OR student.fullName LIKE :keyword)',
        { keyword: `%${query.keyword}%` },
      );
    }
    if (query.preferredGender) {
      builder.andWhere('post.preferredGender = :preferredGender', {
        preferredGender: query.preferredGender,
      });
    }
    if (query.minBudget !== undefined) {
      builder.andWhere('post.budgetPerPerson >= :minBudget', {
        minBudget: query.minBudget,
      });
    }
    if (query.maxBudget !== undefined) {
      builder.andWhere('post.budgetPerPerson <= :maxBudget', {
        maxBudget: query.maxBudget,
      });
    }
  }

  private assertBudgetRange(query: ListRoommatePostsQueryDto): void {
    if (
      query.minBudget !== undefined &&
      query.maxBudget !== undefined &&
      query.minBudget > query.maxBudget
    ) {
      throw new UnprocessableEntityException('Ngân sách tối đa không hợp lệ');
    }
  }

  private toListResult(
    items: RoommatePost[],
    page: number,
    limit: number,
    total: number,
  ): RoommatePostListResult {
    return {
      data: { items: items.map(presentRoommatePost) },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}

export function presentRoommatePost(post: RoommatePost) {
  const studentProfile = post.student?.studentProfile;
  const university = studentProfile?.university;

  return {
    id: post.id,
    studentId: post.studentId,
    roomId: post.roomId,
    title: post.title,
    content: post.content,
    area: post.area,
    budgetPerPerson: post.budgetPerPerson,
    neededPeople: post.neededPeople,
    preferredGender: post.preferredGender,
    moveInDate: post.moveInDate,
    requirements: post.requirements,
    status: post.status,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    student: post.student
      ? {
          ...presentPublicUserSummary(post.student),
          university: university
            ? { id: university.id, code: university.code, name: university.name }
            : null,
        }
      : null,
    room: post.room
      ? {
          id: post.room.id,
          code: post.room.code,
          name: post.room.name,
          price: post.room.price,
          status: post.room.status,
          property: post.room.property
            ? {
                id: post.room.property.id,
                name: post.room.property.name,
                address: post.room.property.address,
              }
            : null,
        }
      : null,
  };
}
