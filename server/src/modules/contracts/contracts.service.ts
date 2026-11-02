import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  In,
  MoreThanOrEqual,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { randomUUID } from 'node:crypto';
import {
  Contract,
  ContractTenant,
  Notification,
  Room,
  User,
} from '../../database/entities';
import {
  ContractStatus,
  NotificationType,
  RoomStatus,
  UserRole,
  UserStatus,
} from '../../database/enums/domain.enums';
import { presentContract } from './contract.presenter';
import { ContractTenantInputDto } from './dto/contract-tenant-input.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { ListContractsQueryDto } from './dto/list-contracts-query.dto';
import { TransitionContractDto } from './dto/transition-contract.dto';

export type ContractActor = {
  id: number;
  fullName: string;
  role: UserRole;
};

export interface ContractListResult {
  data: { items: Array<ReturnType<typeof presentContract>> };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type ContractRepositories = {
  contracts: Repository<Contract>;
  tenants: Repository<ContractTenant>;
  notifications: Repository<Notification>;
  rooms: Repository<Room>;
  users: Repository<User>;
};

type NormalizedTenant = {
  studentId: number;
  isPrimaryTenant: boolean;
  moveInDate: Date | null;
  moveOutDate: Date | null;
};

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private readonly contracts: Repository<Contract>,
    private readonly dataSource: DataSource,
  ) {}

  async list(
    actor: ContractActor,
    query: ListContractsQueryDto,
  ): Promise<ContractListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const builder = this.contracts.createQueryBuilder('contract');

    if (actor.role === UserRole.STUDENT) {
      builder.innerJoin(
        'contract.tenants',
        'tenantScope',
        'tenantScope.student_id = :studentId',
        { studentId: actor.id },
      );
    } else if (actor.role === UserRole.LANDLORD) {
      builder.where('contract.landlord_id = :landlordId', {
        landlordId: actor.id,
      });
    } else if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền xem hợp đồng');
    }

    if (query.status) {
      builder.andWhere('contract.status = :status', { status: query.status });
    }

    return this.paginateContractIds(builder, page, limit);
  }

  async getForUser(actor: ContractActor, contractId: number) {
    const contract = await this.findFull(this.contracts, contractId);
    if (
      actor.role !== UserRole.ADMIN &&
      contract.landlordId !== actor.id &&
      !contract.tenants.some((tenant) => tenant.studentId === actor.id)
    ) {
      // Match an absent contract to avoid exposing sequential IDs to another
      // authenticated user.
      throw new NotFoundException('Không tìm thấy hợp đồng');
    }
    return presentContract(contract);
  }

  async create(actor: ContractActor, input: CreateContractDto) {
    if (actor.role !== UserRole.LANDLORD && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Chỉ chủ trọ có thể tạo hợp đồng');
    }

    const tenants = this.normalizeTenants(input);
    this.validateContractDates(input, tenants);

    try {
      const contract = await this.dataSource.transaction(async (manager) => {
        const repositories = this.getRepositories(manager);
        const room = await repositories.rooms.findOne({
          where: { id: input.roomId },
          relations: { property: true },
          lock: { mode: 'pessimistic_write' },
        });
        if (!room || room.status === RoomStatus.HIDDEN || !room.property) {
          throw new NotFoundException('Không tìm thấy phòng');
        }
        if (
          actor.role === UserRole.LANDLORD &&
          room.property.landlordId !== actor.id
        ) {
          throw new NotFoundException('Không tìm thấy phòng');
        }

        const studentIds = tenants.map((tenant) => tenant.studentId);
        const students = await repositories.users.find({
          where: {
            id: In(studentIds),
            role: UserRole.STUDENT,
            status: UserStatus.ACTIVE,
          },
        });
        if (students.length !== studentIds.length) {
          throw new UnprocessableEntityException(
            'Có sinh viên thuê không hợp lệ',
          );
        }

        const contractNumber =
          input.contractNumber ?? this.createContractNumber(room.id);
        const existing = await repositories.contracts.findOneBy({
          contractNumber,
        });
        if (existing) {
          throw new ConflictException('Số hợp đồng đã tồn tại');
        }

        const contract = await repositories.contracts.save(
          repositories.contracts.create({
            contractNumber,
            roomId: room.id,
            landlordId: room.property.landlordId,
            startDate: input.startDate,
            endDate: input.endDate,
            rent: String(input.rent),
            deposit: String(input.deposit),
            terms: input.terms,
            status: ContractStatus.DRAFT,
            signedAt: null,
            terminatedAt: null,
          }),
        );

        await repositories.tenants.save(
          repositories.tenants.create(
            tenants.map((tenant) => ({
              contractId: contract.id,
              studentId: tenant.studentId,
              isPrimaryTenant: tenant.isPrimaryTenant,
              moveInDate: tenant.moveInDate,
              moveOutDate: tenant.moveOutDate,
              signedAt: null,
            })),
          ),
        );

        return this.findFull(repositories.contracts, contract.id);
      });

      return presentContract(contract);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Dữ liệu hợp đồng đã tồn tại');
      }
      throw error;
    }
  }

  async transition(
    actor: ContractActor,
    contractId: number,
    input: TransitionContractDto,
  ) {
    if (actor.role !== UserRole.LANDLORD && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Chỉ chủ trọ có thể quản lý hợp đồng');
    }

    const contract = await this.dataSource.transaction(async (manager) => {
      const repositories = this.getRepositories(manager);
      // All capacity-changing paths lock in this order: contract, room, then
      // contract tenants.  It keeps concurrent activations serialized.
      const locked = await this.requireLockedContract(
        repositories.contracts,
        contractId,
      );
      this.requireManager(actor, locked);

      if (locked.status === input.status) {
        return this.findFull(repositories.contracts, locked.id);
      }

      if (input.status === ContractStatus.ACTIVE) {
        return this.activate(repositories, locked);
      }
      if (input.status === ContractStatus.TERMINATED) {
        return this.terminate(repositories, locked);
      }
      if (input.status === ContractStatus.EXPIRED) {
        return this.expire(repositories, locked);
      }

      throw new UnprocessableEntityException('Trạng thái hợp đồng không hợp lệ');
    });

    return presentContract(contract);
  }

  private async activate(
    repositories: ContractRepositories,
    contract: Contract,
  ): Promise<Contract> {
    if (contract.status !== ContractStatus.DRAFT) {
      throw new ConflictException('Chỉ hợp đồng nháp mới có thể kích hoạt');
    }

    const room = await this.requireLockedRoom(repositories.rooms, contract.roomId);
    if (room.status === RoomStatus.HIDDEN) {
      throw new UnprocessableEntityException('Phòng không thể kích hoạt hợp đồng');
    }
    const tenants = await this.lockTenants(repositories.tenants, contract.id);
    const activeTenantCount = tenants.filter(
      (tenant) => tenant.moveOutDate === null,
    ).length;
    if (activeTenantCount < 1) {
      throw new UnprocessableEntityException(
        'Hợp đồng cần ít nhất một người thuê đang hiệu lực',
      );
    }
    if (room.availableSlots < activeTenantCount) {
      throw new ConflictException('Phòng không còn đủ chỗ trống cho hợp đồng');
    }

    const nextSlots = room.availableSlots - activeTenantCount;
    const roomUpdate = await repositories.rooms.update(
      { id: room.id, availableSlots: MoreThanOrEqual(activeTenantCount) },
      {
        availableSlots: nextSlots,
        status: nextSlots === 0 ? RoomStatus.RENTED : RoomStatus.AVAILABLE,
      },
    );
    if (!roomUpdate.affected) {
      throw new ConflictException('Số chỗ trống của phòng đã thay đổi');
    }

    const contractUpdate = await repositories.contracts.update(
      { id: contract.id, status: ContractStatus.DRAFT },
      { status: ContractStatus.ACTIVE, signedAt: new Date() },
    );
    if (!contractUpdate.affected) {
      throw new ConflictException('Hợp đồng đã được cập nhật');
    }

    await this.createTransitionNotifications(
      repositories.notifications,
      tenants,
      contract,
      'Hợp đồng đã được kích hoạt',
      `Hợp đồng ${contract.contractNumber} đã có hiệu lực.`,
    );
    return this.findFull(repositories.contracts, contract.id);
  }

  private async terminate(
    repositories: ContractRepositories,
    contract: Contract,
  ): Promise<Contract> {
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new ConflictException('Chỉ hợp đồng đang hiệu lực mới có thể chấm dứt');
    }

    const room = await this.requireLockedRoom(repositories.rooms, contract.roomId);
    const tenants = await this.lockTenants(repositories.tenants, contract.id);
    const activeTenantCount = tenants.filter(
      (tenant) => tenant.moveOutDate === null,
    ).length;
    const nextSlots = Math.min(
      room.capacity,
      room.availableSlots + activeTenantCount,
    );

    const roomUpdate = await repositories.rooms.update(
      { id: room.id },
      {
        availableSlots: nextSlots,
        status: nextSlots === 0 ? RoomStatus.RENTED : RoomStatus.AVAILABLE,
      },
    );
    if (!roomUpdate.affected) {
      throw new ConflictException('Số chỗ trống của phòng đã thay đổi');
    }

    const contractUpdate = await repositories.contracts.update(
      { id: contract.id, status: ContractStatus.ACTIVE },
      { status: ContractStatus.TERMINATED, terminatedAt: new Date() },
    );
    if (!contractUpdate.affected) {
      throw new ConflictException('Hợp đồng đã được cập nhật');
    }

    await this.createTransitionNotifications(
      repositories.notifications,
      tenants,
      contract,
      'Hợp đồng đã chấm dứt',
      `Hợp đồng ${contract.contractNumber} đã được chấm dứt.`,
    );
    return this.findFull(repositories.contracts, contract.id);
  }

  private async expire(
    repositories: ContractRepositories,
    contract: Contract,
  ): Promise<Contract> {
    if (
      contract.status !== ContractStatus.DRAFT &&
      contract.status !== ContractStatus.ACTIVE
    ) {
      throw new ConflictException('Không thể chuyển trạng thái hợp đồng');
    }

    const update = await repositories.contracts.update(
      { id: contract.id, status: In([ContractStatus.DRAFT, ContractStatus.ACTIVE]) },
      { status: ContractStatus.EXPIRED },
    );
    if (!update.affected) {
      throw new ConflictException('Hợp đồng đã được cập nhật');
    }
    return this.findFull(repositories.contracts, contract.id);
  }

  private async paginateContractIds(
    builder: SelectQueryBuilder<Contract>,
    page: number,
    limit: number,
  ): Promise<ContractListResult> {
    const total = await builder.clone().getCount();
    const rows = await builder
      .select('contract.id', 'id')
      .orderBy('contract.createdAt', 'DESC')
      .addOrderBy('contract.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany<{ id: number | string }>();
    const ids = rows
      .map((row) => Number(row.id))
      .filter((id) => Number.isSafeInteger(id) && id > 0);
    const contracts = await this.loadFullContracts(this.contracts, ids);

    return {
      data: { items: contracts.map(presentContract) },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private async loadFullContracts(
    repository: Repository<Contract>,
    contractIds: number[],
  ): Promise<Contract[]> {
    if (contractIds.length === 0) return [];

    const hydrated = await repository.find({
      where: { id: In(contractIds) },
      relations: {
        room: { property: true },
        landlord: true,
        tenants: { student: true },
        invoices: true,
      },
    });
    const byId = new Map(hydrated.map((contract) => [contract.id, contract]));
    return contractIds.flatMap((contractId) => {
      const contract = byId.get(contractId);
      return contract ? [contract] : [];
    });
  }

  private findFull(
    repository: Repository<Contract>,
    contractId: number,
  ): Promise<Contract> {
    return repository
      .findOne({
        where: { id: contractId },
        relations: {
          room: { property: true },
          landlord: true,
          tenants: { student: true },
          invoices: true,
        },
      })
      .then((contract) => {
        if (!contract) {
          throw new NotFoundException('Không tìm thấy hợp đồng');
        }
        return contract;
      });
  }

  private getRepositories(manager: EntityManager): ContractRepositories {
    return {
      contracts: manager.getRepository(Contract),
      tenants: manager.getRepository(ContractTenant),
      notifications: manager.getRepository(Notification),
      rooms: manager.getRepository(Room),
      users: manager.getRepository(User),
    };
  }

  private async requireLockedContract(
    repository: Repository<Contract>,
    contractId: number,
  ): Promise<Contract> {
    const contract = await repository.findOne({
      where: { id: contractId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!contract) {
      throw new NotFoundException('Không tìm thấy hợp đồng');
    }
    return contract;
  }

  private async requireLockedRoom(
    repository: Repository<Room>,
    roomId: number,
  ): Promise<Room> {
    const room = await repository.findOne({
      where: { id: roomId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!room) {
      throw new UnprocessableEntityException('Phòng không thể cập nhật hợp đồng');
    }
    return room;
  }

  private lockTenants(
    repository: Repository<ContractTenant>,
    contractId: number,
  ): Promise<ContractTenant[]> {
    return repository.find({
      where: { contractId },
      lock: { mode: 'pessimistic_write' },
      order: { id: 'ASC' },
    });
  }

  private requireManager(actor: ContractActor, contract: Contract): void {
    if (
      actor.role !== UserRole.ADMIN &&
      (actor.role !== UserRole.LANDLORD || contract.landlordId !== actor.id)
    ) {
      throw new NotFoundException('Không tìm thấy hợp đồng');
    }
  }

  private normalizeTenants(input: CreateContractDto): NormalizedTenant[] {
    const hasDetailedTenants = input.tenants !== undefined;
    const hasLegacyStudentIds = input.studentIds !== undefined;
    if (hasDetailedTenants === hasLegacyStudentIds) {
      throw new UnprocessableEntityException(
        'Cần cung cấp chính xác một danh sách người thuê',
      );
    }

    const tenants: ContractTenantInputDto[] = hasDetailedTenants
      ? input.tenants ?? []
      : (input.studentIds ?? []).map((studentId) => ({ studentId }));
    if (tenants.length === 0) {
      throw new UnprocessableEntityException('Cần có ít nhất một người thuê');
    }

    const studentIds = tenants.map((tenant) => tenant.studentId);
    if (new Set(studentIds).size !== studentIds.length) {
      throw new UnprocessableEntityException(
        'Không được lặp sinh viên trong hợp đồng',
      );
    }

    const primaryIndexes = tenants
      .map((tenant, index) => (tenant.isPrimaryTenant ? index : -1))
      .filter((index) => index >= 0);
    if (primaryIndexes.length > 1) {
      throw new UnprocessableEntityException('Chỉ được có một người thuê chính');
    }
    const primaryIndex = primaryIndexes[0] ?? 0;

    return tenants.map((tenant, index) => ({
      studentId: tenant.studentId,
      isPrimaryTenant: index === primaryIndex,
      moveInDate: tenant.moveInDate ?? null,
      moveOutDate: tenant.moveOutDate ?? null,
    }));
  }

  private validateContractDates(
    input: CreateContractDto,
    tenants: NormalizedTenant[],
  ): void {
    if (!this.isValidDate(input.startDate) || !this.isValidDate(input.endDate)) {
      throw new UnprocessableEntityException('Ngày hợp đồng không hợp lệ');
    }
    if (input.endDate <= input.startDate) {
      throw new UnprocessableEntityException(
        'Ngày kết thúc phải sau ngày bắt đầu',
      );
    }

    for (const tenant of tenants) {
      if (
        tenant.moveInDate !== null &&
        (!this.isValidDate(tenant.moveInDate) ||
          tenant.moveInDate < input.startDate ||
          tenant.moveInDate > input.endDate)
      ) {
        throw new UnprocessableEntityException(
          'Ngày vào ở phải nằm trong thời hạn hợp đồng',
        );
      }
      if (
        tenant.moveOutDate !== null &&
        (!this.isValidDate(tenant.moveOutDate) ||
          tenant.moveOutDate < (tenant.moveInDate ?? input.startDate) ||
          tenant.moveOutDate > input.endDate)
      ) {
        throw new UnprocessableEntityException(
          'Ngày rời đi không hợp lệ trong thời hạn hợp đồng',
        );
      }
    }
  }

  private async createTransitionNotifications(
    repository: Repository<Notification>,
    tenants: ContractTenant[],
    contract: Contract,
    title: string,
    content: string,
  ): Promise<void> {
    if (tenants.length === 0) return;
    await repository.save(
      repository.create(
        tenants.map((tenant) => ({
          userId: tenant.studentId,
          type: NotificationType.CONTRACT,
          title,
          content,
          linkUrl: `/contracts/${contract.id}`,
          isRead: false,
          readAt: null,
        })),
      ),
    );
  }

  private createContractNumber(roomId: number): string {
    return `HD-${new Date().getFullYear()}-${roomId}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;
  }

  private isValidDate(value: Date): boolean {
    return value instanceof Date && !Number.isNaN(value.valueOf());
  }

  private isUniqueConstraintError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const databaseError = error as { code?: unknown; errno?: unknown };
    return databaseError.code === 'ER_DUP_ENTRY' || databaseError.errno === 1062;
  }
}
