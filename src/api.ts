import type { Quotation, QuotationInput, Forwarder } from './types';
import { supabase } from './supabase';

// --- Row types (snake_case from Supabase) ---
interface QuotationRow {
  id: number;
  entity: string | null;
  supplier_name: string | null;
  supplier_po: string | null;
  po_value: number | null;
  origin: string | null;
  destination: string | null;
  mode: string | null;
  size: string | null;
  transit_time: string | null;
  incoterms: string | null;
  quotes: unknown;
  awarded_to: string | null;
  remarks: string | null;
  percentage: number | null;
  etd: string | null;
  eta: string | null;
  status: string | null;
  savings: number | null;
}

interface ForwarderRow {
  id: number;
  name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
}

// --- Mappers ---
function rowToQuotation(row: QuotationRow): Quotation {
  // Handle quotes that might be stored as string, null, or with different key names
  let parsedQuotes: { forwarder: string; quotedAmount: number }[] = [];
  if (row.quotes != null) {
    if (typeof row.quotes === 'string') {
      try {
        const parsed = JSON.parse(row.quotes);
        if (Array.isArray(parsed)) {
          parsedQuotes = parsed.map((q: Record<string, unknown>) => ({
            forwarder: String(q.forwarder ?? ''),
            quotedAmount: Number(q.quotedAmount ?? q.quoted_amount ?? 0),
          }));
        }
      } catch {
        // quotes string is not valid JSON, leave as empty
      }
    } else if (Array.isArray(row.quotes)) {
      parsedQuotes = row.quotes.map((q) => {
        const obj = q as Record<string, unknown>;
        return {
          forwarder: String(obj.forwarder ?? ''),
          quotedAmount: Number(obj.quotedAmount ?? obj.quoted_amount ?? 0),
        };
      });
    }
  }

  return {
    id: row.id,
    entity: row.entity ?? '',
    supplierName: row.supplier_name ?? '',
    supplierPO: row.supplier_po ?? '',
    poValue: Number(row.po_value) || 0,
    origin: row.origin ?? '',
    destination: row.destination ?? '',
    mode: row.mode ?? '',
    size: row.size ?? '',
    transitTime: row.transit_time ?? '',
    incoterms: row.incoterms ?? '',
    quotes: parsedQuotes,
    awardedTo: row.awarded_to ?? '',
    remarks: row.remarks ?? '',
    percentage: Number(row.percentage) || 0,
    etd: row.etd ?? '',
    eta: row.eta ?? '',
    status: row.status ?? 'Pending',
    savings: Number(row.savings) || 0,
  };
}

function rowToForwarder(row: ForwarderRow): Forwarder {
  return {
    id: row.id,
    name: row.name ?? '',
    contactPerson: row.contact_person ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
  };
}

function quotationInputToRow(data: QuotationInput, percentage = 0) {
  return {
    entity: data.entity,
    supplier_name: data.supplierName,
    supplier_po: data.supplierPO,
    po_value: data.poValue,
    origin: data.origin,
    destination: data.destination,
    mode: data.mode,
    size: data.size,
    transit_time: data.transitTime,
    incoterms: data.incoterms,
    quotes: data.quotes,
    awarded_to: data.awardedTo,
    remarks: data.remarks,
    percentage,
    etd: data.etd ?? '',
    eta: data.eta ?? '',
    status: data.status ?? 'Pending',
    savings: data.savings ?? 0,
  };
}

function forwarderInputToRow(data: Omit<Forwarder, 'id'>) {
  return {
    name: data.name,
    contact_person: data.contactPerson,
    email: data.email,
    phone: data.phone,
  };
}

function safeMin(arr: number[]): number {
  if (arr.length === 0) return 0;
  let min = Infinity;
  for (const v of arr) { if (v < min) min = v; }
  return min;
}

function safeMax(arr: number[]): number {
  if (arr.length === 0) return 0;
  let max = -Infinity;
  for (const v of arr) { if (v > max) max = v; }
  return max;
}

function normalizeQuotes(raw: unknown): { forwarder: string; quotedAmount: number }[] {
  if (!raw) return [];
  let arr: unknown[];
  if (typeof raw === 'string') {
    try { arr = JSON.parse(raw); } catch { return []; }
  } else if (Array.isArray(raw)) {
    arr = raw;
  } else {
    return [];
  }
  return arr.map((q) => {
    const obj = q as Record<string, unknown>;
    return {
      forwarder: String(obj.forwarder ?? ''),
      quotedAmount: Number(obj.quotedAmount ?? obj.quoted_amount ?? 0),
    };
  });
}

function computePercentage(data: { poValue?: number; quotes?: { forwarder: string; quotedAmount: number }[] }): number {
  const poValue = data.poValue ?? 0;
  if (poValue <= 0) return 0;
  const validQuotes = (data.quotes ?? []).filter(q => q.quotedAmount > 0);
  if (validQuotes.length === 0) return 0;
  const lowestAmount = safeMin(validQuotes.map(q => q.quotedAmount));
  return Math.round((lowestAmount / poValue) * 10000) / 100;
}

