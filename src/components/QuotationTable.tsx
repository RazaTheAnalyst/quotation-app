import { useState } from 'react';
import * as XLSX from 'xlsx';
import { STATUS_LIST } from '../types';
import type { Quotation, Forwarder } from '../types';
import { useAuth } from '../auth';

interface QuotationTableProps {
  quotations: Quotation[];
  forwarders: Forwarder[];
  onEdit: (quotation: Quotation) => void;
  onDelete: (id: number) => void;
  onAward: (id: number, forwarder: string) => void;
  onStatusChange: (id: number, status: string) => void;
}

export default function QuotationTable({ quotations, forwarders, onEdit, onDelete, onAward, onStatusChange }: QuotationTableProps) {
  const [detailQuotation, setDetailQuotation] = useState<Quotation | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.email === 'admin@netceedmea.com';
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'rejected'>('active');

  const pendingApprovalsCount = quotations.filter(q => q.status === 'Awaiting Approval').length;
  const rejectedCount = quotations.filter(q => q.status === 'Rejected').length;

  const displayedQuotations = quotations.filter(q => {
    if (!isAdmin) {
      return true;
    }
    if (activeTab === 'pending') {
      return q.status === 'Awaiting Approval';
    }
    if (activeTab === 'rejected') {
      return q.status === 'Rejected';
    }
    return q.status !== 'Awaiting Approval' && q.status !== 'Rejected';
  });

  const fmt = (val: number) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const exportToExcel = () => {
    try {
      const data = displayedQuotations.map(q => ({
        Entity: q.entity,
        Supplier: q.supplierName,
        'PO Number': q.supplierPO,
        'PO Value (AED)': q.poValue,
        Origin: q.origin,
        Destination: q.destination,
        Mode: q.mode,
        Size: q.size,
        'Transit Time': q.transitTime,
        ETD: q.etd,
        ETA: q.eta,
        Incoterms: q.incoterms,
        Status: q.status,
        'Freight %': q.percentage,
        'Savings (AED)': q.savings,
        'Awarded To': q.awardedTo || '-',
        ...forwarders.reduce((acc, f) => {
          const quote = q.quotes.find(qu => qu.forwarder === f.name);
          acc[f.name] = quote?.quotedAmount || 0;
          return acc;
        }, {} as Record<string, number>),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Quotations');
      XLSX.writeFile(wb, `Quotations_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Excel export failed:', err);
    }
  };

  const getModeIcon = (mode: string) => {
    if (mode.includes('SEA')) return '🚢';
    if (mode === 'Air') return '✈️';
    if (mode === 'Road') return '🚛';
    if (mode === 'Rail') return '🚂';
    if (mode === 'Multi-modal') return '🛣️';
    return '📦';
  };

  const getStatusClass = (status: string) => {
    if (status === 'Awaiting Approval') return 'status-awaiting-approval';
    if (status === 'Rejected') return 'status-rejected';
    if (status === 'Delivered') return 'status-delivered';
    if (status === 'In Transit') return 'status-transit';
    if (status === 'Under Clearence') return 'status-clearance';
    if (status === 'Arrived Awaiting clearence') return 'status-arrived';
    if (status === 'Assign to forwarder') return 'status-assigned';
    return 'status-sent';
  };

  const getAwardClass = (forwarder: string, awardedTo: string) => {
    if (!awardedTo) return '';
    return forwarder === awardedTo ? 'awarded' : 'not-awarded';
  };

  return (
    <>
      <div className="table-toolbar flex items-center justify-between gap-3 py-3">
        <div>
          {isAdmin && (
            <div className="admin-tabs">
              <button
                className={`admin-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                📋 Active
              </button>
              <button
                className={`admin-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                ⏳ Awaiting Approval <span className="admin-tab-badge">{pendingApprovalsCount}</span>
              </button>
              <button
                className={`admin-tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
                onClick={() => setActiveTab('rejected')}
              >
                ❌ Rejected <span className="admin-tab-badge">{rejectedCount}</span>
              </button>
            </div>
          )}
        </div>
        <button className="btn btn-export flex items-center gap-2 bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--border)] rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold cursor-pointer transition-all hover:bg-[var(--bg)] hover:text-[var(--text)] hover:border-[var(--primary)]" onClick={exportToExcel}>
          📤 Export Excel
        </button>
      </div>
      {/* Desktop Table */}
      <div className="table-container desktop-only overflow-x-auto bg-[var(--card-bg)] border border-[var(--border-light)] shadow-[var(--card-shadow)] -mx-5 w-[calc(100%+40px)]">
        <table className="responsive-table">
          <thead>
            <tr>
              <th className="bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-0 z-5 w-[32px]"></th>
              <th className="bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-0 z-5" data-col="entity">Entity</th>
              <th className="bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-0 z-5" data-col="supplier">Supplier</th>
              <th className="bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-0 z-5" data-col="po">PO</th>
              <th className="bg-[var(--card-bg)] px-2.5 py-3 text-right font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-0 z-5" data-col="value">PO Value</th>
              <th className="bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-0 z-5" data-col="origin">Origin</th>
              <th className="bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-0 z-5" data-col="dest">Dest</th>
              <th className="bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-0 z-5" data-col="mode">Mode</th>
              <th className="bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-0 z-5" data-col="status">Status</th>
              <th className="bg-[var(--card-bg)] px-2.5 py-3 text-right font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-0 z-5" data-col="pct">%</th>
              <th className="bg-[var(--card-bg)] px-2.5 py-3 text-right font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-0 z-5" data-col="savings">Savings</th>
            </tr>
          </thead>
          <tbody>
            {displayedQuotations.length === 0 ? (
              <tr>
                <td colSpan={11}>
                  <div className="empty-state text-center py-[60px] px-5 text-[var(--text-muted)]">
                    <div className="empty-state-icon text-[48px] mb-4">🔍</div>
                    <div className="empty-state-text text-[15px] font-medium">No quotations found</div>
                  </div>
                </td>
              </tr>
            ) : (
              displayedQuotations.map((q) => (
                <tr
                  key={q.id}
                  className="quote-row cursor-pointer hover:bg-[rgba(129,140,248,0.04)]"
                  onClick={() => setDetailQuotation(q)}
                >
                  <td className="px-2.5 py-2.5 border-b border-[var(--border-light)]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  </td>
                  <td className="px-2.5 py-2.5 border-b border-[var(--border-light)]"><span className={`entity-badge inline-flex items-center px-2.5 py-[3px] rounded-full text-[11px] font-bold tracking-[0.04em] uppercase entity-${q.entity.toLowerCase()}`}>{q.entity}</span></td>
                  <td className="px-2.5 py-2.5 border-b border-[var(--border-light)] font-semibold text-[13px] max-w-[140px] overflow-hidden text-ellipsis">{q.supplierName}</td>
                  <td className="px-2.5 py-2.5 border-b border-[var(--border-light)] font-['SF_Mono',Consolas,monospace] text-xs">{q.supplierPO}</td>
                  <td className="px-2.5 py-2.5 border-b border-[var(--border-light)] text-right font-variant-[tabular-nums] font-semibold text-[13px]">{fmt(q.poValue)} <span className="text-[10px] text-[var(--text-secondary)] font-normal">{q.poValueCurrency || 'AED'}</span></td>
                  <td className="px-2.5 py-2.5 border-b border-[var(--border-light)] text-[13px]">{q.origin}</td>
                  <td className="px-2.5 py-2.5 border-b border-[var(--border-light)] text-[13px]">{q.destination}</td>
                  <td className="px-2.5 py-2.5 border-b border-[var(--border-light)]"><span className="mode-tag inline-flex items-center px-[7px] py-[2px] rounded text-[12px]">{getModeIcon(q.mode)} {q.mode}</span></td>
                  <td className="px-2.5 py-2.5 border-b border-[var(--border-light)]" onClick={e => e.stopPropagation()}>
                    {q.status === 'Awaiting Approval' && isAdmin ? (
                      <div className="flex gap-2">
                        <button
                          className="btn-approve text-[11px] px-2 py-1 rounded"
                          onClick={() => onStatusChange(q.id, 'Assign to forwarder')}
                          title="Approve"
                        >
                          Approve
                        </button>
                        <button
                          className="btn-reject text-[11px] px-2 py-1 rounded"
                          onClick={() => onStatusChange(q.id, 'Rejected')}
                          title="Reject"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <select
                        className={`status-select text-[12px] px-2 py-1 rounded border cursor-pointer ${getStatusClass(q.status)}`}
                        value={q.status}
                        onChange={e => onStatusChange(q.id, e.target.value)}
                        disabled={!isAdmin}
                      >
                        {STATUS_LIST.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-2.5 py-2.5 border-b border-[var(--border-light)] text-right font-variant-[tabular-nums] font-medium">{Number.isFinite(q.percentage) ? q.percentage : 0}%</td>
                  <td className="px-2.5 py-2.5 border-b border-[var(--border-light)] text-right font-variant-[tabular-nums] font-semibold text-[var(--success)]">{q.savings > 0 ? fmt(q.savings) : '-'} {q.savings > 0 && <span className="text-[10px] text-[var(--success)] font-normal">{q.poValueCurrency || 'AED'}</span>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-cards mobile-only flex flex-col gap-3">
        {displayedQuotations.length === 0 ? (
          <div className="empty-state text-center py-[60px] px-5 text-[var(--text-muted)]">
            <div className="empty-state-icon text-[48px] mb-4">{'\uD83D\uDD0D'}</div>
            <div className="empty-state-text text-[15px] font-medium">No quotations found</div>
          </div>
        ) : (
          displayedQuotations.map((q) => (
            <div key={q.id} className="quotation-card bg-[var(--card-bg)] rounded-xl border border-[var(--border-light)] shadow-[var(--card-shadow)] p-4 cursor-pointer" onClick={() => setDetailQuotation(q)}>
              <div className="card-header flex items-center justify-between mb-2">
                <span className={`entity-badge inline-flex items-center px-2.5 py-[3px] rounded-full text-[11px] font-bold tracking-[0.04em] uppercase entity-${q.entity.toLowerCase()}`}>{q.entity}</span>
                {q.status === 'Awaiting Approval' && isAdmin ? (
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button className="btn-approve text-[11px] px-2.5 py-1 rounded" onClick={() => onStatusChange(q.id, 'Assign to forwarder')}>Approve</button>
                    <button className="btn-reject text-[11px] px-2.5 py-1 rounded" onClick={() => onStatusChange(q.id, 'Rejected')}>Reject</button>
                  </div>
                ) : (
                  <select
                    className={`status-select status-select-sm text-[12px] px-2 py-1 rounded border cursor-pointer ${getStatusClass(q.status)}`}
                    value={q.status}
                    onClick={e => e.stopPropagation()}
                    onChange={e => onStatusChange(q.id, e.target.value)}
                    disabled={!isAdmin}
                  >
                    {STATUS_LIST.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="card-supplier text-base font-semibold text-[var(--text-primary)] mb-1">{q.supplierName}</div>
              <div className="card-po font-['SF_Mono',Consolas,monospace] text-xs text-[var(--text-secondary)] mb-1">{q.supplierPO}</div>
              <div className="card-value text-lg font-bold text-[var(--text)]">{fmt(q.poValue)} <span className="text-xs font-normal text-[var(--text-secondary)]">{q.poValueCurrency || 'AED'}</span></div>
              <div className="card-route flex items-center gap-2 text-sm text-[var(--text-secondary)] my-2">
                <span>{q.origin}</span>
                <span className="card-arrow text-[var(--text-muted)]">{'\u2192'}</span>
                <span>{q.destination}</span>
              </div>
              <div className="card-details flex flex-wrap items-center gap-2 mb-2">
                <span className="mode-tag inline-flex items-center px-[7px] py-[2px] rounded text-[12px]">{getModeIcon(q.mode)} {q.mode}</span>
                <span className="inco-tag inline-flex items-center px-[7px] py-[2px] rounded text-[12px]">{q.incoterms}</span>
                {q.transitTime && <span className="transit-tag inline-flex items-center px-2 py-[2px] rounded text-[12px] bg-[var(--info-bg)] text-[var(--info)]">⏳ {q.transitTime}</span>}
              </div>
              {q.savings > 0 && <div className="card-savings text-sm font-semibold text-[var(--success)] mt-2">💵 Savings: {q.poValueCurrency || 'AED'} {fmt(q.savings)}</div>}
              <div className="card-footer flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-light)]">
                <span className="card-pct text-sm font-semibold text-[var(--text-secondary)]">{Number.isFinite(q.percentage) ? q.percentage : 0}%</span>
                <div className="card-actions flex items-center gap-2">
                  {!isAdmin && q.status === 'Awaiting Approval' ? (
                    <button className="btn btn-sm lock-badge flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold" disabled title="Under review. Cannot edit.">🔒 Under Review</button>
                  ) : (
                    <button className="btn btn-sm btn-edit flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all" onClick={(e) => { e.stopPropagation(); onEdit(q); }}>📝 Edit</button>
                  )}
                  {isAdmin && (
                    <button className="btn btn-sm btn-delete flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all" onClick={(e) => { e.stopPropagation(); onDelete(q.id); }}>🗑️ Delete</button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {detailQuotation && (
        <div className="modal-overlay" onClick={() => setDetailQuotation(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <div className="modal-title">
                <span className={`entity-badge inline-flex items-center px-2.5 py-[3px] rounded-full text-[11px] font-bold tracking-[0.04em] uppercase entity-${detailQuotation.entity.toLowerCase()}`}>{detailQuotation.entity}</span>
                <h2 className="m-0 text-lg font-semibold">{detailQuotation.supplierName}</h2>
                <span className="font-['SF_Mono',Consolas,monospace] text-sm text-[var(--text-secondary)]">{detailQuotation.supplierPO}</span>
              </div>
              <button className="btn-close" onClick={() => setDetailQuotation(null)} aria-label="Close">{'\u2715'}</button>
            </div>

            <div className="p-5">
              {/* Summary Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">PO Value</div>
                  <div className="text-base font-bold text-[var(--text)]">{detailQuotation.poValueCurrency || 'AED'} {fmt(detailQuotation.poValue)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">Freight %</div>
                  <div className="text-base font-bold text-[var(--primary)]">{Number.isFinite(detailQuotation.percentage) ? detailQuotation.percentage : 0}%</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">Savings</div>
                  <div className="text-base font-bold text-[var(--success)]">{detailQuotation.savings > 0 ? `${detailQuotation.poValueCurrency || 'AED'} ${fmt(detailQuotation.savings)}` : '-'}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">Status</div>
                  {detailQuotation.status === 'Awaiting Approval' && isAdmin ? (
                    <div className="flex gap-1.5">
                      <button
                        className="btn-approve text-[11px] px-2 py-1 rounded font-semibold cursor-pointer"
                        onClick={() => {
                          onStatusChange(detailQuotation.id, 'Assign to forwarder');
                          setDetailQuotation(prev => prev ? { ...prev, status: 'Assign to forwarder' } : null);
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-reject text-[11px] px-2 py-1 rounded font-semibold cursor-pointer"
                        onClick={() => {
                          onStatusChange(detailQuotation.id, 'Rejected');
                          setDetailQuotation(prev => prev ? { ...prev, status: 'Rejected' } : null);
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <select
                      className={`status-select text-[12px] px-2 py-1 rounded border cursor-pointer ${getStatusClass(detailQuotation.status)}`}
                      value={detailQuotation.status}
                      onChange={e => {
                        onStatusChange(detailQuotation.id, e.target.value);
                        setDetailQuotation(prev => prev ? { ...prev, status: e.target.value } : null);
                      }}
                      disabled={!isAdmin}
                    >
                      {STATUS_LIST.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Rejection remarks alert box if status is Rejected */}
              {detailQuotation.status === 'Rejected' && detailQuotation.remarks && (
                <div className="rejection-alert p-4 text-sm text-[var(--text)] mb-5">
                  <div className="font-bold text-red-400 mb-1 flex items-center gap-1.5">
                    ⚠️ Rejection Reason
                  </div>
                  <div className="text-[var(--text-secondary)]">{detailQuotation.remarks}</div>
                </div>
              )}

              {/* Route Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 p-3 bg-[var(--bg)] rounded-lg border border-[var(--border-light)]">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">Origin</div>
                  <div className="text-sm font-medium text-[var(--text)]">{detailQuotation.origin || '-'}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">Destination</div>
                  <div className="text-sm font-medium text-[var(--text)]">{detailQuotation.destination || '-'}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">Mode</div>
                  <div className="text-sm font-medium text-[var(--text)]">{getModeIcon(detailQuotation.mode)} {detailQuotation.mode || '-'}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">Size</div>
                  <div className="text-sm font-medium text-[var(--text)]">{detailQuotation.size || '-'}</div>
                </div>
                {detailQuotation.transitTime && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">Transit</div>
                    <div className="text-sm font-medium text-[var(--text)]">{detailQuotation.transitTime}</div>
                  </div>
                )}
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">Incoterms</div>
                  <div className="text-sm font-medium text-[var(--text)]">{detailQuotation.incoterms || '-'}</div>
                </div>
                {detailQuotation.etd && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">ETD</div>
                    <div className="text-sm font-medium text-[var(--text)]">{detailQuotation.etd}</div>
                  </div>
                )}
                {detailQuotation.eta && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">ETA</div>
                    <div className="text-sm font-medium text-[var(--text)]">{detailQuotation.eta}</div>
                  </div>
                )}
              </div>

              {/* Forwarder Quotes */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[var(--text)] m-0">Forwarder Quotes</h3>
                  {detailQuotation.savings > 0 && (
                    <span className="savings-badge inline-flex items-center px-2.5 py-1 rounded-[10px] text-[11px] font-semibold bg-[rgba(16,185,129,0.1)] text-[var(--success)]">Savings: {detailQuotation.poValueCurrency || 'AED'} {fmt(detailQuotation.savings)}</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {detailQuotation.quotes.filter(qt => qt.quotedAmount > 0).map(qt => (
                    <div key={qt.forwarder} className={`flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all ${getAwardClass(qt.forwarder, detailQuotation.awardedTo) === 'awarded' ? 'border-[var(--success)] bg-[var(--success-bg)]' : getAwardClass(qt.forwarder, detailQuotation.awardedTo) === 'not-awarded' ? 'border-[var(--border-light)] bg-[var(--bg)] opacity-60' : 'border-[var(--border-light)] bg-[var(--card-bg)]'}`}>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{qt.forwarder}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[var(--text-primary)]">{qt.currency || 'AED'} {fmt(qt.quotedAmount)}</span>
                        {(!(!isAdmin && (detailQuotation.status === 'Awaiting Approval' || detailQuotation.status === 'Rejected'))) && (
                          <button
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer border border-[var(--border-light)] bg-[var(--card-bg)] text-[var(--text-secondary)] transition-all hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)]"
                            onClick={() => onAward(detailQuotation.id, qt.forwarder)}
                          >
                            {detailQuotation.awardedTo === qt.forwarder ? '\u272A Awarded' : '\u2729 Award'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {detailQuotation.quotes.filter(qt => qt.quotedAmount > 0).length === 0 && (
                    <div className="text-center py-6 text-sm text-[var(--text-muted)]">No quotes yet</div>
                  )}
                </div>
              </div>

              {/* Remarks */}
              {detailQuotation.remarks && (
                <div className="p-3 rounded-lg bg-[var(--bg)] text-sm text-[var(--text-secondary)] border border-[var(--border-light)] mb-5">📝 {detailQuotation.remarks}</div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-light)]">
                {detailQuotation.status === 'Awaiting Approval' && isAdmin && (
                  <>
                    {!detailQuotation.awardedTo && (
                      <span className="text-[11px] flex items-center gap-1 mr-auto self-center font-medium" style={{ color: '#fbbf24' }}>
                        ⚠️ Award a quote above before approving
                      </span>
                    )}
                    <button
                      className={`btn btn-approve flex items-center gap-1 px-4 py-2 rounded text-xs font-semibold transition-all ${!detailQuotation.awardedTo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      disabled={!detailQuotation.awardedTo}
                      onClick={() => {
                        onStatusChange(detailQuotation.id, 'Assign to forwarder');
                        setDetailQuotation(null);
                      }}
                      title={!detailQuotation.awardedTo ? "Please select a forwarder quote to award first" : "Approve quotation"}
                    >
                      ✔️ Approve
                    </button>
                    <button
                      className="btn btn-reject flex items-center gap-1 px-4 py-2 rounded text-xs font-semibold cursor-pointer transition-all"
                      onClick={() => {
                        onStatusChange(detailQuotation.id, 'Rejected');
                        setDetailQuotation(null);
                      }}
                    >
                      ❌ Reject
                    </button>
                  </>
                )}
                {(detailQuotation.status === 'Pending' || detailQuotation.status === 'Sent for quotation') && detailQuotation.quotes.some(q => q.quotedAmount > 0) && (
                  <button
                    className="btn btn-submit-approval flex items-center gap-1 px-4 py-2 rounded text-xs font-semibold cursor-pointer transition-all"
                    onClick={() => {
                      onStatusChange(detailQuotation.id, 'Awaiting Approval');
                      setDetailQuotation(null);
                    }}
                  >
                    🚀 Submit for Approval
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => setDetailQuotation(null)}>Close</button>
                {!isAdmin && detailQuotation.status === 'Awaiting Approval' ? (
                  <button className="btn btn-sm lock-badge flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold" disabled title="Under review. Cannot edit.">🔒 Under Review</button>
                ) : (
                  <button className="btn btn-sm btn-edit flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-all" onClick={() => { setDetailQuotation(null); onEdit(detailQuotation); }}>📝 Edit</button>
                )}
                {isAdmin && (
                  <button className="btn btn-sm btn-delete flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-all" onClick={() => { setDetailQuotation(null); onDelete(detailQuotation.id); }}>🗑️ Delete</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
