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

  const fmt = (val: number) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const exportToExcel = () => {
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
      Remarks: q.remarks,
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
  };

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
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
      <div className="table-toolbar">
        <button className="btn btn-export" onClick={exportToExcel}>
          {'\uD83D\uDCE5'} Export Excel
        </button>
      </div>
      {/* Desktop Table */}
      <div className="table-container desktop-only">
        <table>
          <thead>
            <tr>
              <th className="th-expand"></th>
              <th className="th-entity">Entity</th>
              <th className="th-supplier">Supplier</th>
              <th className="th-po">PO</th>
              <th className="th-value num">PO Value</th>
              <th className="th-route">Origin</th>
              <th className="th-route">Dest</th>
              <th className="th-mode">Mode</th>
              <th className="th-size">Size</th>
              <th className="th-transit">Transit</th>
              <th className="th-date">ETD</th>
              <th className="th-date">ETA</th>
              <th className="th-inco">Inco</th>
              <th className="th-status">Status</th>
              <th className="th-pct num">%</th>
              <th className="th-remarks">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {quotations.length === 0 ? (
              <tr>
                <td colSpan={16}>
                  <div className="empty-state">
                    <div className="empty-state-icon">{'\uD83D\uDD0D'}</div>
                    <div className="empty-state-text">No quotations found</div>
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
                      className={`animate-row quote-row ${isExpanded ? 'quote-row-expanded' : ''}`}
                      onClick={() => toggleRow(q.id)}
                    >
                      <td className="td-expand">
                        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>{'\u25B6'}</span>
                      </td>
                      <td><span className={`entity-badge entity-${q.entity.toLowerCase()}`}>{q.entity}</span></td>
                      <td className="td-supplier">{q.supplierName}</td>
                      <td className="td-mono">{q.supplierPO}</td>
                      <td className="num td-value">{fmt(q.poValue)}</td>
                      <td>{q.origin}</td>
                      <td>{q.destination}</td>
                      <td><span className="mode-tag">{getModeIcon(q.mode)} {q.mode}</span></td>
                      <td className="td-size">{q.size}</td>
                      <td className="td-transit">{q.transitTime || '-'}</td>
                      <td className="td-date">{q.etd || '-'}</td>
                      <td className="td-date">{q.eta || '-'}</td>
                      <td><span className="inco-tag">{q.incoterms}</span></td>
                      <td onClick={e => e.stopPropagation()}>
                        <select
                          className={`status-select ${getStatusClass(q.status)}`}
                          value={q.status}
                          onChange={e => onStatusChange(q.id, e.target.value)}
                        >
                          {STATUS_LIST.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="num">{q.percentage}%</td>
                      <td className="td-remarks">{q.remarks || '-'}</td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${q.id}-quotes`} className="quotes-expand-row">
                        <td colSpan={16}>
                          <div className="quotes-expand-panel">
                            <div className="quotes-expand-top">
                              <div className="quotes-expand-title">{'\uD83D\uDCB3'} Forwarder Quotes</div>
                              <div className="quotes-expand-actions">
                                <button className="btn btn-sm btn-edit" onClick={() => onEdit(q)}>
                                  {'\u270F\uFE0F'} Edit
                                </button>
                                <button className="btn btn-sm btn-delete" onClick={() => onDelete(q.id)}>
                                  {'\uD83D\uDDD1\uFE0F'} Delete
                                </button>
                              </div>
                            </div>
                            <div className="quotes-expand-grid">
                              {q.quotes.filter(qt => qt.quotedAmount > 0).map(qt => {
                                const f = qt.forwarder;
                                const amount = qt.quotedAmount;
                                return (
                                  <div key={f} className={`quotes-expand-card ${getAwardClass(f, q.awardedTo)}`}>
                                    <div className="quotes-expand-card-name">{f}</div>
                                    <div className="quotes-expand-card-amount">AED {fmt(amount)}</div>
                                    <button
                                      className="btn-award-expand"
                                      title={`Award to ${f}`}
                                      onClick={() => onAward(q.id, f)}
                                    >
                                      {q.awardedTo === f ? '\u2605 Awarded' : '\u2606 Award'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
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
      <div className="mobile-cards mobile-only">
        {quotations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{'\uD83D\uDD0D'}</div>
            <div className="empty-state-text">No quotations found</div>
          </div>
        ) : (
          quotations.map((q, i) => (
            <div key={q.id} className="quotation-card" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="card-header">
                <span className={`entity-badge entity-${q.entity.toLowerCase()}`}>{q.entity}</span>
                <select
                  className={`status-select status-select-sm ${getStatusClass(q.status)}`}
                  value={q.status}
                  onChange={e => onStatusChange(q.id, e.target.value)}
                >
                  {STATUS_LIST.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="card-supplier">{q.supplierName}</div>
              <div className="card-po">{q.supplierPO}</div>
              <div className="card-value">{fmt(q.poValue)}</div>
              <div className="card-route">
                <span>{q.origin}</span>
                <span className="card-arrow">{'\u2192'}</span>
                <span>{q.destination}</span>
              </div>
              <div className="card-details">
                <span className="mode-tag">{getModeIcon(q.mode)} {q.mode}</span>
                <span className="inco-tag">{q.incoterms}</span>
                {q.transitTime && <span className="transit-tag">{'\u23F1\uFE0F'} {q.transitTime}</span>}
              </div>
              {(q.etd || q.eta) && (
                <div className="card-dates">
                  {q.etd && <span className="date-tag">{'\u2693\uFE0F'} ETD: {q.etd}</span>}
                  {q.eta && <span className="date-tag">{'\uD83D\uDCCD'} ETA: {q.eta}</span>}
                </div>
              )}
              {q.size && <div className="card-size">{'\uD83D\uDCE6'} {q.size}</div>}
              <div className="card-quotes">
                {forwarders.map(fwd => {
                  const quote = q.quotes.find(qu => qu.forwarder === fwd.name);
                  return (
                    <div key={fwd.id} className={`card-quote ${getAwardClass(fwd.name, q.awardedTo)}`}>
                      <span className="card-quote-name">{fwd.name}</span>
                      <span className="card-quote-value">{quote ? fmt(quote.quotedAmount) : '-'}</span>
                      {quote && quote.quotedAmount > 0 && (
                        <button
                          className="btn-award"
                          title={`Award to ${fwd.name}`}
                          onClick={() => onAward(q.id, fwd.name)}
                        >
                          {q.awardedTo === fwd.name ? '\u2605' : '\u2606'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {q.remarks && <div className="card-remarks">{'\uD83D\uDCCB'} {q.remarks}</div>}
              <div className="card-footer">
                <span className="card-pct">{q.percentage}%</span>
                <div className="card-actions">
                  <button className="btn btn-sm btn-edit" onClick={() => onEdit(q)}>{'\u270F\uFE0F'} Edit</button>
                  <button className="btn btn-sm btn-delete" onClick={() => onDelete(q.id)}>{'\uD83D\uDDD1\uFE0F'} Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
