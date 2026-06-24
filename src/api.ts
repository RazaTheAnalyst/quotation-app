import type { Quotation, QuotationInput, Forwarder } from './types';
import { supabase } from './supabase';

// --- Row types (snake_case from Supabase) ---
interface QuotationRow {
  id: number;
  entity: string;
  supplier_name: string;
  supplier_po: string;
  po_value: number;
  origin: string;
  destination: string;
  mode: string;
  size: string;
  transit_time: string;
  incoterms: string;
  quotes: { forwarder: string; quotedAmount: number }[];
  awarded_to: string;
  remarks: string;
  percentage: number;
  etd: string;
  eta: string;
  status: string;
  savings: number;
}

interface ForwarderRow {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
}

// --- Mappers ---
function rowToQuotation(row: QuotationRow): Quotation {
  return {
    id: row.id,
    entity: row.entity,
    supplierName: row.supplier_name,
    supplierPO: row.supplier_po,
    poValue: row.po_value,
    origin: row.origin,
    destination: row.destination,
    mode: row.mode,
    size: row.size,
    transitTime: row.transit_time,
    incoterms: row.incoterms,
    quotes: row.quotes ?? [],
    awardedTo: row.awarded_to,
    remarks: row.remarks,
    percentage: row.percentage,
    etd: row.etd ?? '',
    eta: row.eta ?? '',
    status: row.status ?? 'Pending',
    savings: row.savings ?? 0,
  };
}

function rowToForwarder(row: ForwarderRow): Forwarder {
  return {
    id: row.id,
    name: row.name,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
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
  return (data ?? []).map(rowToQuotation);
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
  const mergedQuotes = input.quotes !== undefined ? input.quotes : (existingRow.quotes ?? []);
  const mergedPoValue = input.poValue !== undefined ? input.poValue : existingRow.po_value;

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
