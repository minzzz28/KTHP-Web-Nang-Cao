import { EmptyState } from './AsyncState';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';
import { booleanLabel, recordTitle, valueAt } from '../../utils/records';

function displayValue(value, kind) {
  if (kind === 'currency') return formatCurrency(value);
  if (kind === 'date') return formatDate(value);
  if (kind === 'number') return formatNumber(value);
  if (kind === 'boolean') return booleanLabel(value);
  if (kind === 'status') return <StatusBadge status={value} />;
  if (Array.isArray(value)) return value.length ? `${value.length} mục` : '—';
  if (value && typeof value === 'object') return recordTitle(value);
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

export function ResourceTable({ items = [], columns, emptyTitle = 'Chưa có dữ liệu', emptyDescription, renderActions, rowKey = (row) => row.id }) {
  if (!items.length) return <EmptyState icon="bi-inbox" title={emptyTitle} description={emptyDescription} />;
  return (
    <div className="table-responsive"><table className="table resource-table mb-0"><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}{renderActions ? <th className="text-end">Thao tác</th> : null}</tr></thead><tbody>{items.map((item, index) => <tr key={rowKey(item) ?? index}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(item) : displayValue(valueAt(item, column.key), column.kind)}</td>)}{renderActions ? <td className="text-end">{renderActions(item)}</td> : null}</tr>)}</tbody></table></div>
  );
}

export function MetricCards({ metrics = [] }) {
  return <div className="row g-3 mb-4">{metrics.map((metric) => <div className="col-sm-6 col-xl" key={metric.label}><article className="dashboard-kpi"><div className="d-flex align-items-center justify-content-between gap-2"><span className="small text-muted-app">{metric.label}</span><span className="dashboard-kpi__icon"><i className={`bi ${metric.icon || 'bi-bar-chart'}`} aria-hidden="true" /></span></div><strong>{metric.format === 'currency' ? formatCurrency(metric.value) : formatNumber(metric.value)}</strong>{metric.hint ? <span className="small text-muted-app">{metric.hint}</span> : null}</article></div>)}</div>;
}

export function SimpleRecordList({ items = [], emptyTitle, emptyDescription, renderItem }) {
  if (!items.length) return <EmptyState icon="bi-inbox" title={emptyTitle || 'Chưa có dữ liệu'} description={emptyDescription} />;
  return <div className="vstack gap-2">{items.map((item, index) => <div key={item.id || index} className="list-record">{renderItem(item)}</div>)}</div>;
}
