import { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ENTITIES, STATUS_LIST, CURRENCY_LIST, convertCurrency } from '../types';
import type { Quotation, Forwarder } from '../types';
import { COUNTRIES, INCOTERMS_LIST, MODES_LIST } from '../locations';
import { useAuth } from '../auth';

const quotationSchema = z.object({
  entity: z.enum(['UAE', 'Qatar', 'Oman', 'KSA']),
  supplierName: z.string().min(1, 'Supplier name is required'),
  supplierPO: z.string().min(1, 'PO number is required'),
  poValue: z.coerce.number().positive('PO value must be greater than 0'),
  poValueCurrency: z.string().optional().default('AED'),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  mode: z.string().min(1, 'Mode is required'),
  size: z.string().optional().default(''),
  transitTime: z.string().optional().default(''),
  incoterms: z.string().min(1, 'Incoterms are required'),
  quotes: z.array(z.object({
    forwarder: z.string(),
    quotedAmount: z.coerce.number().min(0, 'Amount must be 0 or more'),
    currency: z.string().optional().default('AED'),
  })),
  awardedTo: z.string().optional().default(''),
  remarks: z.string().max(500, 'Remarks must be 500 characters or less').optional().default(''),
  etd: z.string().optional().default(''),
  eta: z.string().optional().default(''),
  status: z.string().optional().default('Pending'),
  savings: z.coerce.number().min(0).optional().default(0),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

interface QuotationFormProps {
  quotation: Quotation | null;
  forwarders: Forwarder[];
  onSave: (data: QuotationFormData & { percentage: number }) => void;
  onClose: () => void;
}

export default function QuotationForm({ quotation, forwarders, onSave, onClose }: QuotationFormProps) {
  const { user } = useAuth();
  const isAdmin = user?.email === 'admin@netceedmea.com';

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      entity: (quotation?.entity as 'UAE' | 'Qatar' | 'Oman' | 'KSA') ?? 'UAE',
      supplierName: quotation?.supplierName ?? '',
      supplierPO: quotation?.supplierPO ?? '',
      poValue: quotation?.poValue ?? 0,
      poValueCurrency: quotation?.poValueCurrency ?? 'AED',
      origin: quotation?.origin ?? '',
      destination: quotation?.destination ?? '',
      mode: quotation?.mode ?? '',
      size: quotation?.size ?? '',
      transitTime: quotation?.transitTime ?? '',
      incoterms: quotation?.incoterms ?? '',
      quotes: quotation?.quotes?.map(q => ({
        forwarder: q.forwarder,
        quotedAmount: q.quotedAmount,
        currency: q.currency ?? 'AED',
      })) ?? [{ forwarder: '', quotedAmount: 0, currency: 'AED' }],
      awardedTo: quotation?.awardedTo ?? '',
      remarks: quotation?.remarks ?? '',
      etd: quotation?.etd ?? '',
      eta: quotation?.eta ?? '',
      status: quotation?.status ?? 'Pending',
      savings: quotation?.savings ?? 0,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'quotes' });

  const poValue = watch('poValue');
  const poValueCurrency = watch('poValueCurrency') || 'AED';
  const awardedTo = watch('awardedTo');
  const quotes = watch('quotes') || [];
  const originValue = watch('origin');
  const destinationValue = watch('destination');

  const [originSearch, setOriginSearch] = useState(quotation?.origin ?? '');
  const [destinationSearch, setDestinationSearch] = useState(quotation?.destination ?? '');
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);

  const validQuotesConverted = useMemo(() => {
    return (quotes || []).filter(q => q.quotedAmount > 0).map(q => {
      const amtInPoCurrency = convertCurrency(q.quotedAmount, q.currency || 'AED', poValueCurrency);
      return {
        ...q,
        amountInPoCurrency: amtInPoCurrency,
      };
    });
  }, [quotes, poValueCurrency]);

  const lowestAmountInPoCurrency = validQuotesConverted.length > 0
    ? Math.min(...validQuotesConverted.map(q => q.amountInPoCurrency))
    : 0;

  const highestAmountInPoCurrency = validQuotesConverted.length > 0
    ? Math.max(...validQuotesConverted.map(q => q.amountInPoCurrency))
    : 0;

  const percentage = poValue > 0 ? ((lowestAmountInPoCurrency / poValue) * 100).toFixed(2) : '0.00';

  const autoSavings = validQuotesConverted.length >= 2
    ? Math.round((highestAmountInPoCurrency - lowestAmountInPoCurrency) * 100) / 100
    : null;

  const filteredOrigins = useMemo(() => {
    if (!originSearch) return COUNTRIES;
    const term = originSearch.toLowerCase();
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.cities.some(city => city.toLowerCase().includes(term))
    ).slice(0, 50);
  }, [originSearch]);

  const filteredDestinations = useMemo(() => {
    if (!destinationSearch) return COUNTRIES;
    const term = destinationSearch.toLowerCase();
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.cities.some(city => city.toLowerCase().includes(term))
    ).slice(0, 50);
  }, [destinationSearch]);

  const selectedOriginCountry = useMemo(() => {
    return COUNTRIES.find(c => c.cities.some(city => originValue === `${city}, ${c.name}`)) ?? null;
  }, [originValue]);

  const selectedDestCountry = useMemo(() => {
    return COUNTRIES.find(c => c.cities.some(city => destinationValue === `${city}, ${c.name}`)) ?? null;
  }, [destinationValue]);

  const handleOriginCitySelect = (city: string, country: string) => {
    const val = `${city}, ${country}`;
    setValue('origin', val, { shouldValidate: true });
    setOriginSearch(val);
    setShowOriginDropdown(false);
  };

  const handleDestCitySelect = (city: string, country: string) => {
    const val = `${city}, ${country}`;
    setValue('destination', val, { shouldValidate: true });
    setDestinationSearch(val);
    setShowDestinationDropdown(false);
  };

  const handleFormSubmit = (data: QuotationFormData) => {
    const validQ = data.quotes.filter(q => q.quotedAmount > 0);
    const validQConverted = validQ.map(q => ({
      ...q,
      amountInPoCurrency: convertCurrency(q.quotedAmount, q.currency || 'AED', data.poValueCurrency || 'AED'),
    }));
    const lowestAmtInPoCurrency = validQConverted.length > 0 ? Math.min(...validQConverted.map(q => q.amountInPoCurrency)) : 0;
    const highestAmtInPoCurrency = validQConverted.length > 0 ? Math.max(...validQConverted.map(q => q.amountInPoCurrency)) : 0;
    const percentageVal = data.poValue > 0 ? (lowestAmtInPoCurrency / data.poValue) * 100 : 0;
    let savingsVal = data.savings ?? 0;
    if (validQConverted.length >= 2) {
      savingsVal = Math.round((highestAmtInPoCurrency - lowestAmtInPoCurrency) * 100) / 100;
    }
    onSave({ ...data, percentage: Math.round(percentageVal * 100) / 100, savings: savingsVal } as QuotationFormData & { percentage: number; savings: number });
  };

  const handleAddForwarder = () => {
    const lastForwarder = forwarders[forwarders.length - 1];
    append({ forwarder: lastForwarder?.name ?? '', quotedAmount: 0, currency: 'AED' });
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const renderLocationDropdown = (
    type: 'origin' | 'destination',
    search: string,
    setSearch: (v: string) => void,
    show: boolean,
    setShow: (v: boolean) => void,
    filtered: typeof COUNTRIES,
    selectedCountry: typeof COUNTRIES[number] | null,
    onSelect: (city: string, country: string) => void,
  ) => {
    const currentValue = type === 'origin' ? originValue : destinationValue;
    return (
      <div className="location-dropdown-wrapper">
        <input
          className="w-full rounded border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
          type="text"
          placeholder="Search country or city..."
          value={search}
          onChange={e => { setSearch(e.target.value); setShow(true); }}
          onFocus={() => setShow(true)}
          onBlur={() => setTimeout(() => setShow(false), 200)}
        />
        {show && (
          <div className="location-dropdown">
            {filtered.length === 0 ? (
              <div className="location-dropdown-empty">No results found</div>
            ) : (
              filtered.map(country => (
                <div key={country.name} className="location-country-group">
                  <div className="location-country-name">{country.name}</div>
                  <div className="location-cities">
                    {country.cities.map(city => (
                      <button
                        key={city}
                        type="button"
                        className={`location-city-btn ${selectedCountry?.name === country.name && currentValue === `${city}, ${country.name}` ? 'selected' : ''}`}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => onSelect(city, country.name)}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={quotation ? 'Edit Quotation' : 'Add New Quotation'}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon">{quotation ? '\u270F\uFE0F' : '\u2795'}</span>
            <h2 className="m-0 text-lg font-semibold">{quotation ? 'Edit Quotation' : 'New Quotation'}</h2>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close">{'\u2715'}</button>
        </div>

        {/* Summary Bar */}
        {(validQuotesConverted.length > 0 || autoSavings !== null) && (
          <div className="form-summary-bar">
            {lowestAmountInPoCurrency > 0 && (
              <div className="summary-item">
                <span className="summary-label">Lowest Quote</span>
                <span className="summary-value summary-lowest">{poValueCurrency} {new Intl.NumberFormat('en-US').format(lowestAmountInPoCurrency)}</span>
              </div>
            )}
            {autoSavings !== null && (
              <div className="summary-item">
                <span className="summary-label">Savings</span>
                <span className="summary-value summary-savings">{poValueCurrency} {new Intl.NumberFormat('en-US').format(autoSavings)}</span>
              </div>
            )}
            {lowestAmountInPoCurrency > 0 && (
              <div className="summary-item">
                <span className="summary-label">Freight %</span>
                <span className="summary-value summary-pct">{percentage}%</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          {/* Section: Details */}
          <div className="form-section">
            <div className="form-section-header">
              <span className="section-icon">📝</span>
              <span>Details</span>
            </div>
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label className="mb-1 block text-sm font-medium" htmlFor="entity">🏢 Entity</label>
                <select className="w-full rounded border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" id="entity" {...register('entity')}>
                  {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="form-group form-group-wide">
                <label className="mb-1 block text-sm font-medium" htmlFor="supplierName">📦 Supplier</label>
                <input className="w-full rounded border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" id="supplierName" type="text" placeholder="Supplier name" {...register('supplierName')} />
                {errors.supplierName && <span className="error-text">{errors.supplierName.message}</span>}
              </div>
              <div className="form-group">
                <label className="mb-1 block text-sm font-medium" htmlFor="supplierPO">📄 PO Number</label>
                <input className="w-full rounded border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" id="supplierPO" type="text" placeholder="P227998" {...register('supplierPO')} />
                {errors.supplierPO && <span className="error-text">{errors.supplierPO.message}</span>}
              </div>
              <div className="form-group">
                <label className="mb-1 block text-sm font-medium" htmlFor="poValue">💵 PO Value</label>
                <div className="flex gap-2">
                  <input className="flex-1 rounded border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" id="poValue" type="number" step="0.01" placeholder="0.00" {...register('poValue')} />
                  <select className="w-[100px] rounded border border-[var(--border)] bg-[var(--bg-main)] px-2.5 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] cursor-pointer" {...register('poValueCurrency')}>
                    {CURRENCY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {errors.poValue && <span className="error-text">{errors.poValue.message}</span>}
              </div>
              <div className="form-group">
                <label className="mb-1 block text-sm font-medium" htmlFor="mode">🚢 Mode</label>
                <select className="w-full rounded border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" id="mode" {...register('mode')}>
                  <option value="">Select</option>
                  {MODES_LIST.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                {errors.mode && <span className="error-text">{errors.mode.message}</span>}
              </div>
              <div className="form-group">
                <label className="mb-1 block text-sm font-medium" htmlFor="incoterms">📜 Incoterms</label>
                <select className="w-full rounded border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" id="incoterms" {...register('incoterms')}>
                  <option value="">Select</option>
                  {INCOTERMS_LIST.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                </select>
                {errors.incoterms && <span className="error-text">{errors.incoterms.message}</span>}
              </div>
            </div>
          </div>

          {/* Section: Route */}
          <div className="form-section">
            <div className="form-section-header">
              <span className="section-icon">🛫</span>
              <span>Route</span>
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="mb-1 block text-sm font-medium">🛫 Origin</label>
                {renderLocationDropdown('origin', originSearch, setOriginSearch, showOriginDropdown, setShowOriginDropdown, filteredOrigins, selectedOriginCountry, handleOriginCitySelect)}
                {errors.origin && <span className="error-text">{errors.origin.message}</span>}
              </div>
              <div className="form-group">
                <label className="mb-1 block text-sm font-medium">🛬 Destination</label>
                {renderLocationDropdown('destination', destinationSearch, setDestinationSearch, showDestinationDropdown, setShowDestinationDropdown, filteredDestinations, selectedDestCountry, handleDestCitySelect)}
                {errors.destination && <span className="error-text">{errors.destination.message}</span>}
              </div>
            </div>
            <div className="form-grid form-grid-4 mt-3">
              <div className="form-group">
                <label className="mb-1 block text-sm font-medium" htmlFor="size">📐 Size</label>
                <input className="w-full rounded border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" id="size" type="text" placeholder="1x40 HQ" {...register('size')} />
              </div>
              <div className="form-group">
                <label className="mb-1 block text-sm font-medium" htmlFor="transitTime">⏳ Transit</label>
                <input className="w-full rounded border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" id="transitTime" type="text" placeholder="30 Days" {...register('transitTime')} />
              </div>
              <div className="form-group">
                <label className="mb-1 block text-sm font-medium" htmlFor="etd">📤 ETD</label>
                <input className="w-full rounded border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" id="etd" type="date" {...register('etd')} />
              </div>
              <div className="form-group">
                <label className="mb-1 block text-sm font-medium" htmlFor="eta">📥 ETA</label>
                <input className="w-full rounded border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" id="eta" type="date" {...register('eta')} />
              </div>
            </div>
          </div>

          {/* Section: Forwarder Quotes */}
          <div className="form-section">
            <div className="form-section-header">
              <span className="section-icon">📑</span>
              <span>Forwarder Quotes</span>
              <span className="section-count">{validQuotesConverted.length} of {fields.length}</span>
            </div>
            <div className="quotes-grid">
              {fields.map((field, index) => (
                <div key={field.id} className={`quote-card ${awardedTo === field.forwarder ? 'quote-card-active' : ''}`}>
                  <div className="quote-card-row">
                    <select
                      className="quote-card-forwarder-select flex-1 rounded border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                      {...register(`quotes.${index}.forwarder`)}
                    >
                      <option value="">-- Select --</option>
                      {forwarders.map(f => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                      ))}
                    </select>
                    <div className="quote-card-input flex gap-2">
                      <select
                        className="w-[85px] rounded border border-[var(--border)] bg-[var(--bg-main)] px-1.5 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] cursor-pointer"
                        {...register(`quotes.${index}.currency`)}
                      >
                        {CURRENCY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input
                        className="w-full rounded border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                        id={`quotes.${index}.quotedAmount`}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register(`quotes.${index}.quotedAmount` as const)}
                      />
                    </div>
                    {fields.length > 1 && (
                      <button type="button" className="quote-card-remove" onClick={() => remove(index)} title="Remove">
                        ✕
                      </button>
                    )}
                  </div>
                  {awardedTo === field.forwarder && <span className="quote-card-badge">⭐ Awarded</span>}
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-add-forwarder mt-3 flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--bg-main)] px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--card-bg)]" onClick={handleAddForwarder}>
              ➕ Add Quote
            </button>
          </div>

          {/* Section: Award */}
          <div className="form-section">
            <div className="form-section-header">
              <span className="section-icon">🏆</span>
              <span>Award</span>
            </div>
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label className="mb-1 block text-sm font-medium" htmlFor="status">📈 Status</label>
                <select 
                  className="w-full rounded border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] cursor-pointer" 
                  id="status" 
                  {...register('status')}
                >
                  {STATUS_LIST.filter(s => isAdmin || (s !== 'Awaiting Approval' && s !== 'Rejected')).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="mb-1 block text-sm font-medium" htmlFor="awardedTo">⭐ Awarded To</label>
                <select className="w-full rounded border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] cursor-pointer" id="awardedTo" {...register('awardedTo')}>
                  <option value="">-- Select --</option>
                  {forwarders.map(f => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="mb-1 block text-sm font-medium" htmlFor="savings">💵 Savings ({poValueCurrency})</label>
                {autoSavings !== null ? (
                  <input className="savings-auto w-full rounded border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text)] outline-none" id="savings" type="text" readOnly value={`${poValueCurrency} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(autoSavings)} (auto)`} />
                ) : (
                  <input className="w-full rounded border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" id="savings" type="number" step="0.01" placeholder="Manual (1 quote)" {...register('savings')} />
                )}
              </div>
            </div>
            <div className="form-group mt-3">
              <label className="mb-1 block text-sm font-medium" htmlFor="remarks">📝 Remarks</label>
              <input className="w-full rounded border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" id="remarks" type="text" placeholder="Optional notes" maxLength={500} {...register('remarks')} />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              ❌ Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-submit">
              💾 {quotation ? 'Update' : 'Add'} Quotation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
