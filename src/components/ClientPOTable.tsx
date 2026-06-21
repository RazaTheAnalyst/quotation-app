import { useState } from 'react';
import { CLIENT_PO_STATUSES } from '../types';
import type { ClientPO, ClientPOFilters } from '../types';

interface ClientPOTableProps {
  clientPOs: ClientPO[];
  filters: ClientPOFilters;
  onFilterChange: (filters: ClientPOFilters) => void;
  onEdit: (cpo: ClientPO) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
}

function getStatusClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'po received') return 'status-po-received';
  if (s === 'order placed to supplier') return 'status-order-placed';
  if (s === 'order ready pick up scheduled') return 'status-ready-pickup';
  if (s === 'in transit') return 'status-cpo-transit';
  if (s === 'delivered') return 'status-cpo-delivered';
  return '';
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

export default function ClientPOTable({ clientPOs, filters, onFilterChange, onEdit, onDelete, onStatusChange }: ClientPOTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const totalAED = clientPOs.reduce((s, c) => s + c.poAmountAED, 0);

  return (
    <div className="cpo-table-wrapper">
      <div className="cpo-filters">
        <input
          type="text"
          className="cpo-search"
          placeholder={'\uD83D\uDD0D Search customer, PO, supplier, order...'}
          value={filters.search}
          onChange={e => onFilterChange({ ...filters, search: e.target.value })}
        />
        <select
          className="cpo-filter-select"
          value={filters.status}
          onChange={e => onFilterChange({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          {CLIENT_PO_STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="cpo-summary-bar">
        <span>{clientPOs.length} order{clientPOs.length !== 1 ? 's' : ''}</span>
        <span className="cpo-summary-aed">Total: AED {formatCurrency(totalAED)}</span>
      </div>

      {/* Desktop Table */}
      <div className="table-container desktop-only">
        <table>
          <thead>
            <tr>
              <th className="th-expand" />
              <th>Customer Name</th>
              <th>Customer PO</th>
              <th className="num">Cust Amount</th>
              <th>Cur</th>
              <th className="num">PO AED</th>
              <th>Supplier PO</th>
              <th>Supplier</th>
              <th>Ord</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {clientPOs.map((cpo, i) => (
              <>
                <tr
                  key={cpo.id}
                  className={`animate-row cpo-row ${expandedId === cpo.id ? 'cpo-row-expanded' : ''}`}
                  style={{ animationDelay: `${i * 0.03}s` }}
                  onClick={() => toggleExpand(cpo.id)}
                >
                  <td className="td-expand">
                    <span className={`expand-icon ${expandedId === cpo.id ? 'expanded' : ''}`}>{'\u25B6'}</span>
                  </td>
                  <td className="td-supplier">{cpo.customerName}</td>
                  <td className="td-mono">{cpo.customerPO}</td>
                  <td className="num td-value">{cpo.customerPOAmount > 0 ? formatCurrency(cpo.customerPOAmount) : '-'}</td>
                  <td><span className="cpo-currency-badge">{cpo.customerPOCurrency || 'AED'}</span></td>
                  <td className="num td-value">{formatCurrency(cpo.poAmountAED)}</td>
                  <td className="td-mono">{cpo.supplierPO || '-'}</td>
                  <td>{cpo.supplierName || '-'}</td>
                  <td className="td-mono">{cpo.orderNo || '-'}</td>
                  <td>
                    <select
                      className={`status-select ${getStatusClass(cpo.status)}`}
                      value={cpo.status}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); onStatusChange(cpo.id, e.target.value); }}
                    >
                      {CLIENT_PO_STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="td-remarks" title={cpo.remarks}>{cpo.remarks || '-'}</td>
                </tr>
                {expandedId === cpo.id && (
                  <tr key={`${cpo.id}-expand`} className="cpo-expand-row">
                    <td colSpan={10}>
                      <div className="cpo-expand-panel">
                        <div className="cpo-expand-top">
                          <div className="cpo-expand-title">{'\uD83D\uDCCA'} Order Details</div>
                          <div className="quotes-expand-actions">
                            <button
                              className="btn btn-sm btn-edit"
                              onClick={e => { e.stopPropagation(); onEdit(cpo); }}
                            >
                              {'\u270F\uFE0F'} Edit
                            </button>
                            <button
                              className="btn btn-sm btn-delete"
                              onClick={e => { e.stopPropagation(); onDelete(cpo.id); }}
                            >
                              {'\uD83D\uDDD1\uFE0F'} Delete
                            </button>
                          </div>
                        </div>
                        <div className="cpo-expand-grid">
                          <div className="cpo-expand-card">
                            <div className="cpo-expand-label">Customer</div>
                            <div className="cpo-expand-value">{cpo.customerName}</div>
                          </div>
                          <div className="cpo-expand-card">
                            <div className="cpo-expand-label">Customer PO</div>
                            <div className="cpo-expand-value">{cpo.customerPO}</div>
                          </div>
                          <div className="cpo-expand-card">
                            <div className="cpo-expand-label">Customer PO Amount</div>
                            <div className="cpo-expand-value">{cpo.customerPOAmount > 0 ? `${cpo.customerPOCurrency || 'AED'} ${formatCurrency(cpo.customerPOAmount)}` : '-'}</div>
                          </div>
                          <div className="cpo-expand-card">
                            <div className="cpo-expand-label">PO Amount AED</div>
                            <div className="cpo-expand-value cpo-expand-value-highlight">AED {formatCurrency(cpo.poAmountAED)}</div>
                          </div>
                          <div className="cpo-expand-card">
                            <div className="cpo-expand-label">Supplier</div>
                            <div className="cpo-expand-value">{cpo.supplierName || '-'}</div>
                          </div>
                          <div className="cpo-expand-card">
                            <div className="cpo-expand-label">Supplier PO</div>
                            <div className="cpo-expand-value">{cpo.supplierPO || '-'}</div>
                          </div>
                          <div className="cpo-expand-card">
                            <div className="cpo-expand-label">Order No</div>
                            <div className="cpo-expand-value">{cpo.orderNo || '-'}</div>
                          </div>
                          <div className="cpo-expand-card">
                            <div className="cpo-expand-label">Status</div>
                            <div className="cpo-expand-value">{cpo.status}</div>
                          </div>
                          {cpo.remarks && (
                            <div className="cpo-expand-card cpo-expand-card-full">
                              <div className="cpo-expand-label">Remarks</div>
                              <div className="cpo-expand-value">{cpo.remarks}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {clientPOs.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">{'\uD83D\uDCCB'}</div>
            <div className="empty-state-text">No client POs found</div>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="mobile-cards mobile-only">
        {clientPOs.map((cpo, i) => (
          <div key={cpo.id} className="cpo-card animate-row" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="card-header">
              <span className="cpo-status-badge" data-status={cpo.status}>{cpo.status}</span>
              {cpo.orderNo && <span className="cpo-order-badge">#{cpo.orderNo}</span>}
            </div>
            <div className="card-supplier">{cpo.customerName}</div>
            <div className="card-po">{cpo.customerPO}</div>
            <div className="card-value">AED {formatCurrency(cpo.poAmountAED)}</div>
            {cpo.supplierName && (
              <div className="cpo-card-supplier">
                <span className="cpo-card-label">Supplier:</span> {cpo.supplierName}
                {cpo.supplierPO && <span className="td-mono"> ({cpo.supplierPO})</span>}
              </div>
            )}
            {cpo.remarks && <div className="card-remarks">{'\uD83D\uDCCB'} {cpo.remarks}</div>}
            <div className="card-footer">
              <button className="btn btn-sm btn-edit" onClick={() => onEdit(cpo)}>
                {'\u270F\uFE0F'} Edit
              </button>
              <button className="btn btn-sm btn-delete" onClick={() => onDelete(cpo.id)}>
                {'\uD83D\uDDD1\uFE0F'} Delete
              </button>
            </div>
          </div>
        ))}
        {clientPOs.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">{'\uD83D\uDCCB'}</div>
            <div className="empty-state-text">No client POs found</div>
          </div>
        )}
      </div>
    </div>
  );
}
