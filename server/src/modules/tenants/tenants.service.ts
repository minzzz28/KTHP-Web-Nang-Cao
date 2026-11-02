import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractTenant, User } from '../../database/entities';
import { UserRole, UserStatus } from '../../database/enums/domain.enums';
import { ListTenantsQueryDto } from './dto/list-tenants-query.dto';
import { presentTenant, presentTenantCandidate } from './tenant.presenter';

export type TenantActor = {
  id: number;
  role: UserRole;
};

export interface TenantListResult {
  data: {
    items: Array<
      ReturnType<typeof presentTenant> | ReturnType<typeof presentTenantCandidate>
    >;
  };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(ContractTenant)
    private readonly tenants: Repository<ContractTenant>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async list(
    actor: TenantActor,
    query: ListTenantsQueryDto,
  ): Promise<TenantListResult> {
    this.requireLandlordOrAdmin(actor);
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;

    if (query.candidates) {
      return this.listCandidates(page, limit);
    }

    const where =
      actor.role === UserRole.ADMIN
        ? {}
        : { contract: { landlordId: actor.id } };
    const [items, total] = await this.tenants.findAndCount({
      where,
      relations: {
        student: { studentProfile: true },
        contract: { room: true },
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return this.toResult(items.map(presentTenant), page, limit, total);
  }

  private async listCandidates(
    page: number,
    limit: number,
  ): Promise<TenantListResult> {
    const [students, total] = await this.users.findAndCount({
      where: { role: UserRole.STUDENT, status: UserStatus.ACTIVE },
      relations: { studentProfile: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return this.toResult(students.map(presentTenantCandidate), page, limit, total);
  }

  private toResult(
    items: TenantListResult['data']['items'],
    page: number,
    limit: number,
    total: number,
  ): TenantListResult {
    return {
      data: { items },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private requireLandlordOrAdmin(actor: TenantActor): void {
    if (actor.role !== UserRole.LANDLORD && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Chỉ chủ trọ hoặc quản trị viên có thể xem người thuê',
      );
    }
  }
}
