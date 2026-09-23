import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { InvoiceItemType } from '../../enums/domain.enums';
import { CreatedEntity } from '../base/audited.entity';
import { Invoice } from './invoice.entity';

@Entity({ name: 'invoice_items' })
@Index('invoice_items_invoice_id_type_idx', ['invoiceId', 'type'])
export class InvoiceItem extends CreatedEntity {
  @Column({ name: 'invoice_id', type: 'int' })
  invoiceId!: number;

  @Column({ type: 'enum', enum: InvoiceItemType })
  type!: InvoiceItemType;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  quantity!: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'invoice_id',
    foreignKeyConstraintName: 'invoice_items_invoice_id_fkey',
  })
  invoice!: Invoice;
}
