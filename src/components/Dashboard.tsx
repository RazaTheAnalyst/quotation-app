import { ENTITIES } from '../types';
import type { Quotation, Forwarder } from '../types';

interface DashboardProps {
  quotations: Quotation[];
  forwarders: Forwarder[];
}

export default function Dashboard({ quotations, forwarders }: DashboardProps) {
  const totalPOValue = quotations.reduce((sum, q) => sum + q.poValue, 0);
  const totalQuotations = quotations.length;

  const totalFreightSpending = quotations.reduce((sum, q) => {
    if (!q.awardedTo) return sum;
    const awardedQuote = q.quotes.find(qu => qu.forwarder === q.awardedTo);
    return sum + (awardedQuote?.quotedAmount ?? 0);
  }, 0);

  const totalSavings = quotations.reduce((sum, q) => sum + (q.savings ?? 0), 0);

  const freightVsPO = totalPOValue > 0
    ? ((totalFreightSpending / totalPOValue) * 100).toFixed(1)
    : '0.0';

  const forwarderNames = forwarders.map(f => f.name);

  const forwarderStats = forwarderNames.map(f => {
    const awarded = quotations.filter(q => q.awardedTo === f);
    const totalValue = awarded.reduce((sum, q) => {
      const quote = q.quotes.find(qu => qu.forwarder === f);
      return sum + (quote?.quotedAmount ?? 0);
    }, 0);
    return { forwarder: f, count: awarded.length, totalValue };
  });

  const maxForwarderValue = Math.max(...forwarderStats.map(f => f.totalValue), 1);

  const entityStats = ENTITIES.map(e => {
    const items = quotations.filter(q => q.entity === e);
    const entityFreight = items.reduce((sum, q) => {
      if (!q.awardedTo) return sum;
      const awardedQuote = q.quotes.find(qu => qu.forwarder === q.awardedTo);
      return sum + (awardedQuote?.quotedAmount ?? 0);
    }, 0);
    const entityPOValue = items.reduce((s, q) => s + q.poValue, 0);
    const entityFreightPct = entityPOValue > 0 ? ((entityFreight / entityPOValue) * 100).toFixed(1) : '0.0';
    return { entity: e, count: items.length, totalValue: entityPOValue, freight: entityFreight, freightPct: entityFreightPct };
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <h2>Quotation Overview</h2>
        <p>Track and manage your logistics quotations across all entities</p>
      </div>

      <div className="stats-grid stats-grid-6">
        <div className="stat-card purple">
          <div className="stat-icon">&#x1F4CB;</div>
          <div className="stat-label">Total POs</div>
          <div className="stat-value">{totalQuotations}</div>
          <div className="stat-sub">{ENTITIES.length} entities</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon">&#x1F4B0;</div>
          <div className="stat-label">Total PO Value</div>
          <div className="stat-value">{formatCurrency(totalPOValue)}</div>
          <div className="stat-sub">AED</div>
        </div>
        <div className="stat-card pink">
          <div className="stat-icon">&#x1F69A;</div>
          <div className="stat-label">Freight Spending</div>
          <div className="stat-value">{formatCurrency(totalFreightSpending)}</div>
          <div className="stat-sub">AED</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon">&#x1F4CA;</div>
          <div className="stat-label">Freight vs PO</div>
          <div className="stat-value">{freightVsPO}%</div>
          <div className="stat-sub">of PO value</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">&#x1F4B0;</div>
          <div className="stat-label">Total Savings</div>
          <div className="stat-value">{formatCurrency(totalSavings)}</div>
          <div className="stat-sub">AED saved</div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="stat-section">
          <h3>Forwarder Performance</h3>
          <div className="forwarder-bars">
            {forwarderStats.map(f => (
              <div key={f.forwarder} className="forwarder-bar-item">
                <div className="forwarder-bar-header">
                  <span className="forwarder-bar-name">{f.forwarder}</span>
                  <span className="forwarder-bar-value">
                    {f.count} award{f.count !== 1 ? 's' : ''} &middot; AED {formatCurrency(f.totalValue)}
                  </span>
                </div>
                <div className="forwarder-bar-track">
                  <div
                    className="forwarder-bar-fill"
                    style={{ width: `${(f.totalValue / maxForwarderValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stat-section">
          <h3>By Entity</h3>
          <div className="entity-cards">
            {entityStats.map(e => (
              <div key={e.entity} className={`entity-card entity-${e.entity.toLowerCase()}`}>
                <div className="entity-card-header">
                  <span className="entity-card-name">{e.entity}</span>
                  <span className="entity-card-count">{e.count} POs</span>
                </div>
                <div className="entity-card-value">AED {formatCurrency(e.totalValue)}</div>
                <div className="entity-card-freight">Freight: AED {formatCurrency(e.freight)}</div>
                <div className="entity-card-pct">{e.freightPct}% of PO Value</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
