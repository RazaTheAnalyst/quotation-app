import { ENTITIES } from '../types';
import type { Quotation, Forwarder } from '../types';

interface DashboardProps {
  quotations: Quotation[];
  forwarders: Forwarder[];
}

const ENTITY_GRADIENT: Record<string, string> = {
  UAE: 'linear-gradient(135deg, rgba(129,140,248,0.08), rgba(34,211,238,0.08))',
  Qatar: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(244,114,182,0.08))',
  Oman: 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(52,211,153,0.05))',
  KSA: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(251,191,36,0.05))',
};

const STAT_TOP_GRADIENT: Record<string, string> = {
  purple: 'linear-gradient(90deg, var(--purple), var(--primary))',
  cyan: 'linear-gradient(90deg, var(--cyan), var(--info))',
  green: 'linear-gradient(90deg, var(--success), var(--success))',
  amber: 'linear-gradient(90deg, var(--warning), var(--warning))',
  pink: 'linear-gradient(90deg, var(--pink), var(--pink))',
};

const STAT_ICON_STYLE: Record<string, { bg: string; color: string }> = {
  purple: { bg: 'var(--purple-bg)', color: 'var(--purple)' },
  cyan: { bg: 'var(--cyan-bg)', color: 'var(--cyan)' },
  green: { bg: 'var(--success-bg)', color: 'var(--success)' },
  amber: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  pink: { bg: 'var(--pink-bg)', color: 'var(--pink)' },
};

const H3_ACCENT_BAR = { background: 'linear-gradient(180deg, var(--primary), var(--cyan))' };

export default function Dashboard({ quotations, forwarders }: DashboardProps) {
  const safeNum = (v: number) => (Number.isFinite(v) ? v : 0);
  const totalPOValue = safeNum(quotations.reduce((sum, q) => sum + (Number.isFinite(q.poValue) ? q.poValue : 0), 0));
  const totalQuotations = quotations.length;

  const totalFreightSpending = safeNum(quotations.reduce((sum, q) => {
    if (!q.awardedTo) return sum;
    const awardedQuote = q.quotes.find(qu => qu.forwarder === q.awardedTo);
    return sum + (awardedQuote?.quotedAmount ?? 0);
  }, 0));

  const totalSavings = safeNum(quotations.reduce((sum, q) => sum + (q.savings ?? 0), 0));

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

  const statCards: Array<{ key: string; color: string; icon: string; label: string; value: string; sub: string }> = [
    { key: 'pos', color: 'purple', icon: '\u{1F4CB}', label: 'Total POs', value: String(totalQuotations), sub: `${ENTITIES.length} entities` },
    { key: 'povalue', color: 'cyan', icon: '\u{1F4B0}', label: 'Total PO Value', value: formatCurrency(totalPOValue), sub: 'AED' },
    { key: 'freight', color: 'pink', icon: '\u{1F69A}', label: 'Freight Spending', value: formatCurrency(totalFreightSpending), sub: 'AED' },
    { key: 'pct', color: 'amber', icon: '\u{1F4CA}', label: 'Freight vs PO', value: `${freightVsPO}%`, sub: 'of PO value' },
    { key: 'savings', color: 'green', icon: '\u{1F4B0}', label: 'Total Savings', value: formatCurrency(totalSavings), sub: 'AED saved' },
  ];

  return (
    <div className="flex flex-col gap-7">
      <div
        className="relative overflow-hidden rounded-[var(--radius-xl)] px-10 py-9 text-white"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)' }}
      >
        <h2 className="relative z-10 mb-1.5 text-[28px] font-bold">Quotation Overview</h2>
        <p className="relative z-10 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Track and manage your logistics quotations across all entities
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {statCards.map(sc => {
          const iconStyle = STAT_ICON_STYLE[sc.color] ?? { bg: 'var(--primary-bg)', color: 'var(--primary)' };
          return (
            <div
              key={sc.key}
              className="group relative overflow-hidden rounded-[var(--radius-lg)] border p-6 transition-[var(--transition-slow)] hover:-translate-y-0.5 hover:shadow-[var(--card-shadow-hover)]"
              style={{
                background: 'var(--card-bg)',
                borderColor: 'var(--border-light)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: STAT_TOP_GRADIENT[sc.color] }}
              />
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-[var(--radius)] text-xl"
                style={{ background: iconStyle.bg, color: iconStyle.color }}
              >
                {sc.icon}
              </div>
              <div
                className="mb-1.5 text-xs font-medium uppercase tracking-widest"
                style={{ color: 'var(--text-secondary)' }}
              >
                {sc.label}
              </div>
              <div className="text-[28px] font-bold tracking-tight">{sc.value}</div>
              <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{sc.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div
          className="rounded-[var(--radius-lg)] border p-6"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--border-light)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <h3 className="mb-4 flex items-center gap-2 text-[15px] font-semibold">
            <span className="inline-block h-[18px] w-1 rounded" style={H3_ACCENT_BAR} />
            Forwarder Performance
          </h3>
          <div className="flex flex-col gap-3.5">
            {forwarderStats.map(f => (
              <div key={f.forwarder} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold">{f.forwarder}</span>
                  <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                    {f.count} award{f.count !== 1 ? 's' : ''} &middot; AED {formatCurrency(f.totalValue)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded" style={{ background: 'var(--bg)' }}>
                  <div
                    className="h-full rounded transition-[width_0.6s_cubic-bezier(0.4,0,0.2,1)]"
                    style={{
                      width: `${(f.totalValue / maxForwarderValue) * 100}%`,
                      background: 'linear-gradient(90deg, var(--primary), var(--cyan))',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-[var(--radius-lg)] border p-6"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--border-light)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <h3 className="mb-4 flex items-center gap-2 text-[15px] font-semibold">
            <span className="inline-block h-[18px] w-1 rounded" style={H3_ACCENT_BAR} />
            By Entity
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {entityStats.map(e => (
              <div
                key={e.entity}
                className="rounded-[var(--radius)] border-2 p-4 transition-[var(--transition)] hover:border-[var(--primary-light)]"
                style={{
                  background: ENTITY_GRADIENT[e.entity],
                  borderColor: 'var(--border-light)',
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-base font-bold">{e.entity}</span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}
                  >
                    {e.count} POs
                  </span>
                </div>
                <div className="text-xl font-bold tracking-tight">AED {formatCurrency(e.totalValue)}</div>
                <div className="mt-1 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                  Freight: AED {formatCurrency(e.freight)}
                </div>
                <div className="mt-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                  {e.freightPct}% of PO Value
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