function computeSavings(data: { quotes?: { forwarder: string; quotedAmount: number }[]; savings?: number }, manualSavings?: number): number {
  const validQuotes = (data.quotes ?? []).filter(q => q.quotedAmount > 0);
  if (validQuotes.length < 2) return manualSavings ?? data.savings ?? 0;
  const amounts = validQuotes.map(q => q.quotedAmount);
  const highest = safeMax(amounts);
  const lowest = safeMin(amounts);
  return Math.round((highest - lowest) * 100) / 100;
}

// --- Quotations API ---
export async function fetchQuotations(): Promise<Quotation[]> {
  const { data, error } = await supabase
    .from('quotations')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  console.log(`[API] Supabase returned ${rows.length} rows. IDs:`, rows.map((r: Record<string, unknown>) => r.id));
  const shkeRow = rows.find((r: Record<string, unknown>) => r.supplier_name === 'SHKE');
  if (shkeRow) {
    console.log('[API] SHKE row found:', shkeRow);
    console.log('[API] SHKE mapped:', rowToQuotation(shkeRow as QuotationRow));
  } else {
    console.warn('[API] SHKE row NOT found in Supabase response');
  }
  const quotations: Quotation[] = [];
  for (const row of rows) {
    try {
      quotations.push(rowToQuotation(row as QuotationRow));
    } catch (err) {
      console.error('Failed to map quotation row:', row?.id, err);
    }
  }
  return quotations;
}

export async function createQuotation(input: QuotationInput): Promise<Quotation> {
  const percentage = computePercentage(input);
  const savings = computeSavings(input);
  const { data, error } = await supabase
    .from('quotations')
    .insert({ ...quotationInputToRow(input, percentage), savings })
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('No data returned from create');
  return rowToQuotation(data as QuotationRow);
}

export async function updateQuotationAPI(id: number, input: Partial<QuotationInput> & { percentage?: number }): Promise<Quotation> {
  // First fetch the existing record to merge partial updates
  const { data: existing, error: fetchError } = await supabase
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchError) throw fetchError;
  if (!existing) throw new Error('Quotation not found');

  const existingRow = existing as QuotationRow;

  // Build merged data for recomputation
  const mergedQuotes = input.quotes !== undefined ? input.quotes : normalizeQuotes(existingRow.quotes);
  const mergedPoValue = input.poValue !== undefined ? input.poValue : (Number(existingRow.po_value) || 0);

  const row: Record<string, unknown> = {};
  if (input.entity !== undefined) row.entity = input.entity;
  if (input.supplierName !== undefined) row.supplier_name = input.supplierName;
  if (input.supplierPO !== undefined) row.supplier_po = input.supplierPO;
  if (input.poValue !== undefined) row.po_value = input.poValue;
  if (input.origin !== undefined) row.origin = input.origin;
  if (input.destination !== undefined) row.destination = input.destination;
  if (input.mode !== undefined) row.mode = input.mode;
  if (input.size !== undefined) row.size = input.size;
  if (input.transitTime !== undefined) row.transit_time = input.transitTime;
  if (input.incoterms !== undefined) row.incoterms = input.incoterms;
  if (input.quotes !== undefined) row.quotes = input.quotes;
  if (input.awardedTo !== undefined) row.awarded_to = input.awardedTo;
  if (input.remarks !== undefined) row.remarks = input.remarks;
  if (input.percentage !== undefined) row.percentage = input.percentage;
  if (input.etd !== undefined) row.etd = input.etd;
  if (input.eta !== undefined) row.eta = input.eta;
  if (input.status !== undefined) row.status = input.status;
  if (input.savings !== undefined) row.savings = input.savings;

  // Recompute percentage and savings using merged data
  if (input.quotes !== undefined || input.poValue !== undefined) {
    const percentage = computePercentage({ quotes: mergedQuotes, poValue: mergedPoValue });
    const savings = computeSavings({ quotes: mergedQuotes }, input.savings);
    row.percentage = percentage;
    row.savings = savings;
  }

  const { data, error } = await supabase
    .from('quotations')
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('No data returned from update');
  return rowToQuotation(data as QuotationRow);
}

export async function deleteQuotationAPI(id: number): Promise<void> {
  const { error } = await supabase
    .from('quotations')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// --- Forwarders API ---
export async function fetchForwarders(): Promise<Forwarder[]> {
  const { data, error } = await supabase
    .from('forwarders')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToForwarder);
}

export async function createForwarderAPI(data: Omit<Forwarder, 'id'>): Promise<Forwarder> {
  const { data: row, error } = await supabase
    .from('forwarders')
    .insert(forwarderInputToRow(data))
    .select()
    .single();
  if (error) throw error;
  if (!row) throw new Error('No data returned from create');
  return rowToForwarder(row as ForwarderRow);
}

export async function deleteForwarderAPI(id: number): Promise<void> {
  const { error } = await supabase
    .from('forwarders')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
