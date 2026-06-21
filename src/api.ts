import type { Quotation, QuotationInput, Forwarder } from './types';
import { supabase } from './supabase';

// ─── Row types (snake_case from Supabase) ───
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
}

interface ForwarderRow {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
}

// ─── Mappers ───
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

function computePercentage(data: QuotationInput): number {
  const poValue = data.poValue ?? 0;
  if (poValue <= 0) return 0;
  const awardedQuote = data.quotes?.find(q => q.forwarder === data.awardedTo);
  const awardedAmount = awardedQuote?.quotedAmount ?? 0;
  return Math.round((awardedAmount / poValue) * 10000) / 100;
}

// ─── Quotations API ───
export async function fetchQuotations(): Promise<Quotation[]> {
  const { data, error } = await supabase
    .from('quotations')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return (data as QuotationRow[]).map(rowToQuotation);
}

export async function createQuotation(input: QuotationInput): Promise<Quotation> {
  const percentage = computePercentage(input);
  const { data, error } = await supabase
    .from('quotations')
    .insert(quotationInputToRow(input, percentage))
    .select()
    .single();
  if (error) throw error;
  return rowToQuotation(data as QuotationRow);
}

export async function updateQuotationAPI(id: number, input: Partial<QuotationInput> & { percentage?: number }): Promise<Quotation> {
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

  const { data, error } = await supabase
    .from('quotations')
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return rowToQuotation(data as QuotationRow);
}

export async function deleteQuotationAPI(id: number): Promise<void> {
  const { error } = await supabase
    .from('quotations')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─── Forwarders API ───
export async function fetchForwarders(): Promise<Forwarder[]> {
  const { data, error } = await supabase
    .from('forwarders')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return (data as ForwarderRow[]).map(rowToForwarder);
}

export async function createForwarderAPI(data: Omit<Forwarder, 'id'>): Promise<Forwarder> {
  const { data: row, error } = await supabase
    .from('forwarders')
    .insert(forwarderInputToRow(data))
    .select()
    .single();
  if (error) throw error;
  return rowToForwarder(row as ForwarderRow);
}

export async function deleteForwarderAPI(id: number): Promise<void> {
  const { error } = await supabase
    .from('forwarders')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
