import { Fragment, useState } from 'react';
import * as XLSX from 'xlsx';
import { STATUS_LIST } from '../types';
import type { Quotation, Forwarder } from '../types';

interface QuotationTableProps {
  quotations: Quotation[];
  forwarders: Forwarder[];
  onEdit: (quotation: Quotation) => void;
  onDelete: (id: number) => void;
  onAward: (id: number, forwarder: string) => void;
  onStatusChange: (id: number, status: string) => void;
}

export default function QuotationTable({ quotations, forwarders, onEdit, onDelete, onAward, onStatusChange }: QuotationTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [mobileExpandedCards, setMobileExpandedCards] = useState<Set<number>>(new Set());

  console.log(`[Table] Rendering ${quotations.length} quotations. IDs:`, quotations.map(q => q.id), 'Names:', quotations.map(q => q.supplierName));

  const fmt = (val: number) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const exportToExcel = () => {
    try {
      const data = quotations.map(q => ({
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

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleMobileCard = (id: number) => {
    setMobileExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getAwardClass = (forwarder: string, awardedTo: string) => {
    if (!awardedTo) return '';
    return forwarder === awardedTo ? 'awarded' : 'not-awarded';
  };

  const getModeIcon = (mode: string) => {
    if (mode.includes('SEA')) return '\u26F5';
    if (mode === 'Air') return '\u2708\uFE0F';
    if (mode === 'Road') return '\uD83D\uDE9B';
    if (mode === 'Rail') return '\uD83D\uDE82';
    if (mode === 'Multi-modal') return '\uD83D\uDEE2\uFE0F';
    return '\uD83D\uDCE6';
  };

  const getStatusClass = (status: string) => {
    if (status === 'Delivered') return 'status-delivered';
    if (status === 'In Transit') return 'status-transit';
    if (status === 'Under Clearence') return 'status-clearance';
    if (status === 'Arrived Awaiting clearence') return 'status-arrived';
    if (status === 'Assign to forwarder') return 'status-assigned';
    return 'status-sent';
  };

  return (
    <>
      <div className="table-toolbar flex items-center justify-end gap-3 py-3">
        <button className="btn btn-export flex items-center gap-2 bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--border)] rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold cursor-pointer transition-all hover:bg-[var(--bg)] hover:text-[var(--text)] hover:border-[var(--primary)]" onClick={exportToExcel}>
          {'\uD83D\uDCE5'} Export Excel
        </button>
      </div>
      {/* Desktop Table */}
      <div className="table-container desktop-only overflow-x-auto bg-[var(--card-bg)] border border-[var(--border-light)] shadow-[var(--card-shadow)] -mx-5 w-[calc(100%+40px)]">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="th-expand bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-[52px] z-5 w-[32px]"></th>
              <th className="th-entity bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-[52px] z-5 w-auto">Entity</th>
              <th className="th-supplier bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-[52px] z-5 min-w-[110px]">Supplier</th>
              <th className="th-po bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-[52px] z-5 min-w-[80px]">PO</th>
              <th className="th-value num bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-[52px] z-5 min-w-[90px] text-right font-variant-[tabular-nums]">PO Value</th>
              <th className="th-route bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-[52px] z-5 min-w-[80px]">Origin</th>
              <th className="th-route bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-[52px] z-5 min-w-[80px]">Dest</th>
              <th className="th-mode bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-[52px] z-5 w-auto">Mode</th>
              <th className="th-size bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-[52px] z-5 min-w-[80px]">Size</th>
              <th className="th-transit bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-[52px] z-5 min-w-[60px]">Transit</th>
              <th className="th-date bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-[52px] z-5 min-w-[85px] text-[11px]">ETD</th>
              <th className="th-date bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-[52px] z-5 min-w-[85px] text-[11px]">ETA</th>
              <th className="th-inco bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-[52px] z-5 w-auto">Inco</th>
              <th className="th-status bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-[52px] z-5 w-auto">Status</th>
              <th className="th-pct num bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-[52px] z-5 min-w-[45px] text-right font-variant-[tabular-nums]">%</th>
              <th className="th-savings num bg-[var(--card-bg)] px-2.5 py-3 text-left font-semibold text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap border-b-2 border-[var(--border)] sticky top-[52px] z-5 min-w-[80px] text-right font-variant-[tabular-nums]">Savings</th>
            </tr>
          </thead>
          <tbody>
            {quotations.length === 0 ? (
              <tr>
                <td colSpan={16}>
                  <div className="empty-state text-center py-[60px] px-5 text-[var(--text-muted)]">
                    <div className="empty-state-icon text-[48px] mb-4">{'\uD83D\uDD0D'}</div>
                    <div className="empty-state-text text-[15px] font-medium">No quotations found</div>
                  </div>
                </td>
              </tr>
            ) : (
              quotations.map((q, i) => {
                const isExpanded = expandedRows.has(q.id);
                return (
                  <Fragment key={q.id}>
                    <tr
                      style={{ animationDelay: `${i * 30}ms` }}
                      className={`animate-row quote-row cursor-pointer ${isExpanded ? 'quote-row-expanded' : ''}`}
                      onClick={() => toggleRow(q.id)}
                    >
                      <td className="td-expand text-center px-1.5">
                        <span className={`expand-icon inline-block text-[10px] text-[var(--text-muted)] transition-transform duration-200 ${isExpanded ? 'expanded' : ''}`}>{'\u25B6'}</span>
                      </td>
                      <td><span className={`entity-badge inline-flex items-center px-2.5 py-[3px] rounded-full text-[11px] font-bold tracking-[0.04em] uppercase entity-${q.entity.toLowerCase()}`}>{q.entity}</span></td>
                      <td className="td-supplier font-semibold max-w-[140px] overflow-hidden text-ellipsis text-[13px]">{q.supplierName}</td>
                      <td className="td-mono font-['SF_Mono',Consolas,monospace] text-xs">{q.supplierPO}</td>
                      <td className="num td-value text-right font-variant-[tabular-nums] font-semibold text-[var(--text)] text-[13px]">{fmt(q.poValue)}</td>
                      <td>{q.origin}</td>
                      <td>{q.destination}</td>
                      <td><span className="mode-tag inline-flex items-center px-[7px] py-[2px] rounded text-[12px]">{getModeIcon(q.mode)} {q.mode}</span></td>
                      <td className="td-size text-xs text-[var(--text-secondary)]">{q.size}</td>
                      <td className="td-transit text-xs text-[var(--text-secondary)]">{q.transitTime || '-'}</td>
                      <td className="td-date text-[var(--text-secondary)] whitespace-nowrap text-[13px]">{q.etd || '-'}</td>
                      <td className="td-date text-[var(--text-secondary)] whitespace-nowrap text-[13px]">{q.eta || '-'}</td>
                      <td><span className="inco-tag inline-flex items-center px-[7px] py-[2px] rounded text-[12px]">{q.incoterms}</span></td>
                      <td onClick={e => e.stopPropagation()}>
                        <select
                          className={`status-select text-[12px] px-2 py-1 rounded border cursor-pointer ${getStatusClass(q.status)}`}
                          value={q.status}
                          onChange={e => onStatusChange(q.id, e.target.value)}
                        >
                          {STATUS_LIST.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="num text-right font-variant-[tabular-nums] font-medium">{Number.isFinite(q.percentage) ? q.percentage : 0}%</td>
                      <td className="num td-savings text-right font-variant-[tabular-nums] font-semibold text-[var(--text-secondary)]">{q.savings > 0 ? fmt(q.savings) : '-'}</td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${q.id}-quotes`} className="quotes-expand-row">
                        <td colSpan={16} className="p-0">
                          <div className="quotes-expand-panel bg-gradient-to-br from-[rgba(129,140,248,0.04)] to-[rgba(34,211,238,0.04)] border-t border-b border-[var(--border)] p-3 px-4 animate-[expandSlideIn_0.25s_ease]">
                            <div className="quotes-expand-top flex items-center justify-between mb-2.5">
                              <div className="quotes-expand-title text-[13px] font-bold text-[var(--text-primary)] tracking-tight">{'\uD83D\uDCB3'} Forwarder Quotes {q.savings > 0 && <span className="savings-badge inline-flex items-center px-2 py-[2px] rounded-[10px] text-[11px] font-semibold bg-[rgba(16,185,129,0.1)] text-[var(--text-secondary)] ml-2">Savings: AED {fmt(q.savings)}</span>}</div>
                              <div className="quotes-expand-actions flex gap-1.5">
                                <button className="btn btn-sm btn-edit flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all" onClick={() => onEdit(q)}>
                                  {'\u270F\uFE0F'} Edit
                                </button>
                                <button className="btn btn-sm btn-delete flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all" onClick={() => onDelete(q.id)}>
                                  {'\uD83D\uDDD1\uFE0F'} Delete
                                </button>
                              </div>
                            </div>
                            <div className="quotes-expand-grid flex flex-wrap gap-1.5">
                              {q.quotes.filter(qt => qt.quotedAmount > 0).map(qt => {
                                const f = qt.forwarder;
                                const amount = qt.quotedAmount;
                                return (
                                  <div key={f} className={`quotes-expand-card inline-flex items-center gap-3 bg-[var(--card-bg)] rounded-md px-3 py-1.5 border border-[var(--border-light)] transition-all ${getAwardClass(f, q.awardedTo)}`}>
                                    <div className="quotes-expand-card-name text-xs font-semibold text-[var(--text-primary)] tracking-tight">{f}</div>
                                    <div className="quotes-expand-card-amount text-[13px] font-bold text-[var(--text-primary)] tracking-tight">AED {fmt(amount)}</div>
                                    <button
                                      className="btn-award-expand inline-flex items-center gap-[3px] px-2.5 py-[3px] rounded-[12px] text-[11px] font-semibold cursor-pointer border border-[var(--border-light)] bg-[var(--card-bg)] text-[var(--text-secondary)] transition-all ml-1 hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)]"
                                      title={`Award to ${f}`}
                                      onClick={() => onAward(q.id, f)}
                                    >
                                      {q.awardedTo === f ? '\u2605 Awarded' : '\u2606 Award'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                            {q.remarks && <div className="quotes-expand-remarks mt-2.5 p-3 rounded-md bg-[var(--bg)] text-xs text-[var(--text-secondary)] border border-[var(--border-light)]">{'\uD83D\uDCCB'} {q.remarks}</div>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-cards mobile-only flex flex-col gap-3">
        {quotations.length === 0 ? (
          <div className="empty-state text-center py-[60px] px-5 text-[var(--text-muted)]">
            <div className="empty-state-icon text-[48px] mb-4">{'\uD83D\uDD0D'}</div>
            <div className="empty-state-text text-[15px] font-medium">No quotations found</div>
          </div>
        ) : (
          quotations.map((q, i) => (
            <div key={q.id} className="quotation-card bg-[var(--card-bg)] rounded-xl border border-[var(--border-light)] shadow-[var(--card-shadow)] p-4" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="card-header flex items-center justify-between mb-2">
                <span className={`entity-badge inline-flex items-center px-2.5 py-[3px] rounded-full text-[11px] font-bold tracking-[0.04em] uppercase entity-${q.entity.toLowerCase()}`}>{q.entity}</span>
                <select
                  className={`status-select status-select-sm text-[12px] px-2 py-1 rounded border cursor-pointer ${getStatusClass(q.status)}`}
                  value={q.status}
                  onChange={e => onStatusChange(q.id, e.target.value)}
                >
                  {STATUS_LIST.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="card-supplier text-base font-semibold text-[var(--text-primary)] mb-1">{q.supplierName}</div>
              <div className="card-po font-['SF_Mono',Consolas,monospace] text-xs text-[var(--text-secondary)] mb-1">{q.supplierPO}</div>
              <div className="card-value text-lg font-bold text-[var(--text)]">{fmt(q.poValue)}</div>
              <div className="card-route flex items-center gap-2 text-sm text-[var(--text-secondary)] my-2">
                <span>{q.origin}</span>
                <span className="card-arrow text-[var(--text-muted)]">{'\u2192'}</span>
                <span>{q.destination}</span>
              </div>
              <div className="card-details flex flex-wrap items-center gap-2 mb-2">
                <span className="mode-tag inline-flex items-center px-[7px] py-[2px] rounded text-[12px]">{getModeIcon(q.mode)} {q.mode}</span>
                <span className="inco-tag inline-flex items-center px-[7px] py-[2px] rounded text-[12px]">{q.incoterms}</span>
                {q.transitTime && <span className="transit-tag inline-flex items-center px-2 py-[2px] rounded text-[12px] bg-[var(--info-bg)] text-[var(--info)]">{'\u23F1\uFE0F'} {q.transitTime}</span>}
              </div>
              {(q.etd || q.eta) && (
                <div className="card-dates flex flex-wrap gap-2 mt-1.5">
                  {q.etd && <span className="date-tag text-xs px-2.5 py-[3px] rounded-md bg-[var(--primary-bg)] text-[var(--primary)] font-medium">{'\u2693\uFE0F'} ETD: {q.etd}</span>}
                  {q.eta && <span className="date-tag text-xs px-2.5 py-[3px] rounded-md bg-[var(--primary-bg)] text-[var(--primary)] font-medium">{'\uD83D\uDCCD'} ETA: {q.eta}</span>}
                </div>
              )}
              {q.size && <div className="card-size text-sm text-[var(--text-secondary)] mt-2">{'\uD83D\uDCE6'} {q.size}</div>}
              {q.savings > 0 && <div className="card-savings text-sm font-semibold text-[var(--success)] mt-2">{'\uD83D\uDCB0'} Savings: AED {fmt(q.savings)}</div>}
              <button
                className={`card-quotes-toggle w-full flex items-center justify-between py-2 mt-3 text-sm font-semibold text-[var(--primary)] border-t border-[var(--border-light)] cursor-pointer transition-all ${mobileExpandedCards.has(q.id) ? 'expanded' : ''}`}
                onClick={() => toggleMobileCard(q.id)}
              >
                {'\uD83D\uDCB3'} Forwarder Quotes ({q.quotes.filter(qt => qt.quotedAmount > 0).length})
                <span className={`expand-icon inline-block text-[10px] text-[var(--text-muted)] transition-transform duration-200 ${mobileExpandedCards.has(q.id) ? 'expanded' : ''}`}>{'\u25B6'}</span>
              </button>
              {mobileExpandedCards.has(q.id) && (
                <div className="card-quotes flex flex-col gap-1.5 mt-2">
                  {q.quotes.filter(qt => qt.quotedAmount > 0).map(qt => {
                    return (
                      <div key={qt.forwarder} className={`card-quote flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border-light)] bg-[var(--card-bg)] transition-all ${getAwardClass(qt.forwarder, q.awardedTo)}`}>
                        <span className="card-quote-name text-sm font-semibold text-[var(--text-primary)]">{qt.forwarder}</span>
                        <span className="card-quote-value text-sm font-bold text-[var(--text-primary)]">{fmt(qt.quotedAmount)}</span>
                        <button
                          className="btn-award w-8 h-8 flex items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--card-bg)] text-[var(--text-secondary)] cursor-pointer transition-all hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)]"
                          title={`Award to ${qt.forwarder}`}
                          onClick={() => onAward(q.id, qt.forwarder)}
                        >
                          {q.awardedTo === qt.forwarder ? '\u2605' : '\u2606'}
                        </button>
                      </div>
                    );
                  })}
                  {q.quotes.filter(qt => qt.quotedAmount > 0).length === 0 && (
                    <div className="card-quote-empty text-center py-4 text-sm text-[var(--text-muted)]">No quotes yet</div>
                  )}
                </div>
              )}
              <div className="card-footer flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-light)]">
                <span className="card-pct text-sm font-semibold text-[var(--text-secondary)]">{Number.isFinite(q.percentage) ? q.percentage : 0}%</span>
                <div className="card-actions flex items-center gap-2">
                  <button className="btn btn-sm btn-edit flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all" onClick={() => onEdit(q)}>{'\u270F\uFE0F'} Edit</button>
                  <button className="btn btn-sm btn-delete flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all" onClick={() => onDelete(q.id)}>{'\uD83D\uDDD1\uFE0F'} Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
