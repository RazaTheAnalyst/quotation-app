import { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ENTITIES, STATUS_LIST } from '../types';
import type { Quotation, Forwarder } from '../types';
import { COUNTRIES, INCOTERMS_LIST, MODES_LIST } from '../locations';

const quotationSchema = z.object({
  entity: z.enum(['UAE', 'Qatar', 'Oman', 'KSA']),
  supplierName: z.string().min(1, 'Supplier name is required'),
  supplierPO: z.string().min(1, 'PO number is required'),
  poValue: z.coerce.number().positive('PO value must be greater than 0'),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  mode: z.string().min(1, 'Mode is required'),
  size: z.string().optional().default(''),
  transitTime: z.string().optional().default(''),
  incoterms: z.string().min(1, 'Incoterms are required'),
  quotes: z.array(z.object({
    forwarder: z.string(),
    quotedAmount: z.coerce.number().min(0, 'Amount must be 0 or more'),
  })),
  awardedTo: z.string().optional().default(''),
  remarks: z.string().optional().default(''),
  etd: z.string().optional().default(''),
  eta: z.string().optional().default(''),
  status: z.string().optional().default('Pending'),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

interface QuotationFormProps {
  quotation: Quotation | null;
  forwarders: Forwarder[];
  onSave: (data: QuotationFormData & { percentage: number }) => void;
  onClose: () => void;
}

export default function QuotationForm({ quotation, forwarders, onSave, onClose }: QuotationFormProps) {
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      entity: (quotation?.entity as 'UAE' | 'Qatar' | 'Oman' | 'KSA') ?? 'UAE',
      supplierName: quotation?.supplierName ?? '',
      supplierPO: quotation?.supplierPO ?? '',
      poValue: quotation?.poValue ?? 0,
      origin: quotation?.origin ?? '',
      destination: quotation?.destination ?? '',
      mode: quotation?.mode ?? '',
      size: quotation?.size ?? '',
      transitTime: quotation?.transitTime ?? '',
      incoterms: quotation?.incoterms ?? '',
      quotes: quotation?.quotes ?? forwarders.map(f => ({ forwarder: f.name, quotedAmount: 0 })),
      awardedTo: quotation?.awardedTo ?? '',
      remarks: quotation?.remarks ?? '',
      etd: quotation?.etd ?? '',
      eta: quotation?.eta ?? '',
      status: quotation?.status ?? 'Pending',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'quotes' });

  const poValue = watch('poValue');
  const awardedTo = watch('awardedTo');
  const quotes = watch('quotes');
  const originValue = watch('origin');
  const destinationValue = watch('destination');

  const [originSearch, setOriginSearch] = useState(quotation?.origin ?? '');
  const [destinationSearch, setDestinationSearch] = useState(quotation?.destination ?? '');
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);

  const awardedQuote = quotes.find(q => q.forwarder === awardedTo);
  const awardedAmount = awardedQuote?.quotedAmount ?? 0;
  const percentage = poValue > 0 ? ((awardedAmount / poValue) * 100).toFixed(2) : '0.00';

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
    const percentageVal = data.poValue > 0 && data.awardedTo
      ? ((data.quotes.find(q => q.forwarder === data.awardedTo)?.quotedAmount ?? 0) / data.poValue) * 100
      : 0;
    onSave({ ...data, percentage: Math.round(percentageVal * 100) / 100 } as QuotationFormData & { percentage: number });
  };

  const handleAddForwarder = () => {
    const lastForwarder = forwarders[forwarders.length - 1];
    append({ forwarder: lastForwarder?.name ?? '', quotedAmount: 0 });
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const renderLocationDropdown = (
    _type: 'origin' | 'destination',
    search: string,
    setSearch: (v: string) => void,
    show: boolean,
    setShow: (v: boolean) => void,
    filtered: typeof COUNTRIES,
    _selectedCountry: typeof COUNTRIES[number] | null,
    onSelect: (city: string, country: string) => void,
  ) => (
    <div className="location-dropdown-wrapper">
      <input
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
                      className={`location-city-btn ${selectedOriginCountry?.name === country.name && originValue === `${city}, ${country.name}` ? 'selected' : ''}`}
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={quotation ? 'Edit Quotation' : 'Add New Quotation'}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon">{quotation ? '\u270F\uFE0F' : '\u2795'}</span>
            <h2>{quotation ? 'Edit Quotation' : 'New Quotation'}</h2>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close">{'\u2715'}</button>
        </div>
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          {/* Section: PO Details */}
          <div className="form-section">
            <div className="form-section-header">
              <span className="section-icon">{'\uD83D\uDCCB'}</span>
              <span>PO Details</span>
            </div>
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label htmlFor="entity">{'\uD83C\uDF10'} Entity</label>
                <select id="entity" {...register('entity')}>
                  {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="supplierName">{'\uD83C\uDFED'} Supplier Name</label>
                <input id="supplierName" type="text" placeholder="Enter supplier name" {...register('supplierName')} />
                {errors.supplierName && <span className="error-text">{'\u26A0\uFE0F'} {errors.supplierName.message}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="supplierPO">{'\uD83D\uDCE0'} Supplier PO</label>
                <input id="supplierPO" type="text" placeholder="e.g. P227998" {...register('supplierPO')} />
                {errors.supplierPO && <span className="error-text">{'\u26A0\uFE0F'} {errors.supplierPO.message}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="poValue">{'\uD83D\uDCB0'} PO Value (AED)</label>
                <input id="poValue" type="number" step="0.01" placeholder="0.00" {...register('poValue')} />
                {errors.poValue && <span className="error-text">{'\u26A0\uFE0F'} {errors.poValue.message}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="mode">{'\uD83D\uDEE2\uFE0F'} Mode</label>
                <select id="mode" {...register('mode')}>
                  <option value="">-- Select Mode --</option>
                  {MODES_LIST.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                {errors.mode && <span className="error-text">{'\u26A0\uFE0F'} {errors.mode.message}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="incoterms">{'\uD83C\uDF10'} Incoterms</label>
                <select id="incoterms" {...register('incoterms')}>
                  <option value="">-- Select Incoterms --</option>
                  {INCOTERMS_LIST.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                </select>
                {errors.incoterms && <span className="error-text">{'\u26A0\uFE0F'} {errors.incoterms.message}</span>}
              </div>
            </div>
          </div>

          {/* Section: Route */}
          <div className="form-section">
            <div className="form-section-header">
              <span className="section-icon">{'\uD83D\uDDFA\uFE0F'}</span>
              <span>Route & Shipment</span>
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label>{'\uD83D\uDCCD'} Origin</label>
                {renderLocationDropdown('origin', originSearch, setOriginSearch, showOriginDropdown, setShowOriginDropdown, filteredOrigins, selectedOriginCountry, handleOriginCitySelect)}
                {errors.origin && <span className="error-text">{'\u26A0\uFE0F'} {errors.origin.message}</span>}
              </div>
              <div className="form-group">
                <label>{'\uD83C\uDFDF\uFE0F'} Destination</label>
                {renderLocationDropdown('destination', destinationSearch, setDestinationSearch, showDestinationDropdown, setShowDestinationDropdown, filteredDestinations, selectedDestCountry, handleDestCitySelect)}
                {errors.destination && <span className="error-text">{'\u26A0\uFE0F'} {errors.destination.message}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="size">{'\uD83D\uDCE6'} Size / Qty</label>
                <input id="size" type="text" placeholder="e.g. 1 x 40ft HQ" {...register('size')} />
              </div>
              <div className="form-group">
                <label htmlFor="transitTime">{'\u23F1\uFE0F'} Transit Time</label>
                <input id="transitTime" type="text" placeholder="e.g. 30 Days" {...register('transitTime')} />
              </div>
              <div className="form-group">
                <label htmlFor="etd">{'\u2693\uFE0F'} ETD</label>
                <input id="etd" type="date" {...register('etd')} />
              </div>
              <div className="form-group">
                <label htmlFor="eta">{'\uD83D\uDCCD'} ETA</label>
                <input id="eta" type="date" {...register('eta')} />
              </div>
            </div>
          </div>

          {/* Section: Forwarder Quotes */}
          <div className="form-section">
            <div className="form-section-header">
              <span className="section-icon">{'\uD83D\uDCB3'}</span>
              <span>Forwarder Quotes</span>
            </div>
            <div className="quotes-grid">
              {fields.map((field, index) => (
                <div key={field.id} className={`quote-card ${awardedTo === field.forwarder ? 'quote-card-active' : ''}`}>
                  <div className="quote-card-header">
                    <select
                      className="quote-card-forwarder-select"
                      {...register(`quotes.${index}.forwarder`)}
                    >
                      <option value="">-- Select --</option>
                      {forwarders.map(f => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                      ))}
                    </select>
                    {awardedTo === field.forwarder && <span className="quote-card-badge">{'\u2B50'} Awarded</span>}
                  </div>
                  <div className="quote-card-input">
                    <span className="quote-card-currency">AED</span>
                    <input
                      id={`quotes.${index}.quotedAmount`}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register(`quotes.${index}.quotedAmount` as const)}
                    />
                  </div>
                  {fields.length > 1 && (
                    <button type="button" className="quote-card-remove" onClick={() => remove(index)}>
                      {'\u2715'} Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-add-forwarder" onClick={handleAddForwarder}>
              {'\u2795'} Add Forwarder Quote
            </button>
          </div>

          {/* Section: Award & Remarks */}
          <div className="form-section">
            <div className="form-section-header">
              <span className="section-icon">{'\uD83C\uDFC6'}</span>
              <span>Award & Remarks</span>
            </div>
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label htmlFor="status">{'\uD83D\uDCCA'} Status</label>
                <select id="status" {...register('status')}>
                  {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="awardedTo">{'\u2B50'} Awarded To</label>
                <select id="awardedTo" {...register('awardedTo')}>
                  <option value="">-- Select Forwarder --</option>
                  {forwarders.map(f => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{'\uD83D\uDCCA'} Calculated %</label>
                <div className="percentage-display">
                  <div className="percentage-bar">
                    <div className="percentage-fill" style={{ width: `${Math.min(Number(percentage), 100)}%` }} />
                  </div>
                  <span className="percentage-value">{percentage}%</span>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="remarks">{'\uD83D\uDCDD'} Remarks</label>
                <input id="remarks" type="text" placeholder="Optional notes" {...register('remarks')} />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {'\u274C'} Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-submit">
              {quotation ? '\u{1F4BE} Update' : '\u2795 Add'} Quotation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
