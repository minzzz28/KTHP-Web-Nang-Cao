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
  LessThan,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { randomUUID } from 'node:crypto';
import {
  Contract,
  ContractTenant,
  Invoice,
  InvoiceItem,
  Notification,
} from '../../database/entities';
import {
  ContractStatus,
  InvoiceItemType,
  InvoiceStatus,
  NotificationType,
  UserRole,
} from '../../database/enums/domain.enums';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { presentInvoice } from './invoice.presenter';

export type InvoiceActor = {
  id: number;
  fullName: string;
  role: UserRole;
};

export interface InvoiceListResult {
  data: { items: Array<ReturnType<typeof presentInvoice>> };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type InvoiceRepositories = {
  contracts: Repository<Contract>;
  tenants: Repository<ContractTenant>;
  invoices: Repository<Invoice>;
  invoiceItems: Repository<InvoiceItem>;
  notifications: Repository<Notification>;
};

type InvoiceAmounts = {
  rent: bigint;
  electricityStart: bigint;
  electricityEnd: bigint;
  electricityUsage: bigint;
  electricityUnitPrice: bigint;
  electricityAmount: bigint;
  waterStart: bigint;
  waterEnd: bigint;
  waterUsage: bigint;
  waterUnitPrice: bigint;
  waterAmount: bigint;
  internet: bigint;
  parking: bigint;
  service: bigint;
  other: bigint;
  total: bigint;
};

type InvoiceItemValues = {
  type: InvoiceItemType;
  description: string;
  quantity: bigint;
  unitPrice: bigint;
  amount: bigint;
};

const HUNDRED = 100n;
// DECIMAL(12, 2), which is used by invoice amounts in the existing schema.
const MAX_DECIMAL_CENTS = 999_999_999_999n;
// DECIMAL(10, 2), which is used by invoice item quantities.
const MAX_QUANTITY_CENTS = 9_999_999_999n;

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
    private readonly dataSource: DataSource,
  ) {}

  async list(
    actor: InvoiceActor,
    query: ListInvoicesQueryDto,
  ): Promise<InvoiceListResult> {
    // Preserve the legacy lifecycle rule: an unpaid invoice becomes overdue
    // once its DATE due date is earlier than the current instant.
    await this.refreshOverdue();

    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const builder = this.invoices.createQueryBuilder('invoice');

    if (actor.role === UserRole.STUDENT) {
      builder
        .innerJoin('invoice.contract', 'contractScope')
        .innerJoin(
          'contractScope.tenants',
          'tenantScope',
          'tenantScope.student_id = :studentId',
          { studentId: actor.id },
        );
    } else if (actor.role === UserRole.LANDLORD) {
      builder
        .innerJoin('invoice.contract', 'contractScope')
        .where('contractScope.landlord_id = :landlordId', {
          landlordId: actor.id,
        });
    } else if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền xem hóa đơn');
    }

    if (query.status) {
      builder.andWhere('invoice.status = :status', { status: query.status });
    }

    return this.paginateInvoiceIds(builder, page, limit);
  }

  async getForUser(actor: InvoiceActor, invoiceId: number) {
    const invoice = await this.findFull(this.invoices, invoiceId);
    this.requireParticipant(actor, invoice);
    return presentInvoice(invoice);
  }

  async create(actor: InvoiceActor, input: CreateInvoiceDto) {
    if (actor.role !== UserRole.LANDLORD && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Chỉ chủ trọ có thể lập hóa đơn');
    }

    this.validateDates(input);

    try {
      const invoice = await this.dataSource.transaction(async (manager) => {
        const repositories = this.getRepositories(manager);
        // The contract lock makes duplicate-period checks deterministic for
        // simultaneous creation requests. The database unique key remains a
        // final safeguard if data is changed outside this API.
        const contract = await this.requireLockedManagedActiveContract(
          repositories.contracts,
          actor,
          input.contractId,
        );
        const duplicate = await repositories.invoices.findOneBy({
          contractId: contract.id,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
        });
        if (duplicate) {
          throw new ConflictException('Đã có hóa đơn cho kỳ này');
        }

        const amounts = this.calculateAmounts(input, contract.rent);
        const invoice = await repositories.invoices.save(
          repositories.invoices.create({
            invoiceNumber: this.createInvoiceNumber(contract.id, input.periodEnd),
            contractId: contract.id,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            dueDate: input.dueDate,
            electricityStart: this.formatCents(amounts.electricityStart),
            electricityEnd: this.formatCents(amounts.electricityEnd),
            electricityUsage: this.formatCents(amounts.electricityUsage),
            electricityUnitPrice: this.formatCents(amounts.electricityUnitPrice),
            electricityAmount: this.formatCents(amounts.electricityAmount),
            waterStart: this.formatCents(amounts.waterStart),
            waterEnd: this.formatCents(amounts.waterEnd),
            waterUsage: this.formatCents(amounts.waterUsage),
            waterUnitPrice: this.formatCents(amounts.waterUnitPrice),
            waterAmount: this.formatCents(amounts.waterAmount),
            rentAmount: this.formatCents(amounts.rent),
            internetAmount: this.formatCents(amounts.internet),
            parkingAmount: this.formatCents(amounts.parking),
            serviceAmount: this.formatCents(amounts.service),
            otherAmount: this.formatCents(amounts.other),
            totalAmount: this.formatCents(amounts.total),
            status: InvoiceStatus.UNPAID,
            paidAt: null,
          }),
        );

        const itemValues = this.buildItems(amounts);
        await repositories.invoiceItems.save(
          repositories.invoiceItems.create(
            itemValues.map((item) => ({
              invoiceId: invoice.id,
              type: item.type,
              description: item.description,
              quantity: this.formatCents(item.quantity),
              unitPrice: this.formatCents(item.unitPrice),
              amount: this.formatCents(item.amount),
            })),
          ),
        );

        const tenants = await this.lockTenants(repositories.tenants, contract.id);
        await this.createNotifications(
          repositories.notifications,
          tenants,
          invoice.id,
          'Có hóa đơn mới',
          `Hóa đơn ${invoice.invoiceNumber} đã được tạo.`,
        );
        return this.findFull(repositories.invoices, invoice.id);
      });

      return presentInvoice(invoice);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Đã có hóa đơn cho kỳ này');
      }
      throw error;
    }
  }

  async updateStatus(
    actor: InvoiceActor,
    invoiceId: number,
    input: UpdateInvoiceStatusDto,
  ) {
    if (actor.role !== UserRole.LANDLORD && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Chỉ chủ trọ có thể cập nhật hóa đơn');
    }

    const updatedInvoice = await this.dataSource.transaction(async (manager) => {
      const repositories = this.getRepositories(manager);
      const lockedInvoice = await this.requireLockedInvoice(
        repositories.invoices,
        invoiceId,
      );
      const invoice = await this.findFull(repositories.invoices, lockedInvoice.id);
      this.requireManager(actor, invoice);

      if (
        invoice.status !== InvoiceStatus.UNPAID &&
        invoice.status !== InvoiceStatus.OVERDUE
      ) {
        throw new ConflictException('Hóa đơn đã được xử lý');
      }

      const result = await repositories.invoices.update(
        {
          id: invoice.id,
          status: In([InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE]),
        },
        {
          status: input.status,
          paidAt: input.status === InvoiceStatus.PAID ? new Date() : null,
        },
      );
      if (!result.affected) {
        throw new ConflictException('Hóa đơn đã được cập nhật');
      }

      const tenants = await this.lockTenants(
        repositories.tenants,
        invoice.contractId,
      );
      const outcome =
        input.status === InvoiceStatus.PAID
          ? 'đánh dấu đã thanh toán'
          : 'hủy';
      await this.createNotifications(
        repositories.notifications,
        tenants,
        invoice.id,
        'Trạng thái hóa đơn đã thay đổi',
        `Hóa đơn ${invoice.invoiceNumber} đã được ${outcome}.`,
      );
      return this.findFull(repositories.invoices, invoice.id);
    });

    return presentInvoice(updatedInvoice);
  }

  private async refreshOverdue(): Promise<void> {
    await this.invoices.update(
      { status: InvoiceStatus.UNPAID, dueDate: LessThan(new Date()) },
      { status: InvoiceStatus.OVERDUE },
    );
  }

  private async paginateInvoiceIds(
    builder: SelectQueryBuilder<Invoice>,
    page: number,
    limit: number,
  ): Promise<InvoiceListResult> {
    const total = await builder.clone().getCount();
    const rows = await builder
      .select('invoice.id', 'id')
      .orderBy('invoice.dueDate', 'DESC')
      .addOrderBy('invoice.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany<{ id: number | string }>();
    const ids = rows
      .map((row) => Number(row.id))
      .filter((id) => Number.isSafeInteger(id) && id > 0);
    const invoices = await this.loadFullInvoices(this.invoices, ids);

    return {
      data: { items: invoices.map(presentInvoice) },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private async loadFullInvoices(
    repository: Repository<Invoice>,
    invoiceIds: number[],
  ): Promise<Invoice[]> {
    if (invoiceIds.length === 0) return [];

    const hydrated = await repository.find({
      where: { id: In(invoiceIds) },
      relations: this.fullRelations(),
    });
    const byId = new Map(hydrated.map((invoice) => [invoice.id, invoice]));
    return invoiceIds.flatMap((invoiceId) => {
      const invoice = byId.get(invoiceId);
      return invoice ? [invoice] : [];
    });
  }

  private findFull(
    repository: Repository<Invoice>,
    invoiceId: number,
  ): Promise<Invoice> {
    return repository
      .findOne({ where: { id: invoiceId }, relations: this.fullRelations() })
      .then((invoice) => {
        if (!invoice) {
          throw new NotFoundException('Không tìm thấy hóa đơn');
        }
        return invoice;
      });
  }

  private fullRelations() {
    return {
      contract: {
        room: { property: true },
        landlord: true,
        tenants: { student: true },
      },
      items: true,
    } as const;
  }

  private getRepositories(manager: EntityManager): InvoiceRepositories {
    return {
      contracts: manager.getRepository(Contract),
      tenants: manager.getRepository(ContractTenant),
      invoices: manager.getRepository(Invoice),
      invoiceItems: manager.getRepository(InvoiceItem),
      notifications: manager.getRepository(Notification),
    };
  }

  private async requireLockedManagedActiveContract(
    repository: Repository<Contract>,
    actor: InvoiceActor,
    contractId: number,
  ): Promise<Contract> {
    const contract = await repository.findOne({
      where: { id: contractId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!contract) {
      throw new NotFoundException('Không tìm thấy hợp đồng');
    }
    if (
      actor.role !== UserRole.ADMIN &&
      (actor.role !== UserRole.LANDLORD || contract.landlordId !== actor.id)
    ) {
      throw new NotFoundException('Không tìm thấy hợp đồng');
    }
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new ConflictException(
        'Chỉ hợp đồng đang hiệu lực mới có thể lập hóa đơn',
      );
    }
    return contract;
  }

  private async requireLockedInvoice(
    repository: Repository<Invoice>,
    invoiceId: number,
  ): Promise<Invoice> {
    const invoice = await repository.findOne({
      where: { id: invoiceId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!invoice) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }
    return invoice;
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

  private requireParticipant(actor: InvoiceActor, invoice: Invoice): void {
    const contract = invoice.contract;
    const isTenant = contract?.tenants?.some(
      (tenant) => tenant.studentId === actor.id,
    );
    if (
      actor.role !== UserRole.ADMIN &&
      contract?.landlordId !== actor.id &&
      !isTenant
    ) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }
  }

  private requireManager(actor: InvoiceActor, invoice: Invoice): void {
    if (
      actor.role !== UserRole.ADMIN &&
      (actor.role !== UserRole.LANDLORD ||
        invoice.contract?.landlordId !== actor.id)
    ) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }
  }

  private validateDates(input: CreateInvoiceDto): void {
    if (
      !this.isValidDate(input.periodStart) ||
      !this.isValidDate(input.periodEnd) ||
      !this.isValidDate(input.dueDate)
    ) {
      throw new UnprocessableEntityException('Ngày hóa đơn không hợp lệ');
    }
    if (input.periodEnd < input.periodStart) {
      throw new UnprocessableEntityException('Kỳ hóa đơn không hợp lệ');
    }
    if (input.dueDate < input.periodStart) {
      throw new UnprocessableEntityException('Hạn thanh toán không hợp lệ');
    }
  }

  private calculateAmounts(
    input: CreateInvoiceDto,
    contractRent: string,
  ): InvoiceAmounts {
    const rent = this.toCents(input.rentAmount ?? contractRent, 'Tiền phòng');
    const electricityStart = this.toCents(
      input.electricityStart ?? 0,
      'Chỉ số điện đầu',
      MAX_QUANTITY_CENTS,
    );
    const electricityEnd = this.toCents(
      input.electricityEnd ?? 0,
      'Chỉ số điện cuối',
      MAX_QUANTITY_CENTS,
    );
    const electricityUnitPrice = this.toCents(
      input.electricityUnitPrice ?? 0,
      'Đơn giá điện',
    );
    const waterStart = this.toCents(
      input.waterStart ?? 0,
      'Chỉ số nước đầu',
      MAX_QUANTITY_CENTS,
    );
    const waterEnd = this.toCents(
      input.waterEnd ?? 0,
      'Chỉ số nước cuối',
      MAX_QUANTITY_CENTS,
    );
    const waterUnitPrice = this.toCents(
      input.waterUnitPrice ?? 0,
      'Đơn giá nước',
    );
    const internet = this.toCents(input.internetAmount ?? 0, 'Tiền internet');
    const parking = this.toCents(input.parkingAmount ?? 0, 'Tiền gửi xe');
    const service = this.toCents(input.serviceAmount ?? 0, 'Phí dịch vụ');
    const other = this.toCents(input.otherAmount ?? 0, 'Khoản khác');

    if (electricityEnd < electricityStart) {
      throw new UnprocessableEntityException(
        'Chỉ số điện cuối không thể nhỏ hơn đầu',
      );
    }
    if (waterEnd < waterStart) {
      throw new UnprocessableEntityException(
        'Chỉ số nước cuối không thể nhỏ hơn đầu',
      );
    }

    const electricityUsage = electricityEnd - electricityStart;
    const waterUsage = waterEnd - waterStart;
    const electricityAmount = this.multiplyQuantityByPrice(
      electricityUsage,
      electricityUnitPrice,
      'Tiền điện',
    );
    const waterAmount = this.multiplyQuantityByPrice(
      waterUsage,
      waterUnitPrice,
      'Tiền nước',
    );
    const total =
      rent +
      electricityAmount +
      waterAmount +
      internet +
      parking +
      service +
      other;
    this.requireCentsWithinLimit(total, 'Tổng tiền hóa đơn');

    return {
      rent,
      electricityStart,
      electricityEnd,
      electricityUsage,
      electricityUnitPrice,
      electricityAmount,
      waterStart,
      waterEnd,
      waterUsage,
      waterUnitPrice,
      waterAmount,
      internet,
      parking,
      service,
      other,
      total,
    };
  }

  private buildItems(amounts: InvoiceAmounts): InvoiceItemValues[] {
    const items: InvoiceItemValues[] = [
      {
        type: InvoiceItemType.RENT,
        description: 'Tiền phòng',
        quantity: HUNDRED,
        unitPrice: amounts.rent,
        amount: amounts.rent,
      },
      {
        type: InvoiceItemType.ELECTRICITY,
        description: 'Tiền điện',
        quantity: amounts.electricityUsage,
        unitPrice: amounts.electricityUnitPrice,
        amount: amounts.electricityAmount,
      },
      {
        type: InvoiceItemType.WATER,
        description: 'Tiền nước',
        quantity: amounts.waterUsage,
        unitPrice: amounts.waterUnitPrice,
        amount: amounts.waterAmount,
      },
    ];

    const optionalItems: Array<
      [InvoiceItemType, string, bigint]
    > = [
      [InvoiceItemType.INTERNET, 'Internet', amounts.internet],
      [InvoiceItemType.PARKING, 'Gửi xe', amounts.parking],
      [InvoiceItemType.SERVICE, 'Dịch vụ', amounts.service],
      [InvoiceItemType.OTHER, 'Khoản khác', amounts.other],
    ];
    for (const [type, description, amount] of optionalItems) {
      if (amount > 0n) {
        items.push({
          type,
          description,
          quantity: HUNDRED,
          unitPrice: amount,
          amount,
        });
      }
    }
    return items;
  }

  private async createNotifications(
    repository: Repository<Notification>,
    tenants: ContractTenant[],
    invoiceId: number,
    title: string,
    content: string,
  ): Promise<void> {
    if (tenants.length === 0) return;
    await repository.save(
      repository.create(
        tenants.map((tenant) => ({
          userId: tenant.studentId,
          type: NotificationType.INVOICE,
          title,
          content,
          linkUrl: `/invoices/${invoiceId}`,
          isRead: false,
          readAt: null,
        })),
      ),
    );
  }

  private createInvoiceNumber(contractId: number, periodEnd: Date): string {
    const period = periodEnd.toISOString().slice(0, 10).replace(/-/g, '');
    return `HD-${contractId}-${period}-${randomUUID().slice(0, 6).toUpperCase()}`;
  }

  private toCents(
    value: number | string,
    field: string,
    maximum = MAX_DECIMAL_CENTS,
  ): bigint {
    const source = typeof value === 'number' ? String(value) : value.trim();
    const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(source);
    if (!match) {
      throw new UnprocessableEntityException(
        `${field} phải là số không âm có tối đa hai chữ số thập phân`,
      );
    }
    const whole = BigInt(match[1]);
    const fraction = (match[2] ?? '').padEnd(2, '0');
    const cents = whole * HUNDRED + BigInt(fraction || '0');
    this.requireCentsWithinLimit(cents, field, maximum);
    return cents;
  }

  private multiplyQuantityByPrice(
    quantity: bigint,
    unitPrice: bigint,
    field: string,
  ): bigint {
    // Values are stored with two decimal digits. Round a positive fractional
    // cent half-up rather than allowing a driver/database rounding difference.
    const amount = (quantity * unitPrice + HUNDRED / 2n) / HUNDRED;
    this.requireCentsWithinLimit(amount, field);
    return amount;
  }

  private formatCents(cents: bigint): string {
    const whole = cents / HUNDRED;
    const fraction = (cents % HUNDRED).toString().padStart(2, '0');
    return `${whole}.${fraction}`;
  }

  private requireCentsWithinLimit(
    cents: bigint,
    field: string,
    maximum = MAX_DECIMAL_CENTS,
  ): void {
    if (cents < 0n || cents > maximum) {
      throw new UnprocessableEntityException(`${field} vượt quá giới hạn cho phép`);
    }
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
