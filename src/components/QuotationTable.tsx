import { FORWARDERS } from '../types';
import type { Quotation } from '../types';

interface QuotationTableProps {
  quotations: Quotation[];
  onEdit: (quotation: Quotation) => void;
  onDelete: (id: number) => void;
  onAward: (id: number, forwarder: string) => void;
}

export default function QuotationTable({ quotations, onEdit, onDelete, onAward }: QuotationTableProps) {
  const fmt = (val: number) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

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

  return (
    <>
      {/* Desktop Table */}
      <div className="table-container desktop-only">
        <table>
          <thead>
            <tr>
              <th className="th-entity">Entity</th>
              <th className="th-supplier">Supplier</th>
              <th className="th-po">PO</th>
              <th className="th-value num">PO Value</th>
              <th className="th-route">Origin</th>
              <th className="th-route">Dest</th>
              <th className="th-mode">Mode</th>
              <th className="th-size">Size</th>
              <th className="th-transit">Transit</th>
              <th className="th-inco">Inco</th>
              {FORWARDERS.map(f => (
                <th key={f} className="th-quote num">{f}</th>
              ))}
              <th className="th-status">Status</th>
              <th className="th-pct num">%</th>
              <th className="th-remarks">Remarks</th>
              <th className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotations.length === 0 ? (
              <tr>
                <td colSpan={17}>
                  <div className="empty-state">
                    <div className="empty-state-icon">{'\uD83D\uDD0D'}</div>
                    <div className="empty-state-text">No quotations found</div>
                  </div>
                </td>
              </tr>
            ) : (
              quotations.map((q, i) => (
                <tr key={q.id} style={{ animationDelay: `${i * 30}ms` }} className="animate-row">
                  <td><span className={`entity-badge entity-${q.entity.toLowerCase()}`}>{q.entity}</span></td>
                  <td className="td-supplier">{q.supplierName}</td>
                  <td className="td-mono">{q.supplierPO}</td>
                  <td className="num td-value">{fmt(q.poValue)}</td>
                  <td>{q.origin}</td>
                  <td>{q.destination}</td>
                  <td><span className="mode-tag">{getModeIcon(q.mode)} {q.mode}</span></td>
                  <td className="td-size">{q.size}</td>
                  <td className="td-transit">{q.transitTime || '-'}</td>
                  <td><span className="inco-tag">{q.incoterms}</span></td>
                  {FORWARDERS.map(f => {
                    const quote = q.quotes.find(qu => qu.forwarder === f);
                    return (
                      <td key={f} className={`num ${getAwardClass(f, q.awardedTo)}`}>
                        {quote ? fmt(quote.quotedAmount) : '-'}
                        {quote && quote.quotedAmount > 0 && (
                          <button
                            className="btn-award"
                            title={`Award to ${f}`}
                            onClick={() => onAward(q.id, f)}
                          >
                            {q.awardedTo === f ? '\u2605' : '\u2606'}
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td>
                    <span className={`badge ${q.awardedTo ? 'badge-awarded' : 'badge-pending'}`}>
                      {q.awardedTo || 'Pending'}
                    </span>
                  </td>
                  <td className="num">{q.percentage}%</td>
                  <td className="td-remarks">{q.remarks || '-'}</td>
                  <td className="actions">
                    <button className="btn-icon btn-edit-icon" title="Edit" onClick={() => onEdit(q)}>
                      {'\u270F\uFE0F'}
                    </button>
                    <button className="btn-icon btn-delete-icon" title="Delete" onClick={() => onDelete(q.id)}>
                      {'\uD83D\uDDD1\uFE0F'}
                    </button>
                  </td>
                </tr>
              ))
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
                <span className={`badge ${q.awardedTo ? 'badge-awarded' : 'badge-pending'}`}>
                  {q.awardedTo || 'Pending'}
                </span>
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
              {q.size && <div className="card-size">{'\uD83D\uDCE6'} {q.size}</div>}
              <div className="card-quotes">
                {FORWARDERS.map(f => {
                  const quote = q.quotes.find(qu => qu.forwarder === f);
                  return (
                    <div key={f} className={`card-quote ${getAwardClass(f, q.awardedTo)}`}>
                      <span className="card-quote-name">{f}</span>
                      <span className="card-quote-value">{quote ? fmt(quote.quotedAmount) : '-'}</span>
                      {quote && quote.quotedAmount > 0 && (
                        <button
                          className="btn-award"
                          title={`Award to ${f}`}
                          onClick={() => onAward(q.id, f)}
                        >
                          {q.awardedTo === f ? '\u2605' : '\u2606'}
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
