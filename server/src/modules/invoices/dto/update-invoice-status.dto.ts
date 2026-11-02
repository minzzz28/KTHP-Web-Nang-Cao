import { IsIn } from 'class-validator';
import { InvoiceStatus } from '../../../database/enums/domain.enums';

export class UpdateInvoiceStatusDto {
  @IsIn([InvoiceStatus.PAID, InvoiceStatus.CANCELLED])
  status!: InvoiceStatus;
}
